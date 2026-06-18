"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";
import { getRoleHomePath } from "@/config/roles";
import { signIn, signOut } from "@/lib/auth";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/schemas/auth";
import { createUser, getUserByEmail } from "@/server/services/user";

export type AuthActionResult = { error: string } | undefined;

const BCRYPT_ROUNDS = 12;

export async function signInAction(
  input: SignInInput,
  callbackUrl?: string,
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Input tidak valid" };
  }

  // Land each persona on its own home. An explicit callbackUrl (e.g. a deep
  // link the user was sent to sign in for) takes precedence; the middleware
  // still bounces it if it points at the wrong persona's surface.
  const user = await getUserByEmail(parsed.data.email);
  const redirectTo = callbackUrl || getRoleHomePath(user?.role);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    // signIn throws a redirect on success; only swallow real auth errors.
    if (error instanceof AuthError) {
      return { error: "Email atau password salah" };
    }
    throw error;
  }

  return undefined;
}

export async function signUpAction(
  input: SignUpInput,
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Input tidak valid" };
  }

  const { name, email, password } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "Email sudah terdaftar" };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await createUser({ name, email, passwordHash });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Akun berhasil dibuat, tapi gagal login otomatis. Silakan sign in.",
      };
    }
    throw error;
  }

  return undefined;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
