import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  gradeQuiz,
  TIMER_GRACE_SECONDS,
  type ClientQuizQuestion,
  type QuizOption,
  type SubmittedAnswer,
} from "@/lib/quiz";
import { findEnrollment } from "@/server/services/enrollment";
import { markLectureComplete } from "@/server/services/progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuizAttemptSummary = {
  id: string;
  score: number;
  passed: boolean;
  submittedAt: Date;
};

export type QuizBundle = {
  quizId: string;
  lectureId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  questionCount: number;
  questions: ClientQuizQuestion[];
  attempts: QuizAttemptSummary[];
  /** Highest passing state across submitted attempts (drives lecture status). */
  passed: boolean;
};

export type QuizReviewItem = {
  questionId: string;
  question: string;
  type: ClientQuizQuestion["type"];
  options: QuizOption[];
  selectedIds: string[];
  correctAnswerIds: string[];
  explanation: string | null;
  isCorrect: boolean;
};

export type QuizResult = {
  attemptId: string;
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
  passingScore: number;
  late: boolean;
  review: QuizReviewItem[];
};

type StartResult =
  | { ok: true; attemptId: string; startedAt: Date; timeLimit: number | null }
  | { ok: false; reason: "not_found" | "forbidden" };

type SubmitResult =
  | { ok: true; result: QuizResult }
  | { ok: false; reason: "not_found" | "forbidden" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asOptions(value: Prisma.JsonValue): QuizOption[] {
  // Seeded shape is always [{ id, text }]; coerce defensively.
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) =>
    entry && typeof entry === "object" && "id" in entry && "text" in entry
      ? [{ id: String(entry.id), text: String(entry.text) }]
      : [],
  );
}

/** Server is the source of truth for time: true once past limit + grace. */
function isExpired(startedAt: Date, timeLimit: number | null): boolean {
  if (timeLimit == null) return false;
  const elapsedSeconds = (Date.now() - startedAt.getTime()) / 1000;
  return elapsedSeconds > timeLimit + TIMER_GRACE_SECONDS;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Course + lecture a quiz belongs to (for enrollment checks). */
export async function getQuizContext(quizId: string) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      lectureId: true,
      timeLimit: true,
      lecture: { select: { section: { select: { courseId: true } } } },
    },
  });
  if (!quiz) return null;
  return {
    quizId: quiz.id,
    lectureId: quiz.lectureId,
    courseId: quiz.lecture.section.courseId,
    timeLimit: quiz.timeLimit,
  };
}

/**
 * Client-safe questions for a quiz. NEVER selects correctAnswerIds or
 * explanation, so the answer key cannot leak before submission.
 */
export async function getQuizForAttempt(
  quizId: string,
): Promise<ClientQuizQuestion[]> {
  const questions = await db.quizQuestion.findMany({
    where: { quizId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      type: true,
      question: true,
      options: true,
      order: true,
      // correctAnswerIds intentionally derived only for the `multiple` flag.
      correctAnswerIds: true,
    },
  });

  return questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: asOptions(q.options),
    order: q.order,
    multiple: q.type === "MULTIPLE_CHOICE" && q.correctAnswerIds.length > 1,
  }));
}

/**
 * Everything the quiz lecture view needs: meta, client-safe questions, and the
 * learner's submitted-attempt history. Returns null if the lecture has no quiz.
 */
