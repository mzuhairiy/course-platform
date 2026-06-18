import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  sectionFindFirst,
  sectionCreate,
  lectureFindUnique,
  lectureFindMany,
  lectureCount,
  lectureCreate,
  lectureUpdate,
  lectureDelete,
  quizFindUnique,
  quizCreate,
  courseFindUnique,
  transaction,
} = vi.hoisted(() => ({
  sectionFindFirst: vi.fn(),
  sectionCreate: vi.fn(),
  lectureFindUnique: vi.fn(),
  lectureFindMany: vi.fn(),
  lectureCount: vi.fn(),
  lectureCreate: vi.fn(),
  lectureUpdate: vi.fn(),
  lectureDelete: vi.fn(),
  quizFindUnique: vi.fn(),
  quizCreate: vi.fn(),
  courseFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    section: { findFirst: sectionFindFirst, create: sectionCreate },
    lecture: {
      findUnique: lectureFindUnique,
      findMany: lectureFindMany,
      count: lectureCount,
      create: lectureCreate,
      update: lectureUpdate,
      delete: lectureDelete,
    },
    quiz: { findUnique: quizFindUnique, create: quizCreate },
    course: { findUnique: courseFindUnique },
    $transaction: transaction,
  },
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

// course.ts (imported transitively for CourseNotFoundError) wraps a query in
// react's server cache() at module load — unavailable in the test runtime.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T,>(fn: T) => fn };
});

import { ForbiddenError } from "@/lib/rbac";
import type { LessonInput } from "@/schemas/lesson";
import {
  addLesson,
  ensureDefaultSection,
  moveLesson,
  updateLesson,
  type LessonActor,
} from "@/server/services/lesson";

const OWNER = "inst_1";
const ownerActor: LessonActor = { id: OWNER, role: UserRole.INSTRUCTOR };
const strangerActor: LessonActor = { id: "inst_2", role: UserRole.INSTRUCTOR };

const quizInput: LessonInput = {
  title: "Kuis Bab 1",
  type: "QUIZ",
  videoUrl: "",
  contentMd: "",
  durationSeconds: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockResolvedValue([]);
  lectureUpdate.mockResolvedValue({ id: "x" });
});

describe("ensureDefaultSection", () => {
  it("returns the existing section without creating a new one", async () => {
    sectionFindFirst.mockResolvedValue({ id: "sec_existing" });

    const id = await ensureDefaultSection("course_1");

    expect(id).toBe("sec_existing");
    expect(sectionCreate).not.toHaveBeenCalled();
  });

  it("creates the default 'Main' section when none exists", async () => {
    sectionFindFirst.mockResolvedValue(null);
    sectionCreate.mockResolvedValue({ id: "sec_new" });

    const id = await ensureDefaultSection("course_1");

    expect(id).toBe("sec_new");
    expect(sectionCreate.mock.calls[0][0].data).toMatchObject({
      courseId: "course_1",
      title: "Main",
      order: 0,
    });
  });
});

describe("addLesson", () => {
  it("auto-creates an empty Quiz for a QUIZ lesson, into the default section", async () => {
    courseFindUnique.mockResolvedValue({ instructorId: OWNER });
    sectionFindFirst.mockResolvedValue({ id: "sec_1" });
    lectureCount.mockResolvedValue(0);
    lectureCreate.mockResolvedValue({ id: "lec_quiz", type: "QUIZ" });

    await addLesson("course_1", quizInput, ownerActor);

    const lectureArgs = lectureCreate.mock.calls[0][0];
    expect(lectureArgs.data).toMatchObject({
      sectionId: "sec_1",
      type: "QUIZ",
      order: 0,
    });
    expect(quizCreate).toHaveBeenCalledTimes(1);
    expect(quizCreate.mock.calls[0][0].data.lectureId).toBe("lec_quiz");
  });

  it("blocks a non-owner instructor", async () => {
    courseFindUnique.mockResolvedValue({ instructorId: OWNER });

    await expect(
      addLesson("course_1", quizInput, strangerActor),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(lectureCreate).not.toHaveBeenCalled();
  });
});

describe("moveLesson", () => {
  const lessonsOrdered = [
    { id: "a", order: 0 },
    { id: "b", order: 1 },
    { id: "c", order: 2 },
  ];

  it("swaps order with the previous lesson when moving up", async () => {
    lectureFindUnique.mockResolvedValue({
      id: "b",
      order: 1,
      section: { courseId: "course_1", course: { instructorId: OWNER } },
    });
    lectureFindMany.mockResolvedValue(lessonsOrdered);

    await moveLesson("b", "up", ownerActor);

    expect(transaction).toHaveBeenCalledTimes(1);
    // b takes a's order (0), a takes b's order (1)
    expect(lectureUpdate).toHaveBeenCalledWith({
      where: { id: "b" },
      data: { order: 0 },
    });
    expect(lectureUpdate).toHaveBeenCalledWith({
      where: { id: "a" },
      data: { order: 1 },
    });
  });

  it("is a no-op at the top edge (no error, no transaction)", async () => {
    lectureFindUnique.mockResolvedValue({
      id: "a",
      order: 0,
      section: { courseId: "course_1", course: { instructorId: OWNER } },
    });
    lectureFindMany.mockResolvedValue(lessonsOrdered);

    await expect(moveLesson("a", "up", ownerActor)).resolves.toBeUndefined();
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe("ownership (updateLesson)", () => {
  it("blocks a non-owner instructor from updating", async () => {
    lectureFindUnique.mockResolvedValue({
      id: "lec_1",
      order: 0,
      section: { courseId: "course_1", course: { instructorId: OWNER } },
    });

    await expect(
      updateLesson("lec_1", quizInput, strangerActor),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(lectureUpdate).not.toHaveBeenCalled();
  });
});
