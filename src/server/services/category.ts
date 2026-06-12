import "server-only";

import { CourseStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

const categoryWithCountArgs = {
  orderBy: { name: "asc" },
  include: {
    _count: {
      select: { courses: { where: { status: CourseStatus.PUBLISHED } } },
    },
  },
} satisfies Prisma.CategoryFindManyArgs;

export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: (typeof categoryWithCountArgs)["include"];
}>;

export function getCategoriesWithCourseCount() {
  return db.category.findMany(categoryWithCountArgs);
}
