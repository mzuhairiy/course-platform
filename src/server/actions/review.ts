"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { toFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { reviewSchema, type ReviewInput } from "@/schemas/review";
import {
  deleteReview,
  NotEnrolledError,
  upsertReview,
} from "@/server/services/review";

export type ReviewActionResult =
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

export async function submitReviewAction(
  courseId: string,
  courseSlug: string,
  input: ReviewInput,
): Promise<ReviewActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Kamu harus login untuk memberi review." };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await upsertReview(user.id, courseId, parsed.data);
  } catch (error) {
    if (error instanceof NotEnrolledError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }

  revalidatePath(`/courses/${courseSlug}`);
  return { status: "success", message: "Review tersimpan" };
}

export async function deleteReviewAction(
  courseId: string,
  courseSlug: string,
): Promise<ReviewActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Kamu harus login." };
  }

  await deleteReview(user.id, courseId);
  revalidatePath(`/courses/${courseSlug}`);
  return { status: "success", message: "Review dihapus" };
}
