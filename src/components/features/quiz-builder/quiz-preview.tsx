"use client";

import { useState } from "react";

import { QuizQuestion } from "@/components/features/quiz/quiz-question";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientQuizQuestion } from "@/lib/quiz";
import { parseOptions } from "@/lib/quiz-builder";
import type { QuizForBuilder } from "@/server/services/quiz-builder";

type BuilderQuestion = QuizForBuilder["questions"][number];

/** Map builder questions to the student-facing (answer-key-free) shape. */
function toClientQuestion(q: BuilderQuestion): ClientQuizQuestion {
  return {
    id: q.id,
    type: q.type,
    question: q.question,
    options: parseOptions(q.options),
    order: q.order,
    multiple: q.type === "MULTIPLE_CHOICE" && q.correctAnswerIds.length > 1,
  };
}

export function QuizPreview({ questions }: { questions: BuilderQuestion[] }) {
  const [open, setOpen] = useState(false);
  const clientQuestions = questions.map(toClientQuestion);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        data-testid="preview-quiz-button"
        disabled={questions.length === 0}
        onClick={() => setOpen(true)}
      >
        Preview Quiz
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-testid="quiz-preview-dialog"
          className="max-h-[90vh] max-w-2xl overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Preview Quiz</DialogTitle>
            <DialogDescription>
              Tampilan persis seperti yang dilihat student (read-only).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {clientQuestions.map((question, index) => (
              <QuizQuestion
                key={question.id}
                question={question}
                index={index}
                total={clientQuestions.length}
                selectedIds={[]}
                onChange={() => {}}
                disabled
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
