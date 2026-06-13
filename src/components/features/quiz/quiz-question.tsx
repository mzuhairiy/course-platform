"use client";

import type { ClientQuizQuestion } from "@/lib/quiz";
import { cn } from "@/lib/utils";

/**
 * Renders one quiz question with radio (single-answer) or checkbox
 * (multi-answer) controls. Selection lives in the parent; this component is
 * controlled via selectedIds + onChange.
 */
export function QuizQuestion({
  question,
  index,
  total,
  selectedIds,
  onChange,
  disabled = false,
}: {
  question: ClientQuizQuestion;
  index: number;
  total: number;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(selectedIds);

  function toggle(optionId: string) {
    if (disabled) return;
    if (question.multiple) {
      const next = new Set(selected);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      onChange(Array.from(next));
    } else {
      onChange([optionId]);
    }
  }

  return (
    <fieldset
      className="space-y-3 rounded-lg border border-border p-4"
      data-testid="quiz-question"
      data-question-id={question.id}
    >
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Soal {index + 1} dari {total}
        {question.multiple ? " · pilih semua yang benar" : ""}
      </legend>
      <p className="font-medium">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <label
              key={option.id}
              data-testid="quiz-option"
              data-option-id={option.id}
              data-selected={isSelected}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent",
                disabled && "cursor-not-allowed opacity-70",
              )}
            >
              <input
                type={question.multiple ? "checkbox" : "radio"}
                name={question.id}
                value={option.id}
                checked={isSelected}
                disabled={disabled}
                onChange={() => toggle(option.id)}
                className="h-4 w-4 accent-primary"
              />
              <span>{option.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
