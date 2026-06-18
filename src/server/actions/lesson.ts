"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { ForbiddenError, requireRole } from "@/lib/rbac";
import { toFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { lessonSchema, type LessonInput } from "@/schemas/lesson";
import { CourseNotFoundError } from "@/server/services/course";
import {
  addLesson,
  deleteLesson,
  LessonNotFoundError,
  moveLesson,
  updateLesson,
  type LessonActor,
} from "@/server/services/lesson";

export type LessonActionResult =
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

function lessonsPath(courseId: string) {
  return `/instructor/courses/${courseId}/lessons`;
}

function toErrorResult(error: unknown): LessonActionResult {
  if (
    error instanceof ForbiddenError ||
    error instanceof CourseNotFoundError ||
    error instanceof LessonNotFoundError
  ) {
    return { status: "error", message: error.message };
  }
  throw error;
}

export async function addLessonAction(
  courseId: string,
  input: LessonInput,
): Promise<LessonActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const actor: LessonActor = { id: user.id, role: user.role };
  try {
    await addLesson(courseId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(lessonsPath(courseId));
  return { status: "success", message: "Lesson ditambahkan" };
}

export async function updateLessonAction(
  courseId: string,
  lectureId: string,
  input: LessonInput,
): Promise<LessonActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const actor: LessonActor = { id: user.id, role: user.role };
  try {
    await updateLesson(lectureId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(lessonsPath(courseId));
  return { status: "success", message: "Lesson diperbarui" };
}

export async function deleteLessonAction(
  courseId: string,
  lectureId: string,
): Promise<LessonActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  const actor: LessonActor = { id: user.id, role: user.role };

  try {
    await deleteLesson(lectureId, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(lessonsPath(courseId));
  return { status: "success", message: "Lesson dihapus" };
}

export async function moveLessonAction(
  courseId: string,
  lectureId: string,
  direction: "up" | "down",
): Promise<LessonActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  const actor: LessonActor = { id: user.id, role: user.role };

  try {
    await moveLesson(lectureId, direction, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(lessonsPath(courseId));
  return { status: "success" };
}
