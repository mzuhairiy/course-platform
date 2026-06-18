"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/rbac";
import { toFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { courseFormSchema, type CourseFormInput } from "@/schemas/course";
import {
  CourseEmptyContentError,
  CourseHasEnrollmentsError,
  CourseNotFoundError,
  createCourse,
  deleteCourse,
  publishCourse,
  slugExists,
  unpublishCourse,
  updateCourse,
  type CourseActor,
} from "@/server/services/course";
import { ForbiddenError } from "@/lib/rbac";

export type CourseActionResult =
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

const SLUG_TAKEN: FieldErrors = { slug: "Slug ini sudah dipakai course lain" };

const COURSES_PATH = "/instructor/courses";

/** Map known service errors to a user-facing result; rethrow the unexpected. */
function toErrorResult(error: unknown): CourseActionResult {
  if (
    error instanceof CourseHasEnrollmentsError ||
    error instanceof CourseEmptyContentError ||
    error instanceof ForbiddenError ||
    error instanceof CourseNotFoundError
  ) {
    return { status: "error", message: error.message };
  }
  throw error;
}

/**
 * Create a DRAFT course. Role is enforced (INSTRUCTOR/ADMIN) and instructorId
 * comes from the session — never the client. Redirects to the edit page so the
 * instructor can build the curriculum next.
 */
export async function createCourseAction(
  input: CourseFormInput,
): Promise<CourseActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

  const parsed = courseFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (await slugExists(parsed.data.slug)) {
    return { status: "error", message: "Slug sudah dipakai", fieldErrors: SLUG_TAKEN };
  }

  const created = await createCourse(parsed.data, user.id);

  revalidatePath(COURSES_PATH);
  // redirect() throws — must be outside any try/catch.
  redirect(`${COURSES_PATH}/${created.id}/edit`);
}

export async function updateCourseAction(
  courseId: string,
  input: CourseFormInput,
): Promise<CourseActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

  const parsed = courseFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (await slugExists(parsed.data.slug, courseId)) {
    return { status: "error", message: "Slug sudah dipakai", fieldErrors: SLUG_TAKEN };
  }

  const actor: CourseActor = { id: user.id, role: user.role };
  try {
    await updateCourse(courseId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(COURSES_PATH);
  revalidatePath(`${COURSES_PATH}/${courseId}/edit`);
  return { status: "success", message: "Perubahan disimpan" };
}

export async function deleteCourseAction(
  courseId: string,
): Promise<CourseActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  const actor: CourseActor = { id: user.id, role: user.role };

  try {
    await deleteCourse(courseId, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(COURSES_PATH);
  redirect(COURSES_PATH);
}

export async function publishCourseAction(
  courseId: string,
): Promise<CourseActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  const actor: CourseActor = { id: user.id, role: user.role };

  try {
    await publishCourse(courseId, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(COURSES_PATH);
  revalidatePath(`${COURSES_PATH}/${courseId}/edit`);
  return { status: "success", message: "Course dipublish" };
}

export async function unpublishCourseAction(
  courseId: string,
): Promise<CourseActionResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  const actor: CourseActor = { id: user.id, role: user.role };

  try {
    await unpublishCourse(courseId, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(COURSES_PATH);
  revalidatePath(`${COURSES_PATH}/${courseId}/edit`);
  return { status: "success", message: "Course di-unpublish" };
}
