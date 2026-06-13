import "server-only";

import { CourseStatus, Prisma } from "@prisma/client";
import { cache } from "react";

import {
  PER_PAGE,
  type CourseFilters,
  type SortValue,
} from "@/lib/course-filters";
import { db } from "@/lib/db";

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
          videoPlaybackId: true,
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

/** Minimal course data needed by the free-enrollment action. */
export function getCourseEnrollmentTarget(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
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
