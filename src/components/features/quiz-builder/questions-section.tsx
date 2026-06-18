"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { QuestionFormDialog } from "@/components/features/quiz-builder/question-form-dialog";
import { QuizPreview } from "@/components/features/quiz-builder/quiz-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heading, Text } from "@/components/ui/typography";
import {
  deleteQuestionAction,
  moveQuestionAction,
} from "@/server/actions/quiz-builder";
import type { QuizForBuilder } from "@/server/services/quiz-builder";

type BuilderQuestion = QuizForBuilder["questions"][number];

const TYPE_LABELS: Record<BuilderQuestion["type"], string> = {
  MULTIPLE_CHOICE: "Pilihan ganda",
  TRUE_FALSE: "Benar / Salah",
};

export function QuestionsSection({
  courseId,
  quizId,
  questions,
}: {
  courseId: string;
  quizId: string;
  questions: BuilderQuestion[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BuilderQuestion | null>(null);
  const [deleting, setDeleting] = useState<BuilderQuestion | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <section className="space-y-4" data-testid="quiz-questions">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading as="h2" level="h3">
          Soal ({questions.length})
        </Heading>
        <div className="flex items-center gap-2">
          <QuizPreview questions={questions} />
          <Button
            type="button"
            data-testid="add-question-button"
            onClick={openAdd}
          >
            Tambah Soal
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border p-8 text-center"
          data-testid="quiz-empty-warning"
        >
          <Text variant="muted">
            Quiz ini belum punya soal. Tambahkan minimal 1 soal sebelum publish
            course.
          </Text>
        </div>
      ) : (
        <ul className="space-y-2" data-testid="question-list">
          {questions.map((question, index) => (
            <li key={question.id}>
              <QuestionRow
                courseId={courseId}
                quizId={quizId}
                question={question}
                index={index}
                isFirst={index === 0}
                isLast={index === questions.length - 1}
                onEdit={() => {
                  setEditing(question);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleting(question)}
              />
            </li>
          ))}
        </ul>
      )}

      <QuestionFormDialog
        courseId={courseId}
        quizId={quizId}
        open={formOpen}
        onOpenChange={setFormOpen}
        question={editing}
      />

      <DeleteQuestionDialog
        courseId={courseId}
        quizId={quizId}
        question={deleting}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}

function QuestionRow({
  courseId,
  quizId,
  question,
  index,
  isFirst,
  isLast,
  onEdit,
  onDelete,
}: {
  courseId: string;
  quizId: string;
  question: BuilderQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveQuestionAction(
        courseId,
        quizId,
        question.id,
        direction,
      );
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card data-testid="question-item">
      <CardContent className="flex items-start gap-3 p-3">
        <div className="flex flex-col">
          <button
            type="button"
            aria-label="Naikkan urutan"
            data-testid="move-question-up"
            disabled={isFirst || isPending}
            onClick={() => move("up")}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Turunkan urutan"
            data-testid="move-question-down"
            disabled={isLast || isPending}
            onClick={() => move("down")}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{index + 1}</span>
            <Badge variant="secondary">{TYPE_LABELS[question.type]}</Badge>
          </div>
          <p className="font-medium" data-testid="question-text">
            {question.question}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="edit-question-button"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="delete-question-button"
            onClick={onDelete}
          >
            Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteQuestionDialog({
  courseId,
  quizId,
  question,
  onClose,
}: {
  courseId: string;
  quizId: string;
  question: BuilderQuestion | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    if (!question) return;
    startTransition(async () => {
      const result = await deleteQuestionAction(courseId, quizId, question.id);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={Boolean(question)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="delete-question-dialog">
        <DialogHeader>
          <DialogTitle>Hapus soal ini?</DialogTitle>
          <DialogDescription>
            Soal akan dihapus permanen dari quiz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="delete-question-confirm"
            disabled={isPending}
            onClick={confirmDelete}
          >
            {isPending ? "Menghapus…" : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
