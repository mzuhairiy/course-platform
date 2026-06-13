"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { findEnrollment } from "@/server/services/enrollment";
import {
  getLectureCourseId,
  markLectureComplete,
  updateLectureProgress,
} from "@/server/services/progress";

export type ProgressActionResult =
  | { status: "success"; isCompleted: boolean }
  | { status: "error"; message: string };

const videoProgressSchema = z.object({
  lectureId: z.string().min(1),
  watchedSeconds: z.number().int().nonnegative(),
});

const markCompleteSchema = z.object({
  lectureId: z.string().min(1),
});

/**
 * Guard shared by both actions: resolves the signed-in user and verifies they
 * are enrolled in the course that owns the lecture. The userId always comes
 * from the session — never the client.
 */
type AuthorizeResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

async function authorizeLecture(lectureId: string): Promise<AuthorizeResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sesi tidak ditemukan. Silakan login ulang." };
  }

  const courseId = await getLectureCourseId(lectureId);
  if (!courseId) {
    return { ok: false, message: "Lecture tidak ditemukan." };
  }

  const enrollment = await findEnrollment(user.id, courseId);
  if (!enrollment) {
    return { ok: false, message: "Kamu belum enroll di course ini." };
  }

  return { ok: true, userId: user.id };
}

export async function saveVideoProgressAction(
  input: z.infer<typeof videoProgressSchema>,
): Promise<ProgressActionResult> {
  const parsed = videoProgressSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Input tidak valid" };
  }

  const auth = await authorizeLecture(parsed.data.lectureId);
  if (!auth.ok) {
    return { status: "error", message: auth.message };
  }

  const progress = await updateLectureProgress(
    auth.userId,
    parsed.data.lectureId,
    parsed.data.watchedSeconds,
  );
  const isCompleted = progress?.isCompleted ?? false;

  // Only refresh the dashboard/my-courses cards once a lecture is completed;
  // the periodic watched-seconds saves don't need to bust any cache.
  if (isCompleted) {
    revalidatePath("/dashboard");
    revalidatePath("/my-courses");
  }

  return { status: "success", isCompleted };
}

export async function markLectureCompleteAction(
  input: z.infer<typeof markCompleteSchema>,
): Promise<ProgressActionResult> {
  const parsed = markCompleteSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Input tidak valid" };
  }

  const auth = await authorizeLecture(parsed.data.lectureId);
  if (!auth.ok) {
    return { status: "error", message: auth.message };
  }

  await markLectureComplete(auth.userId, parsed.data.lectureId);
  revalidatePath("/dashboard");
  revalidatePath("/my-courses");

  return { status: "success", isCompleted: true };
}
