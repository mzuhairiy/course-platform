"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "@/schemas/profile";
import {
  getUserPasswordHash,
  updateUserPassword,
  updateUserProfile,
} from "@/server/services/user";

const BCRYPT_ROUNDS = 12;

export type FieldErrors = Partial<Record<string, string>>;

export type ProfileActionResult =
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

/** First message per field from a Zod error, for inline form display. */
function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}

/**
 * Update the signed-in user's name, avatar, and bio. The user id is always
 * taken from the session — never from the client — and role/email are never
 * touched here.
 */
export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<ProfileActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Sesi tidak ditemukan. Silakan login ulang." };
  }

  const { name, bio, image } = parsed.data;
  await updateUserProfile(user.id, {
    name,
    bio: bio === "" ? null : bio,
    image: image === "" ? null : image,
  });

  // Refresh every layout so the navbar reflects the new name/avatar.
  revalidatePath("/", "layout");

  return { status: "success" };
}

/**
 * Change the signed-in user's password. Verifies the current password against
 * the stored bcrypt hash before updating. Never logs password values.
 */
export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ProfileActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Sesi tidak ditemukan. Silakan login ulang." };
  }

  const record = await getUserPasswordHash(user.id);
  if (!record?.password) {
    return {
      status: "error",
      message: "Akun ini tidak memakai password.",
    };
  }

  const currentValid = await bcrypt.compare(
    parsed.data.currentPassword,
    record.password,
  );
  if (!currentValid) {
    return {
      status: "error",
      message: "Password saat ini salah",
      fieldErrors: { currentPassword: "Password saat ini salah" },
    };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);
  await updateUserPassword(user.id, newHash);

  return { status: "success" };
}
