import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  lectureFindUnique,
  lectureFindMany,
  progressFindUnique,
  progressFindMany,
  progressUpsert,
  enrollmentUpdateMany,
} = vi.hoisted(() => ({
  lectureFindUnique: vi.fn(),
  lectureFindMany: vi.fn(),
  progressFindUnique: vi.fn(),
  progressFindMany: vi.fn(),
  progressUpsert: vi.fn(),
  enrollmentUpdateMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lecture: { findUnique: lectureFindUnique, findMany: lectureFindMany },
    lectureProgress: {
      findUnique: progressFindUnique,
      findMany: progressFindMany,
      upsert: progressUpsert,
    },
    enrollment: { updateMany: enrollmentUpdateMany },
  },
}));

import {
  getCourseProgress,
  getResumeLecture,
  updateLectureProgress,
} from "@/server/services/progress";

beforeEach(() => {
  vi.clearAllMocks();
  // Every lecture in these tests is 10s long; 90% threshold = 9s.
  lectureFindUnique.mockResolvedValue({
    durationSeconds: 10,
    section: { courseId: "course_1" },
  });
  progressUpsert.mockImplementation(({ update }) => Promise.resolve(update));
  // Defaults so the post-completion course-completion sync doesn't crash:
  // a single-lecture course that isn't fully done yet.
  lectureFindMany.mockResolvedValue([{ id: "lec_1" }, { id: "lec_2" }]);
  progressFindMany.mockResolvedValue([]);
  enrollmentUpdateMany.mockResolvedValue({ count: 0 });
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

  it("stamps Enrollment.completedAt when the final lecture completes the course", async () => {
    progressFindUnique.mockResolvedValue(null);
    // After this upsert the course has exactly one lecture, now completed → 100%.
    lectureFindMany.mockResolvedValue([{ id: "lec_1" }]);
    progressFindMany.mockResolvedValue([
      { lectureId: "lec_1", isCompleted: true, watchedSeconds: 10 },
    ]);

    await updateLectureProgress("user_1", "lec_1", 10);

    expect(enrollmentUpdateMany).toHaveBeenCalledTimes(1);
    const args = enrollmentUpdateMany.mock.calls[0][0];
    expect(args.where).toMatchObject({
      userId: "user_1",
      courseId: "course_1",
      completedAt: null,
    });
    expect(args.data.completedAt).toBeInstanceOf(Date);
  });

  it("does not touch enrollment while the course is below 100%", async () => {
    progressFindUnique.mockResolvedValue(null);
    // Two lectures, only the one just completed → still 50%.
    lectureFindMany.mockResolvedValue([{ id: "lec_1" }, { id: "lec_2" }]);
    progressFindMany.mockResolvedValue([
      { lectureId: "lec_1", isCompleted: true, watchedSeconds: 10 },
    ]);

    await updateLectureProgress("user_1", "lec_1", 10);

    expect(enrollmentUpdateMany).not.toHaveBeenCalled();
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

describe("getResumeLecture", () => {
  it("returns the first incomplete lecture when some are complete", async () => {
    // Curriculum order is the order returned by findMany (a, b, c).
    lectureFindMany.mockResolvedValue([{ id: "a" }, { id: "b" }, { id: "c" }]);
    progressFindMany.mockResolvedValue([{ lectureId: "a" }]);

    const result = await getResumeLecture("user_1", "course_1");

    expect(result).toBe("b");
  });

  it("returns the first lecture when every lecture is complete", async () => {
    lectureFindMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    progressFindMany.mockResolvedValue([
      { lectureId: "a" },
      { lectureId: "b" },
    ]);

    const result = await getResumeLecture("user_1", "course_1");

    expect(result).toBe("a");
  });

  it("returns null when the course has no lectures", async () => {
    lectureFindMany.mockResolvedValue([]);
    progressFindMany.mockResolvedValue([]);

    const result = await getResumeLecture("user_1", "course_1");

    expect(result).toBeNull();
  });
});
