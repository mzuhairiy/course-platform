import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { ReviewInput } from "@/schemas/review";
import { findEnrollment } from "@/server/services/enrollment";

export type RatingSummary = { average: number; count: number };

export class NotEnrolledError extends Error {
  constructor() {
    super("Hanya siswa yang terdaftar yang bisa memberi review.");
    this.name = "NotEnrolledError";
  }
}

function roundAvg(value: number | null): number {
  return value == null ? 0 : Math.round(value * 10) / 10;
}

/** Average rating (1 decimal) + count for one course. */
export async function getCourseRatingSummary(
  courseId: string,
): Promise<RatingSummary> {
  const agg = await db.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return { average: roundAvg(agg._avg.rating), count: agg._count._all };
}

/** Rating summaries for many courses at once (card lists) — one query. */
export async function getRatingsForCourseIds(
  courseIds: string[],
): Promise<Map<string, RatingSummary>> {
  if (courseIds.length === 0) return new Map();
  const grouped = await db.review.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courseIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    grouped.map((g) => [
      g.courseId,
      { average: roundAvg(g._avg.rating), count: g._count._all },
    ]),
  );
}

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  user: { select: { name: true, image: true } },
} satisfies Prisma.ReviewSelect;

export type CourseReview = Prisma.ReviewGetPayload<{
  select: typeof reviewSelect;
}>;

export function getCourseReviews(courseId: string, limit = 20) {
  return db.review.findMany({
    where: { courseId },
    select: reviewSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** The signed-in user's own review for a course (for prefilling the form). */
export function getUserReview(userId: string, courseId: string) {
  return db.review.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { rating: true, comment: true },
  });
}

/**
 * Create or update the user's review. Gated on enrollment — only students who
 * enrolled may review. Idempotent via the [userId, courseId] unique key.
 */
export async function upsertReview(
  userId: string,
  courseId: string,
  data: ReviewInput,
) {
  const enrolled = await findEnrollment(userId, courseId);
  if (!enrolled) throw new NotEnrolledError();

  return db.review.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, rating: data.rating, comment: data.comment || null },
    update: { rating: data.rating, comment: data.comment || null },
    select: { id: true },
  });
}

/** Delete the user's own review (scoped by userId, so it can't touch others'). */
export async function deleteReview(userId: string, courseId: string) {
  await db.review.deleteMany({ where: { userId, courseId } });
}