export async function getQuizBundle(
  userId: string,
  lectureId: string,
): Promise<QuizBundle | null> {
  const quiz = await db.quiz.findUnique({
    where: { lectureId },
    select: {
      id: true,
      lectureId: true,
      title: true,
      description: true,
      passingScore: true,
      timeLimit: true,
    },
  });
  if (!quiz) return null;

  const [questions, attempts] = await Promise.all([
    getQuizForAttempt(quiz.id),
    db.quizAttempt.findMany({
      where: { userId, quizId: quiz.id, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      select: { id: true, score: true, passed: true, submittedAt: true },
    }),
  ]);

  return {
    quizId: quiz.id,
    lectureId: quiz.lectureId,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passingScore,
    timeLimit: quiz.timeLimit,
    questionCount: questions.length,
    questions,
    attempts: attempts.map((a) => ({
      id: a.id,
      score: a.score,
      passed: a.passed,
      submittedAt: a.submittedAt as Date,
    })),
    passed: attempts.some((a) => a.passed),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Begin (or resume) an attempt. Resumes the latest in-progress, non-expired
 * attempt instead of creating a duplicate; otherwise creates a fresh one.
 * Enforces enrollment.
 */
export async function startQuizAttempt(
  userId: string,
  quizId: string,
): Promise<StartResult> {
  const context = await getQuizContext(quizId);
  if (!context) return { ok: false, reason: "not_found" };

  const enrollment = await findEnrollment(userId, context.courseId);
  if (!enrollment) return { ok: false, reason: "forbidden" };

  const inProgress = await db.quizAttempt.findFirst({
    where: { userId, quizId, submittedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (inProgress && !isExpired(inProgress.startedAt, context.timeLimit)) {
    return {
      ok: true,
      attemptId: inProgress.id,
      startedAt: inProgress.startedAt,
      timeLimit: context.timeLimit,
    };
  }

  const attempt = await db.quizAttempt.create({
    data: {
      userId,
      quizId,
      score: 0,
      passed: false,
      answers: [] as Prisma.InputJsonValue,
    },
  });
  return {
    ok: true,
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
    timeLimit: context.timeLimit,
  };
}

function buildReview(
  questions: {
    id: string;
    question: string;
    type: ClientQuizQuestion["type"];
    options: Prisma.JsonValue;
    correctAnswerIds: string[];
    explanation: string | null;
  }[],
  answers: SubmittedAnswer[],
): { review: QuizReviewItem[]; correctCount: number; total: number; score: number } {
  const grade = gradeQuiz(
    questions.map((q) => ({ id: q.id, correctAnswerIds: q.correctAnswerIds })),
    answers,
  );
  const graded = new Map(grade.perQuestion.map((p) => [p.questionId, p]));

  const review: QuizReviewItem[] = questions.map((q) => {
    const g = graded.get(q.id);
    return {
      questionId: q.id,
      question: q.question,
      type: q.type,
      options: asOptions(q.options),
      selectedIds: g?.selectedIds ?? [],
      correctAnswerIds: q.correctAnswerIds,
      explanation: q.explanation,
      isCorrect: g?.isCorrect ?? false,
    };
  });

  return {
    review,
    correctCount: grade.correctCount,
    total: grade.total,
    score: grade.score,
  };
}

/**
 * Grade and finalize an attempt SERVER-SIDE. Idempotent: a submitted attempt is
 * never re-graded — its stored result is rebuilt and returned. The score always
 * comes from the server; the client's claimed score (if any) is ignored.
 * Passing the quiz marks the QUIZ lecture complete and recomputes course
 * progress (via markLectureComplete).
 */
export async function submitQuizAttempt(
  userId: string,
  attemptId: string,
  answers: SubmittedAnswer[],
): Promise<SubmitResult> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        select: {
          id: true,
          passingScore: true,
          timeLimit: true,
          lectureId: true,
          lecture: { select: { section: { select: { courseId: true } } } },
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              question: true,
              type: true,
              options: true,
              correctAnswerIds: true,
              explanation: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) return { ok: false, reason: "not_found" };
  if (attempt.userId !== userId) return { ok: false, reason: "forbidden" };

  const courseId = attempt.quiz.lecture.section.courseId;
  const enrollment = await findEnrollment(userId, courseId);
  if (!enrollment) return { ok: false, reason: "forbidden" };

  // Idempotent: an already-submitted attempt is never re-graded.
  if (attempt.submittedAt) {
    const storedAnswers = (attempt.answers as SubmittedAnswer[] | null) ?? [];
    const built = buildReview(attempt.quiz.questions, storedAnswers);
    return {
      ok: true,
      result: {
        attemptId: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        correctCount: built.correctCount,
        total: built.total,
        passingScore: attempt.quiz.passingScore,
        late: false,
        review: built.review,
      },
    };
  }

  // Server is the source of truth for timing. Late submissions (past the limit
  // + grace) are still graded, but ONLY on the answers actually received — the
  // client cannot buy extra time, since the timer is anchored to startedAt.
  const late = isExpired(attempt.startedAt, attempt.quiz.timeLimit);

  const built = buildReview(attempt.quiz.questions, answers);
  const passed = built.score >= attempt.quiz.passingScore;

  await db.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      score: built.score,
      passed,
      answers: answers as unknown as Prisma.InputJsonValue,
      submittedAt: new Date(),
    },
  });

  // Passing marks the QUIZ lecture complete (and cascades to course progress).
  if (passed) {
    await markLectureComplete(userId, attempt.quiz.lectureId);
  }

  return {
    ok: true,
    result: {
      attemptId: attempt.id,
      score: built.score,
      passed,
      correctCount: built.correctCount,
      total: built.total,
      passingScore: attempt.quiz.passingScore,
      late,
      review: built.review,
    },
  };
}
