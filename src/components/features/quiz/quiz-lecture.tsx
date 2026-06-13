"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { QuizQuestion } from "@/components/features/quiz/quiz-question";
import { QuizResultView } from "@/components/features/quiz/quiz-result";
import { QuizTimer } from "@/components/features/quiz/quiz-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import type { ClientQuizQuestion } from "@/lib/quiz";
import { startQuizAction, submitQuizAction } from "@/server/actions/quiz";
import type { QuizAttemptSummary, QuizResult } from "@/server/services/quiz";

type Phase = "intro" | "in_progress" | "submitted";

export type QuizLectureProps = {
  quizId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  questionCount: number;
  questions: ClientQuizQuestion[];
  attempts: QuizAttemptSummary[];
  nextHref: string | null;
};

function formatDate(value: Date): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function QuizLecture(props: QuizLectureProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Guards the timed auto-submit so it can only fire once per attempt.
  const submittedRef = useRef(false);

  const begin = useCallback(async () => {
    setStarting(true);
    try {
      const res = await startQuizAction({ quizId: props.quizId });
      if (res.status === "error") {
        toast.error(res.message);
        return;
      }
      submittedRef.current = false;
      setAttemptId(res.attemptId);
      setAnswers({});
      setResult(null);
      setDeadline(
        res.timeLimit != null
          ? new Date(res.startedAt).getTime() + res.timeLimit * 1000
          : null,
      );
      setPhase("in_progress");
    } finally {
      setStarting(false);
    }
  }, [props.quizId]);

  const submit = useCallback(
    async (currentAttemptId: string, currentAnswers: Record<string, string[]>) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const payload = {
          attemptId: currentAttemptId,
          answers: props.questions.map((q) => ({
            questionId: q.id,
            selectedIds: currentAnswers[q.id] ?? [],
          })),
        };
        const res = await submitQuizAction(payload);
        if (res.status === "error") {
          toast.error(res.message);
          submittedRef.current = false;
          return;
        }
        setResult(res.result);
        setPhase("submitted");
        // Refresh server components so the sidebar checkmark + course progress
        // reflect a newly-passed quiz without a manual reload.
        router.refresh();
      } finally {
        setSubmitting(false);
      }
    },
    [props.questions, router],
  );

  const handleAutoSubmit = useCallback(() => {
    if (attemptId) void submit(attemptId, answers);
  }, [attemptId, answers, submit]);

  // ---- Intro -------------------------------------------------------------
  if (phase === "intro") {
    return (
      <div className="space-y-6" data-testid="quiz-intro">
        <div className="space-y-2">
          <Heading as="h2" level="h3">
            {props.title}
          </Heading>
          {props.description ? (
            <Text variant="muted">{props.description}</Text>
          ) : null}
        </div>

        <ul className="flex flex-wrap gap-2 text-sm">
          <li className="rounded-md border border-border px-3 py-1">
            {props.questionCount} soal
          </li>
          <li className="rounded-md border border-border px-3 py-1">
            Passing score {props.passingScore}%
          </li>
          {props.timeLimit != null ? (
            <li className="rounded-md border border-border px-3 py-1">
              Batas waktu {Math.round(props.timeLimit / 60)} menit
            </li>
          ) : (
            <li className="rounded-md border border-border px-3 py-1">
              Tanpa batas waktu
            </li>
          )}
        </ul>

        {props.attempts.length > 0 ? (
          <div className="space-y-2" data-testid="quiz-attempt-history">
            <Text variant="muted" as="span">
              Riwayat attempt
            </Text>
            <ul className="space-y-1">
              {props.attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  data-testid="quiz-attempt-row"
                >
                  <span>{formatDate(attempt.submittedAt)}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{attempt.score}%</span>
                    <Badge variant={attempt.passed ? "default" : "destructive"}>
                      {attempt.passed ? "Lulus" : "Belum Lulus"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button
          type="button"
          onClick={() => void begin()}
          disabled={starting || props.questionCount === 0}
          data-testid="start-quiz-button"
        >
          {starting ? "Memulai…" : "Mulai Quiz"}
        </Button>
      </div>
    );
  }

  // ---- In progress -------------------------------------------------------
  if (phase === "in_progress") {
    return (
      <div className="space-y-6" data-testid="quiz-in-progress">
        <div className="flex items-center justify-between">
          <Heading as="h2" level="h4">
            {props.title}
          </Heading>
          {deadline != null ? (
            <QuizTimer deadline={deadline} onExpire={handleAutoSubmit} />
          ) : null}
        </div>

        <div className="space-y-4">
          {props.questions.map((question, index) => (
            <QuizQuestion
              key={question.id}
              question={question}
              index={index}
              total={props.questions.length}
              selectedIds={answers[question.id] ?? []}
              disabled={submitting}
              onChange={(selectedIds) =>
                setAnswers((prev) => ({ ...prev, [question.id]: selectedIds }))
              }
            />
          ))}
        </div>

        <Button
          type="button"
          onClick={() => attemptId && void submit(attemptId, answers)}
          disabled={submitting || !attemptId}
          data-testid="submit-quiz-button"
        >
          {submitting ? "Mengirim…" : "Submit Quiz"}
        </Button>
      </div>
    );
  }

  // ---- Submitted ---------------------------------------------------------
  return result ? (
    <QuizResultView
      result={result}
      onRetry={() => void begin()}
      retrying={starting}
      nextHref={props.nextHref}
    />
  ) : null;
}
