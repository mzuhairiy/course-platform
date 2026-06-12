import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export function findEnrollment(userId: string, courseId: string) {
  return db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

/** Idempotent: safe to call even if the user is already enrolled. */
export function createEnrollment(userId: string, courseId: string) {
  return db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
  });
}

const enrolledCourseInclude = {
  course: {
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnailUrl: true,
      instructor: { select: { name: true } },
      sections: {
        orderBy: { order: "asc" },
        take: 1,
        select: {
          lectures: {
            orderBy: { order: "asc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  },
} satisfies Prisma.EnrollmentInclude;

export type EnrolledCourse = Prisma.EnrollmentGetPayload<{
  include: typeof enrolledCourseInclude;
}>;

export function getEnrolledCourses(userId: string, limit?: number) {
  return db.enrollment.findMany({
    where: { userId },
    include: enrolledCourseInclude,
    orderBy: { enrolledAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getEnrollmentStats(userId: string) {
  const [total, completed] = await Promise.all([
    db.enrollment.count({ where: { userId } }),
    db.enrollment.count({ where: { userId, completedAt: { not: null } } }),
  ]);
  return { total, completed };
}
