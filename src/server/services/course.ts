import "server-only";

import { CourseStatus, Prisma, UserRole } from "@prisma/client";
import { cache } from "react";

import {
  PER_PAGE,
  type CourseFilters,
  type SortValue,
} from "@/lib/course-filters";
import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/rbac";
import type { CourseFormInput } from "@/schemas/course";

// Never select the instructor's sensitive fields (e.g. password).
const courseCardInclude = {
  instructor: { select: { id: true, name: true, image: true } },
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.CourseInclude;

export type CourseCardData = Prisma.CourseGetPayload<{
  include: typeof courseCardInclude;
}>;

export function getFeaturedCourses(limit = 3) {
  return db.course.findMany({
    where: { status: CourseStatus.PUBLISHED },
    include: courseCardInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/**
 * Recommended courses for a course detail page: most-enrolled PUBLISHED courses
 * in the same category (excluding the current one). Falls back to overall
 * popular when the course has no category.
 */
export function getRelatedCourses(
  courseId: string,
  categoryId: string | null,
  limit = 3,
) {
  return db.course.findMany({
    where: {
      status: CourseStatus.PUBLISHED,
      id: { not: courseId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: courseCardInclude,
    orderBy: { enrollments: { _count: "desc" } },
    take: limit,
  });
}

function sortToOrderBy(sort: SortValue): Prisma.CourseOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "popular":
      return { enrollments: { _count: "desc" } };
    case "newest":
    default:
      return { publishedAt: "desc" };
  }
}

/** Case-insensitive keyword match on title + subtitle. */
function keywordWhere(query: string): Prisma.CourseWhereInput {
  return {
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { subtitle: { contains: query, mode: "insensitive" } },
    ],
  };
}

export async function getCoursesWithCount(filters: CourseFilters) {
  const where: Prisma.CourseWhereInput = {
    status: CourseStatus.PUBLISHED,
    ...(filters.q ? keywordWhere(filters.q) : {}),
    ...(filters.categories.length > 0
      ? { category: { slug: { in: filters.categories } } }
      : {}),
    ...(filters.instructor ? { instructorId: filters.instructor } : {}),
    ...(filters.levels.length > 0 ? { level: { in: filters.levels } } : {}),
    ...(filters.price === "free"
      ? { price: 0 }
      : filters.price === "paid"
        ? { price: { gt: 0 } }
        : {}),
  };

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      include: courseCardInclude,
      orderBy: sortToOrderBy(filters.sort),
      skip: (filters.page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.course.count({ where }),
  ]);

  return { courses, total };
}

const courseDetailInclude = {
  instructor: { select: { id: true, name: true, image: true, bio: true } },
  category: { select: { id: true, name: true, slug: true } },
  sections: {
    orderBy: { order: "asc" },
    include: {
      lectures: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          order: true,
          durationSeconds: true,
        },
      },
    },
  },
} satisfies Prisma.CourseInclude;

export type CourseDetail = Prisma.CourseGetPayload<{
  include: typeof courseDetailInclude;
}>;

// Wrapped in React cache so the page and generateMetadata share one query.
export const getCourseDetailBySlug = cache((slug: string) =>
  db.course.findUnique({
    where: { slug },
    include: courseDetailInclude,
  }),
);

const courseLearnSelect = {
  id: true,
  slug: true,
  title: true,
  status: true,
  sections: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      lectures: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          order: true,
          durationSeconds: true,
          contentMd: true,
          videoUrl: true,
        },
      },
    },
  },
} satisfies Prisma.CourseSelect;

export type CourseForLearn = Prisma.CourseGetPayload<{
  select: typeof courseLearnSelect;
}>;
export type LearnLecture =
  CourseForLearn["sections"][number]["lectures"][number];

export function getCourseForLearn(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: courseLearnSelect,
  });
}

const searchResultSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  category: { select: { name: true } },
} satisfies Prisma.CourseSelect;

