import "server-only";

import { CourseStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { assertAdmin, type AdminActor } from "@/server/services/admin";
import type { CategoryFormInput } from "@/schemas/category";

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

// ─────────────────────────────────────────────────────────────────────────────
// Admin CRUD
// ─────────────────────────────────────────────────────────────────────────────

export class CategoryInUseError extends Error {
  constructor(courseCount: number, expertCount: number) {
    super(
      `Kategori masih dipakai oleh ${courseCount} course dan ${expertCount} expert.`,
    );
    this.name = "CategoryInUseError";
  }
}

/** True when the slug is already used by a different category. */
export async function categorySlugExists(
  slug: string,
  exceptCategoryId?: string,
) {
  const found = await db.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found != null && found.id !== exceptCategoryId;
}

const adminCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  _count: { select: { courses: true, experts: true } },
} satisfies Prisma.CategorySelect;

export type AdminCategoryRow = Prisma.CategoryGetPayload<{
  select: typeof adminCategorySelect;
}>;

export function getAdminCategories() {
  return db.category.findMany({
    select: adminCategorySelect,
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  input: CategoryFormInput,
  actor: AdminActor,
) {
  assertAdmin(actor);
  return db.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
    },
    select: { id: true },
  });
}

export async function updateCategory(
  categoryId: string,
  input: CategoryFormInput,
  actor: AdminActor,
) {
  assertAdmin(actor);
  return db.category.update({
    where: { id: categoryId },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
    },
    select: { id: true },
  });
}

export async function deleteCategory(categoryId: string, actor: AdminActor) {
  assertAdmin(actor);

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { _count: { select: { courses: true, experts: true } } },
  });

  if (category && (category._count.courses > 0 || category._count.experts > 0)) {
    throw new CategoryInUseError(
      category._count.courses,
      category._count.experts,
    );
  }

  return db.category.delete({
    where: { id: categoryId },
    select: { id: true },
  });
}
