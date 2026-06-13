// Client-safe quiz logic + types (no "server-only"): the grading algorithm is
// pure and shared by the server service and unit tests. The answer key never
// appears in any type sent to the client (see ClientQuizQuestion).

import type { QuestionType } from "@prisma/client";

// Server grading tolerates clock skew / network latency by this many seconds
// past a timed quiz's limit before a submission counts as late.
export const TIMER_GRACE_SECONDS = 5;

export type QuizOption = { id: string; text: string };

/**
 * Question shape sent to the client: no correctAnswerIds, no explanation. The
 * `multiple` flag tells the UI to render checkboxes vs a radio group — it
 * reveals only how many answers to pick, never which options are correct.
 */
export type ClientQuizQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  options: QuizOption[];
  order: number;
  multiple: boolean;
};

export type SubmittedAnswer = { questionId: string; selectedIds: string[] };

export type GradedQuestion = {
  questionId: string;
  selectedIds: string[];
  correctAnswerIds: string[];
  isCorrect: boolean;
};

export type GradeResult = {
  total: number;
  correctCount: number;
  score: number; // 0..100, rounded
  perQuestion: GradedQuestion[];
};

/** Order-independent set equality. */
function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

/**
 * All-or-nothing grading. A question is correct only when the selected set
 * exactly matches the correct set (no partial credit for multi-answer). Score
 * is the rounded percentage of fully-correct questions.
 */
export function gradeQuiz(
  questions: { id: string; correctAnswerIds: string[] }[],
  answers: SubmittedAnswer[],
): GradeResult {
  const selectedByQuestion = new Map(
    answers.map((a) => [a.questionId, a.selectedIds]),
  );

  const perQuestion: GradedQuestion[] = questions.map((q) => {
    const selectedIds = selectedByQuestion.get(q.id) ?? [];
    return {
      questionId: q.id,
      selectedIds,
      correctAnswerIds: q.correctAnswerIds,
      isCorrect: sameSet(selectedIds, q.correctAnswerIds),
    };
  });

  const total = questions.length;
  const correctCount = perQuestion.filter((p) => p.isCorrect).length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  return { total, correctCount, score, perQuestion };
}

