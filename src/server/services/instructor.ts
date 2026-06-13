import "server-only";

import { CourseStatus, Prisma, UserRole } from "@prisma/client";

import { db } from "@/lib/db";

// Only PUBLISHED courses count toward an instructor's showcased course total.
const publishedCourses = { where: { status: CourseStatus.PUBLISHED } };

// select (not include) so sensitive fields like email/password are never read.
const showcaseSelect = {
  id: true,
  name: true,
  image: true,
  headline: true,
  expertise: { select: { name: true, slug: true } },
  _count: { select: { authoredCourses: publishedCourses } },
} satisfies Prisma.UserSelect;

export type ShowcaseInstructor = Prisma.UserGetPayload<{
  select: typeof showcaseSelect;
}>;

/**
 * Instructors for the "learn from the best" carousel. Only instructors who
 * actually teach at least one published course are surfaced, so no card ever
 * shows "0 course".
 */
export function getShowcaseInstructors() {
  return db.user.findMany({
    where: {
      role: UserRole.INSTRUCTOR,
      authoredCourses: { some: { status: CourseStatus.PUBLISHED } },
    },
    select: showcaseSelect,
    orderBy: { name: "asc" },
  });
}

/** Display name for the `?instructor=` filter chip on the courses page. */
export function getInstructorName(id: string) {
  return db.user.findFirst({
    where: { id, role: UserRole.INSTRUCTOR },
    select: { id: true, name: true },
  });
}
