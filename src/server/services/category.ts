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

/** id + name for the course form category dropdown, alphabetical. */
export function getCategoryOptions() {
  return db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export type CategoryOption = { id: string; name: string };

/** Categories surfaced as top-level nav items, in display order. */
const NAV_CATEGORY_SLUGS: readonly string[] = [
  "programming",
  "design",
  "business",
];

const navCategorySelect = {
  id: true,
  name: true,
  slug: true,
  courses: {
    where: { status: CourseStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true },
  },
} satisfies Prisma.CategorySelect;

export type NavCategory = Prisma.CategoryGetPayload<{
  select: typeof navCategorySelect;
}>;

/** Nav categories + their published courses, ordered per NAV_CATEGORY_SLUGS. */
export async function getNavCategories(): Promise<NavCategory[]> {
  const categories = await db.category.findMany({
    where: { slug: { in: [...NAV_CATEGORY_SLUGS] } },
    select: navCategorySelect,
  });
  return [...categories].sort(
    (a, b) =>
      NAV_CATEGORY_SLUGS.indexOf(a.slug) - NAV_CATEGORY_SLUGS.indexOf(b.slug),
  );
}
