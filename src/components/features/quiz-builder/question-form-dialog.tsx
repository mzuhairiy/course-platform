"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  newOptionId,
  parseOptions,
  trueFalseOptions,
} from "@/lib/quiz-builder";
import {
  QUESTION_OPTION_MAX,
  QUESTION_OPTION_MIN,
  type QuestionInput,
  type QuestionTypeValue,
} from "@/schemas/quiz-builder";
import {
  addQuestionAction,
  updateQuestionAction,
} from "@/server/actions/quiz-builder";
import type { QuizForBuilder } from "@/server/services/quiz-builder";

type BuilderQuestion = QuizForBuilder["questions"][number];
type OptionDraft = { id: string; text: string; isCorrect: boolean };

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm";

function blankOptions(): OptionDraft[] {
  return [
    { id: newOptionId(), text: "", isCorrect: false },
    { id: newOptionId(), text: "", isCorrect: false },
  ];
}

function toDrafts(question: BuilderQuestion): OptionDraft[] {
  const correct = new Set(question.correctAnswerIds);
  return parseOptions(question.options).map((o) => ({
    id: o.id,
    text: o.text,
    isCorrect: correct.has(o.id),
  }));
}

function trueFalseDrafts(correctId?: string): OptionDraft[] {
  return trueFalseOptions().map((o) => ({
    id: o.id,
    text: o.text,
    isCorrect: o.id === correctId,
  }));
}

export function QuestionFormDialog({
  courseId,
  quizId,
  open,
  onOpenChange,
  question,
}: {
  courseId: string;
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: BuilderQuestion | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(question);

  const [type, setType] = useState<QuestionTypeValue>("MULTIPLE_CHOICE");
  const [text, setText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>(blankOptions());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (question) {
      setType(question.type as QuestionTypeValue);
      setText(question.question);
      setExplanation(question.explanation ?? "");
      setOptions(toDrafts(question));
    } else {
      setType("MULTIPLE_CHOICE");
      setText("");
      setExplanation("");
      setOptions(blankOptions());
    }
  }, [open, question]);

  function changeType(next: QuestionTypeValue) {
    setType(next);
    if (next === "TRUE_FALSE") {
      setOptions(trueFalseDrafts());
    } else {
      setOptions(blankOptions());
    }
  }

  function setOptionText(id: string, value: string) {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, text: value } : o)),
    );
  }

  function toggleCorrect(id: string) {
    setOptions((prev) =>
      type === "TRUE_FALSE"
        ? prev.map((o) => ({ ...o, isCorrect: o.id === id }))
        : prev.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)),
    );
  }

  function addOption() {
    setOptions((prev) =>
      prev.length >= QUESTION_OPTION_MAX
        ? prev
        : [...prev, { id: newOptionId(), text: "", isCorrect: false }],
    );
  }

  function removeOption(id: string) {
    setOptions((prev) =>
      prev.length <= QUESTION_OPTION_MIN
        ? prev
        : prev.filter((o) => o.id !== id),
    );
  }

  function submit() {
    setError(null);
    const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id);

    // Lightweight client guard (server re-validates authoritatively).
    if (!text.trim()) return setError("Pertanyaan wajib diisi");
    if (options.some((o) => !o.text.trim()))
      return setError("Semua opsi harus punya teks");
    if (correctIds.length < 1)
      return setError("Tandai minimal 1 jawaban benar");

    const payload: QuestionInput = {
      type,
      question: text.trim(),
      explanation: explanation.trim(),
      options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
      correctAnswerIds: correctIds,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateQuestionAction(courseId, quizId, question!.id, payload)
        : await addQuestionAction(courseId, quizId, payload);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      toast.success(<span data-testid="success-toast">{result.message}</span>);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="question-form-dialog"
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Soal" : "Tambah Soal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <p
              role="alert"
              data-testid="question-form-error"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="question-type">Tipe</Label>
            <select
              id="question-type"
              className={SELECT_CLASS}
              data-testid="question-type-select"
              value={type}
              onChange={(e) => changeType(e.target.value as QuestionTypeValue)}
            >
              <option value="MULTIPLE_CHOICE">Pilihan ganda</option>
              <option value="TRUE_FALSE">Benar / Salah</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-text">Pertanyaan</Label>
            <Textarea
              id="question-text"
              rows={3}
              data-testid="question-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Opsi jawaban</Label>
            <p className="text-xs text-muted-foreground">
              Centang opsi yang benar
              {type === "MULTIPLE_CHOICE" ? " (boleh lebih dari satu)" : ""}.
            </p>
            <ul className="space-y-2">
              {options.map((option) => (
                <li
                  key={option.id}
                  className="flex items-center gap-2"
                  data-testid="option-row"
                >
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={() => toggleCorrect(option.id)}
                    aria-label="Jawaban benar"
                    data-testid="correct-answer-checkbox"
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <Input
                    data-testid="option-input"
                    value={option.text}
                    disabled={type === "TRUE_FALSE"}
                    placeholder="Teks opsi"
                    onChange={(e) => setOptionText(option.id, e.target.value)}
                  />
                  {type === "MULTIPLE_CHOICE" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Hapus opsi"
                      data-testid="remove-option-button"
                      disabled={options.length <= QUESTION_OPTION_MIN}
                      onClick={() => removeOption(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
            {type === "MULTIPLE_CHOICE" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="add-option-button"
                disabled={options.length >= QUESTION_OPTION_MAX}
                onClick={addOption}
              >
                Tambah opsi
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Penjelasan (opsional)</Label>
            <Textarea
              id="explanation"
              rows={2}
              data-testid="explanation-input"
              placeholder="Ditampilkan saat review setelah submit"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              data-testid="question-form-submit"
              disabled={isPending}
              onClick={submit}
            >
              {isPending ? "Menyimpan…" : isEdit ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
