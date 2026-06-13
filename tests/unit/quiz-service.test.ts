import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  quizFindUnique,
  questionFindMany,
  attemptFindFirst,
  attemptCreate,
  attemptFindUnique,
  attemptUpdate,
  findEnrollment,
  markLectureComplete,
} = vi.hoisted(() => ({
  quizFindUnique: vi.fn(),
  questionFindMany: vi.fn(),
  attemptFindFirst: vi.fn(),
  attemptCreate: vi.fn(),
  attemptFindUnique: vi.fn(),
  attemptUpdate: vi.fn(),
  findEnrollment: vi.fn(),
  markLectureComplete: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    quiz: { findUnique: quizFindUnique },
    quizQuestion: { findMany: questionFindMany },
    quizAttempt: {
      findFirst: attemptFindFirst,
      create: attemptCreate,
      findUnique: attemptFindUnique,
      update: attemptUpdate,
    },
  },
}));

vi.mock("@/server/services/enrollment", () => ({ findEnrollment }));
vi.mock("@/server/services/progress", () => ({ markLectureComplete }));

import {
  getQuizForAttempt,
  startQuizAttempt,
  submitQuizAttempt,
} from "@/server/services/quiz";

const QUIZ_CONTEXT = {
  id: "quiz_1",
  lectureId: "lec_1",
  timeLimit: null as number | null,
  lecture: { section: { courseId: "course_1" } },
};

const QUESTIONS = [
  {
    id: "q1",
    question: "Soal 1",
    type: "MULTIPLE_CHOICE" as const,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correctAnswerIds: ["a"],
    explanation: "karena a",
  },
  {
    id: "q2",
    question: "Soal 2",
    type: "TRUE_FALSE" as const,
    options: [
      { id: "t", text: "Benar" },
      { id: "f", text: "Salah" },
    ],
    correctAnswerIds: ["t"],
    explanation: "memang benar",
  },
];

function attempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "att_1",
    userId: "user_1",
    startedAt: new Date(),
    submittedAt: null,
    score: 0,
    passed: false,
    answers: [],
    quiz: {
      id: "quiz_1",
      passingScore: 60,
      timeLimit: null,
      lectureId: "lec_1",
      lecture: { section: { courseId: "course_1" } },
      questions: QUESTIONS,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  findEnrollment.mockResolvedValue({ id: "enr_1" });
});

describe("getQuizForAttempt — no answer-key leak", () => {
  it("never returns correctAnswerIds or explanation to the client", async () => {
    questionFindMany.mockResolvedValue([
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        question: "Soal 1",
        options: [{ id: "a", text: "A" }],
        order: 1,
        correctAnswerIds: ["a"],
      },
      {
        id: "q2",
        type: "MULTIPLE_CHOICE",
        question: "Soal 2",
        options: [
          { id: "a", text: "A" },
          { id: "b", text: "B" },
        ],
        order: 2,
        correctAnswerIds: ["a", "b"],
      },
    ]);

    const result = await getQuizForAttempt("quiz_1");

    expect(result[0]).not.toHaveProperty("correctAnswerIds");
    expect(result[0]).not.toHaveProperty("explanation");
    expect(JSON.stringify(result)).not.toContain("correctAnswerIds");
    // `multiple` flag exposes cardinality only (single vs multi), not the key.
    expect(result[0].multiple).toBe(false);
    expect(result[1].multiple).toBe(true);
  });
});

