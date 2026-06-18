import "server-only";

import { Prisma, UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/rbac";
import {
  PASSING_SCORE_MAX,
  PASSING_SCORE_MIN,
  QUESTION_OPTION_MAX,
  QUESTION_OPTION_MIN,
  type QuestionInput,
  type QuizSettingsInput,
} from "@/schemas/quiz-builder";

export type QuizActor = { id: string; role: UserRole };

export class QuizNotFoundError extends Error {
  constructor() {
    super("Quiz tidak ditemukan.");
    this.name = "QuizNotFoundError";
  }
}

export class QuestionNotFoundError extends Error {
  constructor() {
    super("Soal tidak ditemukan.");
    this.name = "QuestionNotFoundError";
  }
}

export class QuizValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizValidationError";
  }
}

function assertOwner(instructorId: string, actor: QuizActor) {
  if (actor.role !== UserRole.ADMIN && instructorId !== actor.id) {
    throw new ForbiddenError("Anda bukan pemilik quiz ini.");
  }
}

/** Critical structural invariants, re-checked server-side (defense in depth). */
function assertQuestionValid(data: QuestionInput) {
  if (
    data.options.length < QUESTION_OPTION_MIN ||
    data.options.length > QUESTION_OPTION_MAX
  ) {
    throw new QuizValidationError(
      `Soal harus punya ${QUESTION_OPTION_MIN}–${QUESTION_OPTION_MAX} opsi.`,
    );
  }
  if (data.correctAnswerIds.length < 1) {
    throw new QuizValidationError("Tandai minimal 1 jawaban benar.");
  }
  const optionIds = new Set(data.options.map((o) => o.id));
  if (data.correctAnswerIds.some((id) => !optionIds.has(id))) {
    throw new QuizValidationError("Jawaban benar harus salah satu opsi.");
  }
}

function quizOwnerSelect() {
  return {
    lecture: {
      select: {
        section: {
          select: { course: { select: { instructorId: true } } },
        },
      },
    },
  } satisfies Prisma.QuizSelect;
}

async function loadQuizOwner(quizId: string) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: quizOwnerSelect(),
  });
  if (!quiz) throw new QuizNotFoundError();
  return quiz.lecture.section.course.instructorId;
}

async function loadQuestionOwner(questionId: string) {
  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: {
      quizId: true,
      quiz: { select: quizOwnerSelect() },
    },
  });
  if (!question) throw new QuestionNotFoundError();
  return {
    quizId: question.quizId,
    instructorId: question.quiz.lecture.section.course.instructorId,
  };
}

const builderSelect = {
  id: true,
  title: true,
  description: true,
  passingScore: true,
  timeLimit: true,
  lecture: {
    select: {
      id: true,
      section: {
        select: {
          courseId: true,
          course: { select: { instructorId: true, title: true } },
        },
      },
    },
  },
  questions: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      type: true,
      question: true,
      options: true,
      correctAnswerIds: true,
      explanation: true,
      order: true,
    },
  },
} satisfies Prisma.QuizSelect;

export type QuizForBuilder = Prisma.QuizGetPayload<{
  select: typeof builderSelect;
}>;

export function getQuizForBuilder(quizId: string) {
  return db.quiz.findUnique({ where: { id: quizId }, select: builderSelect });
}

export async function updateQuizSettings(
  quizId: string,
  data: QuizSettingsInput,
  actor: QuizActor,
) {
  if (data.passingScore < PASSING_SCORE_MIN || data.passingScore > PASSING_SCORE_MAX) {
    throw new QuizValidationError("Passing score harus antara 0–100.");
  }
  const instructorId = await loadQuizOwner(quizId);
  assertOwner(instructorId, actor);

  return db.quiz.update({
    where: { id: quizId },
    data: {
      title: data.title,
      description: data.description || null,
      passingScore: data.passingScore,
      timeLimit: data.timeLimit ?? null,
    },
    select: { id: true },
  });
}

export async function addQuestion(
  quizId: string,
  data: QuestionInput,
  actor: QuizActor,
) {
  const instructorId = await loadQuizOwner(quizId);
  assertOwner(instructorId, actor);
  assertQuestionValid(data);

  const order = await db.quizQuestion.count({ where: { quizId } });

  return db.quizQuestion.create({
    data: {
      quizId,
      type: data.type,
      question: data.question,
      options: data.options as unknown as Prisma.InputJsonValue,
      correctAnswerIds: data.correctAnswerIds,
      explanation: data.explanation || null,
      order,
    },
    select: { id: true },
  });
}

export async function updateQuestion(
  questionId: string,
  data: QuestionInput,
  actor: QuizActor,
) {
  const { instructorId } = await loadQuestionOwner(questionId);
  assertOwner(instructorId, actor);
  assertQuestionValid(data);

  // Option ids are passed through unchanged — never regenerated — so existing
  // QuizAttempt.answers keep referencing valid options.
  return db.quizQuestion.update({
    where: { id: questionId },
    data: {
      type: data.type,
      question: data.question,
      options: data.options as unknown as Prisma.InputJsonValue,
      correctAnswerIds: data.correctAnswerIds,
      explanation: data.explanation || null,
    },
    select: { id: true },
  });
}

export async function deleteQuestion(questionId: string, actor: QuizActor) {
  const { instructorId } = await loadQuestionOwner(questionId);
  assertOwner(instructorId, actor);
  await db.quizQuestion.delete({ where: { id: questionId } });
}

/** Swap a question's order with its neighbour; edge = no-op. */
export async function moveQuestion(
  questionId: string,
  direction: "up" | "down",
  actor: QuizActor,
) {
  const { quizId, instructorId } = await loadQuestionOwner(questionId);
  assertOwner(instructorId, actor);

  const questions = await db.quizQuestion.findMany({
    where: { quizId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  const index = questions.findIndex((q) => q.id === questionId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= questions.length) {
    return;
  }

  const current = questions[index];
  const neighbour = questions[swapIndex];
  await db.$transaction([
    db.quizQuestion.update({
      where: { id: current.id },
      data: { order: neighbour.order },
    }),
    db.quizQuestion.update({
      where: { id: neighbour.id },
      data: { order: current.order },
    }),
  ]);
}
