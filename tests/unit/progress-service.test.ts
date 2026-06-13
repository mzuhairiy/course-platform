import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  lectureFindUnique,
  lectureFindMany,
  progressFindUnique,
  progressFindMany,
  progressUpsert,
} = vi.hoisted(() => ({
  lectureFindUnique: vi.fn(),
  lectureFindMany: vi.fn(),
  progressFindUnique: vi.fn(),
  progressFindMany: vi.fn(),
  progressUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lecture: { findUnique: lectureFindUnique, findMany: lectureFindMany },
    lectureProgress: {
      findUnique: progressFindUnique,
      findMany: progressFindMany,
      upsert: progressUpsert,
    },
  },
}));

import {
  getCourseProgress,
  updateLectureProgress,
} from "@/server/services/progress";

beforeEach(() => {
  vi.clearAllMocks();
  // Every lecture in these tests is 10s long; 90% threshold = 9s.
  lectureFindUnique.mockResolvedValue({ durationSeconds: 10 });
  progressUpsert.mockImplementation(({ update }) => Promise.resolve(update));
});

describe("updateLectureProgress", () => {
  it("does not complete at 50% watched", async () => {
    progressFindUnique.mockResolvedValue(null);

    await updateLectureProgress("user_1", "lec_1", 5);

    const args = progressUpsert.mock.calls[0][0];
    expect(args.update.isCompleted).toBe(false);
    expect(args.update.completedAt).toBeNull();
    expect(args.update.watchedSeconds).toBe(5);
  });

  it("completes at >=90% watched and stamps completedAt", async () => {
    progressFindUnique.mockResolvedValue(null);

    await updateLectureProgress("user_1", "lec_1", 9);

    const args = progressUpsert.mock.calls[0][0];
    expect(args.update.isCompleted).toBe(true);
    expect(args.update.completedAt).toBeInstanceOf(Date);
  });

  it("is idempotent once completed (keeps state + original completedAt)", async () => {
    const completedAt = new Date("2026-06-01T00:00:00.000Z");
    progressFindUnique.mockResolvedValue({
      isCompleted: true,
      completedAt,
      watchedSeconds: 10,
    });

    // Re-report a low watched time (e.g. a rewatch from the start).
    await updateLectureProgress("user_1", "lec_1", 2);

    const args = progressUpsert.mock.calls[0][0];
    expect(args.update.isCompleted).toBe(true);
    expect(args.update.completedAt).toBe(completedAt); // not flipped/re-stamped
  });
});

describe("getCourseProgress", () => {
  it("reports 0% with no completed lectures", async () => {
    lectureFindMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    progressFindMany.mockResolvedValue([]);

    const result = await getCourseProgress("user_1", "course_1");

    expect(result).toMatchObject({ completed: 0, total: 2, percentage: 0 });
    expect(result.perLecture.a.completed).toBe(false);
  });

  it("reports partial completion rounded to a percentage", async () => {
    lectureFindMany.mockResolvedValue([
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
    ]);
    progressFindMany.mockResolvedValue([
      { lectureId: "a", isCompleted: true, watchedSeconds: 10 },
      { lectureId: "b", isCompleted: true, watchedSeconds: 10 },
      { lectureId: "c", isCompleted: false, watchedSeconds: 3 },
    ]);

    const result = await getCourseProgress("user_1", "course_1");

    expect(result).toMatchObject({ completed: 2, total: 4, percentage: 50 });
  });

  it("reports 100% when every lecture is completed", async () => {
    lectureFindMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    progressFindMany.mockResolvedValue([
      { lectureId: "a", isCompleted: true, watchedSeconds: 10 },
      { lectureId: "b", isCompleted: true, watchedSeconds: 10 },
    ]);

    const result = await getCourseProgress("user_1", "course_1");

    expect(result.percentage).toBe(100);
    expect(result.completed).toBe(2);
  });
});
