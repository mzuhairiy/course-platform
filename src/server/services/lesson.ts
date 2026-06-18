import "server-only";

import { Prisma, UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/rbac";
import { CourseNotFoundError } from "@/server/services/course";
import type { LessonInput } from "@/schemas/lesson";

export type LessonActor = { id: string; role: UserRole };

/**
 * Internal section title. Instructors never see "sections" — every course gets
 * one hidden default section and all lessons live in it (the schema keeps
 * Course → Section → Lecture; we just collapse it in the UI).
 */
export const DEFAULT_SECTION_TITLE = "Main";

export class LessonNotFoundError extends Error {
  constructor() {
    super("Lesson tidak ditemukan.");
    this.name = "LessonNotFoundError";
  }
}

function assertOwner(instructorId: string, actor: LessonActor) {
  if (actor.role !== UserRole.ADMIN && instructorId !== actor.id) {
    throw new ForbiddenError("Anda bukan pemilik course ini.");
  }
}

/** Map the validated form to type-specific DB columns (irrelevant ones nulled). */
function lessonColumns(data: LessonInput) {
  return {
    videoUrl: data.type === "VIDEO" ? data.videoUrl : null,
    durationSeconds:
      data.type === "VIDEO" ? (data.durationSeconds ?? null) : null,
    contentMd: data.type === "READING" ? data.contentMd : null,
  };
}

/**
 * Idempotent: returns the course's first (default) section, creating "Main"
 * only when the course has none. Multi-section seed courses keep their order.
 */
export async function ensureDefaultSection(courseId: string): Promise<string> {
  const existing = await db.section.findFirst({
    where: { courseId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await db.section.create({
    data: { courseId, title: DEFAULT_SECTION_TITLE, order: 0 },
    select: { id: true },
  });
  return created.id;
}

const lessonSelect = {
  id: true,
  title: true,
  type: true,
  order: true,
  durationSeconds: true,
  videoUrl: true,
  contentMd: true,
  quiz: { select: { id: true } },
  _count: { select: { progress: true } },
} satisfies Prisma.LectureSelect;

export type LessonItem = Prisma.LectureGetPayload<{
  select: typeof lessonSelect;
}>;

/** Flat, ordered list of every lecture in the course (across any section). */
export function getLessonsForCourse(courseId: string) {
  return db.lecture.findMany({
    where: { section: { courseId } },
    orderBy: { order: "asc" },
    select: lessonSelect,
  });
}

/** Load a lecture with its owning course's instructor, for ownership checks. */
function getLectureWithOwner(lectureId: string) {
  return db.lecture.findUnique({
    where: { id: lectureId },
    select: {
      id: true,
      order: true,
      section: {
        select: { courseId: true, course: { select: { instructorId: true } } },
      },
    },
  });
}

export async function addLesson(
  courseId: string,
  data: LessonInput,
  actor: LessonActor,
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) throw new CourseNotFoundError();
  assertOwner(course.instructorId, actor);

  const sectionId = await ensureDefaultSection(courseId);
  // Append at the end (order is contiguous from 0 for instructor-built courses).
  const order = await db.lecture.count({ where: { section: { courseId } } });

  const lecture = await db.lecture.create({
    data: {
      sectionId,
      title: data.title,
      type: data.type,
      order,
      ...lessonColumns(data),
    },
    select: { id: true, type: true },
  });

  // A QUIZ lesson needs an (empty) Quiz to fill in the quiz builder (Prompt M).
  if (data.type === "QUIZ") {
    await db.quiz.create({ data: { lectureId: lecture.id, title: data.title } });
  }

  return lecture;
}

export async function updateLesson(
  lectureId: string,
  data: LessonInput,
  actor: LessonActor,
) {
  const lecture = await getLectureWithOwner(lectureId);
  if (!lecture) throw new LessonNotFoundError();
  assertOwner(lecture.section.course.instructorId, actor);

  const updated = await db.lecture.update({
    where: { id: lectureId },
    data: { title: data.title, type: data.type, ...lessonColumns(data) },
    select: { id: true },
  });

  // If it became a QUIZ and has no quiz yet, create one.
  if (data.type === "QUIZ") {
    const existingQuiz = await db.quiz.findUnique({
      where: { lectureId },
      select: { id: true },
    });
    if (!existingQuiz) {
      await db.quiz.create({ data: { lectureId, title: data.title } });
    }
  }

  return updated;
}

export async function deleteLesson(lectureId: string, actor: LessonActor) {
  const lecture = await getLectureWithOwner(lectureId);
  if (!lecture) throw new LessonNotFoundError();
  assertOwner(lecture.section.course.instructorId, actor);

  await db.lecture.delete({ where: { id: lectureId } });
}

/**
 * Swap a lesson's `order` with its neighbour in the given direction. A move
 * past either edge is a no-op (not an error). Both updates run in one
 * transaction so the ordering never lands in a half-applied state.
 */
export async function moveLesson(
  lectureId: string,
  direction: "up" | "down",
  actor: LessonActor,
) {
  const lecture = await getLectureWithOwner(lectureId);
  if (!lecture) throw new LessonNotFoundError();
  assertOwner(lecture.section.course.instructorId, actor);

  const lessons = await db.lecture.findMany({
    where: { section: { courseId: lecture.section.courseId } },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  const index = lessons.findIndex((l) => l.id === lectureId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= lessons.length) {
    return; // already at the edge
  }

  const current = lessons[index];
  const neighbour = lessons[swapIndex];
  await db.$transaction([
    db.lecture.update({
      where: { id: current.id },
      data: { order: neighbour.order },
    }),
    db.lecture.update({
      where: { id: neighbour.id },
      data: { order: current.order },
    }),
  ]);
}
