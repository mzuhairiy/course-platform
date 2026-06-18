import "server-only";

import { CourseStatus, Prisma, UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/rbac";

export type AdminActor = { id: string; role: UserRole };

export class SelfRoleChangeError extends Error {
  constructor() {
    super("Anda tidak bisa mengubah role Anda sendiri.");
    this.name = "SelfRoleChangeError";
  }
}

function assertAdmin(actor: AdminActor) {
  if (actor.role !== UserRole.ADMIN) {
    throw new ForbiddenError("Hanya admin yang bisa melakukan ini.");
  }
}

/** Soft-remove from public listing. ADMIN-only (instructors can't archive). */
export async function archiveCourse(courseId: string, actor: AdminActor) {
  assertAdmin(actor);
  return db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.ARCHIVED },
    select: { id: true },
  });
}

/** Bring an archived course back to DRAFT. ADMIN-only. */
export async function unarchiveCourse(courseId: string, actor: AdminActor) {
  assertAdmin(actor);
  return db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.DRAFT },
    select: { id: true },
  });
}

export async function changeUserRole(
  targetUserId: string,
  role: UserRole,
  actor: AdminActor,
) {
  assertAdmin(actor);
  // Guard against an admin locking themselves out (or self-demotion).
  if (targetUserId === actor.id) {
    throw new SelfRoleChangeError();
  }
  return db.user.update({
    where: { id: targetUserId },
    data: { role },
    select: { id: true, role: true },
  });
}

export type AdminCourseFilters = {
  status?: CourseStatus;
  instructorId?: string;
  categoryId?: string;
};

const adminCourseSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  createdAt: true,
  instructor: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseSelect;

export type AdminCourseRow = Prisma.CourseGetPayload<{
  select: typeof adminCourseSelect;
}>;

export function getAdminCourses(filters: AdminCourseFilters = {}) {
  return db.course.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.instructorId ? { instructorId: filters.instructorId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    select: adminCourseSelect,
    orderBy: { createdAt: "desc" },
  });
}

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  _count: { select: { enrollments: true } },
} satisfies Prisma.UserSelect;

export type AdminUserRow = Prisma.UserGetPayload<{
  select: typeof adminUserSelect;
}>;

export function getAdminUsers() {
  return db.user.findMany({
    select: adminUserSelect,
    orderBy: { createdAt: "desc" },
  });
}

/** id + name for the admin course filter dropdown. */
export function getInstructorOptions() {
  return db.user.findMany({
    where: { role: { in: [UserRole.INSTRUCTOR, UserRole.ADMIN] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
