import "server-only";

import { CourseStatus, Prisma, UserRole } from "@prisma/client";

import { db } from "@/lib/db";

// select (not include) so sensitive fields like email/password are never read.
const instructorSelect = {
  id: true,
  name: true,
  image: true,
  _count: {
    select: { authoredCourses: { where: { status: CourseStatus.PUBLISHED } } },
  },
} satisfies Prisma.UserSelect;

export type SpotlightInstructor = Prisma.UserGetPayload<{
  select: typeof instructorSelect;
}>;

export function getSpotlightInstructors(limit = 2) {
  return db.user.findMany({
    where: {
      role: UserRole.INSTRUCTOR,
      authoredCourses: { some: { status: CourseStatus.PUBLISHED } },
    },
    select: instructorSelect,
    take: limit,
  });
}