/** Live-search for the navbar suggestions dropdown. PUBLISHED only. */
export function searchPublishedCourses(query: string, limit: number) {
  return db.course.findMany({
    where: { status: CourseStatus.PUBLISHED, ...keywordWhere(query) },
    select: searchResultSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/** Course title/slug + instructor name for certificate rendering. */
export function getCourseCertificateMeta(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      slug: true,
      instructor: { select: { name: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Instructor course management (Fase 4 Prompt K)
// ─────────────────────────────────────────────────────────────────────────────

/** Who is acting on a course — drives ownership checks (ADMIN bypasses). */
export type CourseActor = { id: string; role: UserRole };

export class CourseNotFoundError extends Error {
  constructor() {
    super("Course tidak ditemukan.");
    this.name = "CourseNotFoundError";
  }
}

export class CourseHasEnrollmentsError extends Error {
  constructor() {
    super("Course dengan siswa terdaftar tidak bisa dihapus.");
    this.name = "CourseHasEnrollmentsError";
  }
}

export class CourseEmptyContentError extends Error {
  constructor() {
    super("Tambahkan minimal 1 lesson sebelum publish.");
    this.name = "CourseEmptyContentError";
  }
}

/** An instructor may only touch their own courses; ADMIN may touch any. */
function assertOwnership(instructorId: string, actor: CourseActor) {
  if (actor.role !== UserRole.ADMIN && instructorId !== actor.id) {
    throw new ForbiddenError("Anda bukan pemilik course ini.");
  }
}

/** True when the slug is already used by a different course. */
export async function slugExists(slug: string, exceptCourseId?: string) {
  const found = await db.course.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found != null && found.id !== exceptCourseId;
}

/** Create a DRAFT course owned by `instructorId` (never trusted from client). */
export function createCourse(data: CourseFormInput, instructorId: string) {
  return db.course.create({
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description,
      categoryId: data.categoryId,
      level: data.level,
      price: data.price,
      language: data.language,
      coverLabel: data.coverLabel || null,
      slug: data.slug,
      status: CourseStatus.DRAFT,
      instructorId,
    },
    select: { id: true },
  });
}

export async function updateCourse(
  courseId: string,
  data: CourseFormInput,
  actor: CourseActor,
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) throw new CourseNotFoundError();
  assertOwnership(course.instructorId, actor);

  return db.course.update({
    where: { id: courseId },
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description,
      categoryId: data.categoryId,
      level: data.level,
      price: data.price,
      language: data.language,
      coverLabel: data.coverLabel || null,
      slug: data.slug,
    },
    select: { id: true },
  });
}

/** Hard-delete a course (cascades sections/lectures). Blocked if enrolled. */
export async function deleteCourse(courseId: string, actor: CourseActor) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      instructorId: true,
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) throw new CourseNotFoundError();
  assertOwnership(course.instructorId, actor);
  if (course._count.enrollments > 0) throw new CourseHasEnrollmentsError();

  await db.course.delete({ where: { id: courseId } });
}

/** Publish: requires ≥1 lecture. publishedAt is stamped once and preserved. */
export async function publishCourse(courseId: string, actor: CourseActor) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      instructorId: true,
      publishedAt: true,
      sections: { select: { _count: { select: { lectures: true } } } },
    },
  });
  if (!course) throw new CourseNotFoundError();
  assertOwnership(course.instructorId, actor);

  const hasContent = course.sections.some((s) => s._count.lectures > 0);
  if (!hasContent) throw new CourseEmptyContentError();

  return db.course.update({
    where: { id: courseId },
    data: {
      status: CourseStatus.PUBLISHED,
      // Keep the original publish timestamp on re-publish (history).
      publishedAt: course.publishedAt ?? new Date(),
    },
    select: { id: true },
  });
}

/** Unpublish back to DRAFT; publishedAt is intentionally preserved. */
export async function unpublishCourse(courseId: string, actor: CourseActor) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) throw new CourseNotFoundError();
  assertOwnership(course.instructorId, actor);

  return db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.DRAFT },
    select: { id: true },
  });
}

const instructorCourseSelect = {
  id: true,
  slug: true,
  title: true,
  status: true,
  price: true,
  thumbnailUrl: true,
  coverLabel: true,
  createdAt: true,
  category: { select: { name: true } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseSelect;

export type InstructorCourseListItem = Prisma.CourseGetPayload<{
  select: typeof instructorCourseSelect;
}>;

/** All courses owned by an instructor, newest first, optionally by status. */
export function getInstructorCourses(
  instructorId: string,
  status?: CourseStatus,
) {
  return db.course.findMany({
    where: { instructorId, ...(status ? { status } : {}) },
    select: instructorCourseSelect,
    orderBy: { createdAt: "desc" },
  });
}

const courseEditSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  description: true,
  categoryId: true,
  level: true,
  language: true,
  price: true,
  coverLabel: true,
  status: true,
  instructorId: true,
  _count: { select: { enrollments: true } },
  sections: { select: { id: true, _count: { select: { lectures: true } } } },
} satisfies Prisma.CourseSelect;

export type CourseForEdit = Prisma.CourseGetPayload<{
  select: typeof courseEditSelect;
}>;

export function getCourseForEdit(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: courseEditSelect,
  });
}

/** Course summary for the checkout/order page (by id). */
export function getCheckoutCourse(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      status: true,
      thumbnailUrl: true,
      coverLabel: true,
      instructor: { select: { name: true } },
    },
  });
}

/** Just enough to gate a course sub-page (ownership) and render its header. */
export function getCourseOwnerMeta(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, slug: true, status: true, instructorId: true },
  });
}

/** Minimal course data needed by the free-enrollment action. */
export function getCourseEnrollmentTarget(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      price: true,
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
  });
}
