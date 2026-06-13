import "server-only";

import { db } from "@/lib/db";
import { COMPLETION_THRESHOLD } from "@/lib/progress";

export type PerLectureProgress = {
  completed: boolean;
  watchedSeconds: number;
};

export type CourseProgress = {
  completed: number;
  total: number;
  percentage: number;
  perLecture: Record<string, PerLectureProgress>;
};

/** Resolve the course a lecture belongs to (for enrollment checks). */
export async function getLectureCourseId(
  lectureId: string,
): Promise<string | null> {
  const lecture = await db.lecture.findUnique({
    where: { id: lectureId },
    select: { section: { select: { courseId: true } } },
  });
  return lecture?.section.courseId ?? null;
}

/**
 * Upsert video progress for a lecture. Completion is sticky and idempotent:
 * once completed it never flips back, and completedAt is set exactly once.
 */
export async function updateLectureProgress(
  userId: string,
  lectureId: string,
  watchedSeconds: number,
) {
  const lecture = await db.lecture.findUnique({
    where: { id: lectureId },
    select: { durationSeconds: true },
  });
  if (!lecture) return null;

  const existing = await db.lectureProgress.findUnique({
    where: { userId_lectureId: { userId, lectureId } },
  });

  const duration = lecture.durationSeconds ?? 0;
  const reachedThreshold =
    duration > 0 && watchedSeconds >= duration * COMPLETION_THRESHOLD;
  const isCompleted = (existing?.isCompleted ?? false) || reachedThreshold;
  // Freeze completedAt the first time completion is reached; never overwrite.
  const completedAt =
    existing?.completedAt ?? (isCompleted ? new Date() : null);

  return db.lectureProgress.upsert({
    where: { userId_lectureId: { userId, lectureId } },
    create: { userId, lectureId, watchedSeconds, isCompleted, completedAt },
    update: { watchedSeconds, isCompleted, completedAt },
  });
}

/**
 * Manually mark a lecture complete (READING, and QUIZ placeholders until the
 * quiz engine lands). Idempotent: keeps the original completedAt.
 */
export async function markLectureComplete(userId: string, lectureId: string) {
  const existing = await db.lectureProgress.findUnique({
    where: { userId_lectureId: { userId, lectureId } },
  });
  if (existing?.isCompleted) return existing;

  const completedAt = existing?.completedAt ?? new Date();
  return db.lectureProgress.upsert({
    where: { userId_lectureId: { userId, lectureId } },
    create: {
      userId,
      lectureId,
      watchedSeconds: existing?.watchedSeconds ?? 0,
      isCompleted: true,
      completedAt,
    },
    update: { isCompleted: true, completedAt },
  });
}

/**
 * Course progress for a learner. Every lecture type (VIDEO/READING/QUIZ) counts
 * toward the total — QUIZ placeholders are completed via the manual button —
 * so 100% means every item in the curriculum is done.
 */
export async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<CourseProgress> {
  const [lectures, progress] = await Promise.all([
    db.lecture.findMany({
      where: { section: { courseId } },
      select: { id: true },
    }),
    db.lectureProgress.findMany({
      where: { userId, lecture: { section: { courseId } } },
      select: { lectureId: true, isCompleted: true, watchedSeconds: true },
    }),
  ]);

  const byLecture = new Map(progress.map((p) => [p.lectureId, p]));
  const perLecture: Record<string, PerLectureProgress> = {};
  let completed = 0;

  for (const lecture of lectures) {
    const record = byLecture.get(lecture.id);
    const isCompleted = record?.isCompleted ?? false;
    if (isCompleted) completed += 1;
    perLecture[lecture.id] = {
      completed: isCompleted,
      watchedSeconds: record?.watchedSeconds ?? 0,
    };
  }

  const total = lectures.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percentage, perLecture };
}