describe("startQuizAttempt — resume vs create", () => {
  it("resumes an existing non-expired in-progress attempt (no duplicate)", async () => {
    quizFindUnique.mockResolvedValue(QUIZ_CONTEXT);
    attemptFindFirst.mockResolvedValue({
      id: "att_existing",
      startedAt: new Date(),
      submittedAt: null,
    });

    const res = await startQuizAttempt("user_1", "quiz_1");

    expect(res).toMatchObject({ ok: true, attemptId: "att_existing" });
    expect(attemptCreate).not.toHaveBeenCalled();
  });

  it("creates a new attempt when none is in progress", async () => {
    quizFindUnique.mockResolvedValue(QUIZ_CONTEXT);
    attemptFindFirst.mockResolvedValue(null);
    attemptCreate.mockResolvedValue({ id: "att_new", startedAt: new Date() });

    const res = await startQuizAttempt("user_1", "quiz_1");

    expect(attemptCreate).toHaveBeenCalledTimes(1);
    expect(res).toMatchObject({ ok: true, attemptId: "att_new" });
  });

  it("creates a new attempt when the in-progress one has expired", async () => {
    quizFindUnique.mockResolvedValue({ ...QUIZ_CONTEXT, timeLimit: 120 });
    attemptFindFirst.mockResolvedValue({
      id: "att_old",
      startedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago > 120s+grace
      submittedAt: null,
    });
    attemptCreate.mockResolvedValue({ id: "att_new", startedAt: new Date() });

    const res = await startQuizAttempt("user_1", "quiz_1");

    expect(res).toMatchObject({ ok: true, attemptId: "att_new" });
    expect(attemptCreate).toHaveBeenCalledTimes(1);
  });

  it("refuses to start for a non-enrolled user", async () => {
    quizFindUnique.mockResolvedValue(QUIZ_CONTEXT);
    findEnrollment.mockResolvedValue(null);

    const res = await startQuizAttempt("user_1", "quiz_1");

    expect(res).toEqual({ ok: false, reason: "forbidden" });
  });
});

describe("submitQuizAttempt — server-side grading", () => {
  it("grades server-side and marks the lecture complete when passed", async () => {
    attemptFindUnique.mockResolvedValue(attempt());
    attemptUpdate.mockResolvedValue({});

    const res = await submitQuizAttempt("user_1", "att_1", [
      { questionId: "q1", selectedIds: ["a"] },
      { questionId: "q2", selectedIds: ["t"] },
    ]);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.score).toBe(100);
    expect(res.result.passed).toBe(true);
    expect(markLectureComplete).toHaveBeenCalledWith("user_1", "lec_1");
    // Post-submit review may include the answer key + explanation.
    expect(res.result.review[0].correctAnswerIds).toEqual(["a"]);
    expect(res.result.review[0].explanation).toBe("karena a");
  });

  it("does not complete the lecture when the score is below passing", async () => {
    attemptFindUnique.mockResolvedValue(attempt());
    attemptUpdate.mockResolvedValue({});

    const res = await submitQuizAttempt("user_1", "att_1", [
      { questionId: "q1", selectedIds: ["b"] },
      { questionId: "q2", selectedIds: ["f"] },
    ]);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.score).toBe(0);
    expect(res.result.passed).toBe(false);
    expect(markLectureComplete).not.toHaveBeenCalled();
  });

  it("is idempotent: a submitted attempt is not re-graded or re-saved", async () => {
    attemptFindUnique.mockResolvedValue(
      attempt({
        submittedAt: new Date(),
        score: 80,
        passed: true,
        answers: [{ questionId: "q1", selectedIds: ["a"] }],
      }),
    );

    // Re-submit with different (would-be-perfect) answers.
    const res = await submitQuizAttempt("user_1", "att_1", [
      { questionId: "q1", selectedIds: ["a"] },
      { questionId: "q2", selectedIds: ["t"] },
    ]);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.score).toBe(80); // stored score, not regraded to 100
    expect(attemptUpdate).not.toHaveBeenCalled();
    expect(markLectureComplete).not.toHaveBeenCalled();
  });

  it("rejects submitting an attempt that belongs to another user", async () => {
    attemptFindUnique.mockResolvedValue(attempt({ userId: "someone_else" }));

    const res = await submitQuizAttempt("user_1", "att_1", []);

    expect(res).toEqual({ ok: false, reason: "forbidden" });
    expect(attemptUpdate).not.toHaveBeenCalled();
  });

  it("flags a late submit (past limit + grace) but still grades received answers", async () => {
    attemptFindUnique.mockResolvedValue(
      attempt({
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        quiz: {
          ...attempt().quiz,
          timeLimit: 120,
        },
      }),
    );
    attemptUpdate.mockResolvedValue({});

    const res = await submitQuizAttempt("user_1", "att_1", [
      { questionId: "q1", selectedIds: ["a"] },
      { questionId: "q2", selectedIds: ["t"] },
    ]);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.late).toBe(true);
    expect(res.result.score).toBe(100);
    expect(attemptUpdate).toHaveBeenCalledTimes(1);
  });
});
