"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ForbiddenError, requireRole } from "@/lib/rbac";
import {
  archiveCourse,
  changeUserRole,
  SelfRoleChangeError,
  unarchiveCourse,
  type AdminActor,
} from "@/server/services/admin";

export type AdminActionResult =
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

const roleSchema = z.enum([
  UserRole.STUDENT,
  UserRole.INSTRUCTOR,
  UserRole.ADMIN,
]);

function toErrorResult(error: unknown): AdminActionResult {
  if (error instanceof ForbiddenError || error instanceof SelfRoleChangeError) {
    return { status: "error", message: error.message };
  }
  throw error;
}

export async function archiveCourseAction(
  courseId: string,
): Promise<AdminActionResult> {
  const user = await requireRole(UserRole.ADMIN);
  const actor: AdminActor = { id: user.id, role: user.role };
  try {
    await archiveCourse(courseId, actor);
  } catch (error) {
    return toErrorResult(error);
  }
  revalidatePath("/admin/courses");
  return { status: "success", message: "Course diarsipkan" };
}

export async function unarchiveCourseAction(
  courseId: string,
): Promise<AdminActionResult> {
  const user = await requireRole(UserRole.ADMIN);
  const actor: AdminActor = { id: user.id, role: user.role };
  try {
    await unarchiveCourse(courseId, actor);
  } catch (error) {
    return toErrorResult(error);
  }
  revalidatePath("/admin/courses");
  return { status: "success", message: "Course di-unarchive (DRAFT)" };
}

export async function changeUserRoleAction(
  targetUserId: string,
  role: string,
): Promise<AdminActionResult> {
  const user = await requireRole(UserRole.ADMIN);

  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) {
    return { status: "error", message: "Role tidak valid" };
  }

  const actor: AdminActor = { id: user.id, role: user.role };
  try {
    await changeUserRole(targetUserId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }
  revalidatePath("/admin/users");
  return { status: "success", message: "Role pengguna diperbarui" };
}
