import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  quizFindUnique,
  quizUpdate,
  questionCount,
  questionCreate,
  questionFindUnique,
  questionFindMany,
  questionUpdate,
  questionDelete,
  transaction,
} = vi.hoisted(() => ({
  quizFindUnique: vi.fn(),
  quizUpdate: vi.fn(),
  questionCount: vi.fn(),
  questionCreate: vi.fn(),
  questionFindUnique: vi.fn(),
  questionFindMany: vi.fn(),
  questionUpdate: vi.fn(),
  questionDelete: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    quiz: { findUnique: quizFindUnique, update: quizUpdate },
    quizQuestion: {
      count: questionCount,
      create: questionCreate,
      findUnique: questionFindUnique,
      findMany: questionFindMany,
      update: questionUpdate,
      delete: questionDelete,
    },
    $transaction: transaction,
  },
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

import { ForbiddenError } from "@/lib/rbac";
import type { QuestionInput, QuizSettingsInput } from "@/schemas/quiz-builder";
import {
  addQuestion,
  QuizValidationError,
  updateQuizSettings,
  type QuizActor,
} from "@/server/services/quiz-builder";

const OWNER = "inst_1";
const ownerActor: QuizActor = { id: OWNER, role: UserRole.INSTRUCTOR };
const strangerActor: QuizActor = { id: "inst_2", role: UserRole.INSTRUCTOR };

const ownerRow = {
  lecture: { section: { course: { instructorId: OWNER } } },
};

const validQuestion: QuestionInput = {
  type: "MULTIPLE_CHOICE",
  question: "Apa itu QA?",
  explanation: "",
  options: [
    { id: "opt_1", text: "Quality Assurance" },
    { id: "opt_2", text: "Quick Answer" },
  ],
  correctAnswerIds: ["opt_1"],
};

beforeEach(() => {
  vi.clearAllMocks();
  questionCount.mockResolvedValue(0);
  questionCreate.mockResolvedValue({ id: "q_1" });
  quizUpdate.mockResolvedValue({ id: "quiz_1" });
});

describe("addQuestion", () => {
  it("creates a question with auto-order when valid", async () => {
    quizFindUnique.mockResolvedValue(ownerRow);
    questionCount.mockResolvedValue(2);

    await addQuestion("quiz_1", validQuestion, ownerActor);

    const args = questionCreate.mock.calls[0][0];
    expect(args.data.quizId).toBe("quiz_1");
    expect(args.data.order).toBe(2);
    expect(args.data.correctAnswerIds).toEqual(["opt_1"]);
  });

  it("rejects fewer than 2 options", async () => {
    quizFindUnique.mockResolvedValue(ownerRow);

    await expect(
      addQuestion(
        "quiz_1",
        { ...validQuestion, options: [{ id: "opt_1", text: "A" }] },
        ownerActor,
      ),
    ).rejects.toBeInstanceOf(QuizValidationError);
    expect(questionCreate).not.toHaveBeenCalled();
  });

  it("rejects when no correct answer is marked", async () => {
    quizFindUnique.mockResolvedValue(ownerRow);

    await expect(
      addQuestion(
        "quiz_1",
        { ...validQuestion, correctAnswerIds: [] },
        ownerActor,
      ),
    ).rejects.toBeInstanceOf(QuizValidationError);
    expect(questionCreate).not.toHaveBeenCalled();
  });

  it("blocks a non-owner instructor", async () => {
    quizFindUnique.mockResolvedValue(ownerRow);

    await expect(
      addQuestion("quiz_1", validQuestion, strangerActor),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(questionCreate).not.toHaveBeenCalled();
  });
});

describe("updateQuizSettings", () => {
  const base: QuizSettingsInput = {
    title: "Quiz Bab 1",
    description: "",
    passingScore: 70,
    timeLimit: undefined,
  };

  it("rejects a passing score outside 0–100", async () => {
    await expect(
      updateQuizSettings("quiz_1", { ...base, passingScore: 150 }, ownerActor),
    ).rejects.toBeInstanceOf(QuizValidationError);
    expect(quizUpdate).not.toHaveBeenCalled();
  });

  it("saves valid settings (untimed → null timeLimit)", async () => {
    quizFindUnique.mockResolvedValue(ownerRow);

    await updateQuizSettings("quiz_1", base, ownerActor);

    const args = quizUpdate.mock.calls[0][0];
    expect(args.data.passingScore).toBe(70);
    expect(args.data.timeLimit).toBeNull();
  });
});
