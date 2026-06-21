import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  reviewAggregate,
  reviewGroupBy,
  reviewUpsert,
  reviewDeleteMany,
  enrollmentFindUnique,
} = vi.hoisted(() => ({
  reviewAggregate: vi.fn(),
  reviewGroupBy: vi.fn(),
  reviewUpsert: vi.fn(),
  reviewDeleteMany: vi.fn(),
  enrollmentFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    review: {
      aggregate: reviewAggregate,
      groupBy: reviewGroupBy,
      upsert: reviewUpsert,
      deleteMany: reviewDeleteMany,
    },
    enrollment: { findUnique: enrollmentFindUnique },
  },
}));

import { NotEnrolledError } from "@/server/services/review";
import {
  getCourseRatingSummary,
  getRatingsForCourseIds,
  upsertReview,
} from "@/server/services/review";

const reviewInput = { rating: 5, comment: "Mantap" };

beforeEach(() => {
  vi.clearAllMocks();
  reviewUpsert.mockResolvedValue({ id: "rev_1" });
});

describe("getCourseRatingSummary", () => {
  it("rounds the average to 1 decimal and returns the count", async () => {
    reviewAggregate.mockResolvedValue({
      _avg: { rating: 4.3333 },
      _count: { _all: 3 },
    });

    const summary = await getCourseRatingSummary("course_1");

    expect(summary).toEqual({ average: 4.3, count: 3 });
  });

  it("returns 0/0 when there are no reviews", async () => {
    reviewAggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { _all: 0 },
    });

    expect(await getCourseRatingSummary("course_1")).toEqual({
      average: 0,
      count: 0,
    });
  });
});

describe("getRatingsForCourseIds", () => {
  it("returns an empty map for no ids (no query)", async () => {
    const map = await getRatingsForCourseIds([]);
    expect(map.size).toBe(0);
    expect(reviewGroupBy).not.toHaveBeenCalled();
  });

  it("maps grouped aggregates by courseId", async () => {
    reviewGroupBy.mockResolvedValue([
      { courseId: "c1", _avg: { rating: 5 }, _count: { _all: 2 } },
      { courseId: "c2", _avg: { rating: 3.5 }, _count: { _all: 4 } },
    ]);

    const map = await getRatingsForCourseIds(["c1", "c2"]);

    expect(map.get("c1")).toEqual({ average: 5, count: 2 });
    expect(map.get("c2")).toEqual({ average: 3.5, count: 4 });
  });
});

describe("upsertReview", () => {
  it("rejects when the user is not enrolled", async () => {
    enrollmentFindUnique.mockResolvedValue(null);

    await expect(
      upsertReview("user_1", "course_1", reviewInput),
    ).rejects.toBeInstanceOf(NotEnrolledError);
    expect(reviewUpsert).not.toHaveBeenCalled();
  });

  it("upserts when the user is enrolled", async () => {
    enrollmentFindUnique.mockResolvedValue({ id: "enr_1" });

    await upsertReview("user_1", "course_1", reviewInput);

    const args = reviewUpsert.mock.calls[0][0];
    expect(args.where).toEqual({
      userId_courseId: { userId: "user_1", courseId: "course_1" },
    });
    expect(args.create.rating).toBe(5);
    expect(args.update.comment).toBe("Mantap");
  });
});
