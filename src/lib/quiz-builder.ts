// Client-safe quiz-builder helpers (no "server-only"): option JSON parsing +
// stable option id generation, shared by the builder UI and the service.

export type BuilderOption = { id: string; text: string };

/** Coerce a stored `QuizQuestion.options` JSON value into typed options. */
export function parseOptions(value: unknown): BuilderOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) =>
    entry && typeof entry === "object" && "id" in entry && "text" in entry
      ? [{ id: String(entry.id), text: String(entry.text) }]
      : [],
  );
}

// Fixed, stable ids for True/False questions.
export const TRUE_OPTION_ID = "true";
export const FALSE_OPTION_ID = "false";

export function trueFalseOptions(): BuilderOption[] {
  return [
    { id: TRUE_OPTION_ID, text: "Benar" },
    { id: FALSE_OPTION_ID, text: "Salah" },
  ];
}

let optionCounter = 0;

/**
 * A fresh, stable option id for a newly-added option. Existing options keep
 * their id on edit (QuizAttempt.answers reference the old ids), so we only ever
 * mint ids for brand-new options.
 */
export function newOptionId(): string {
  optionCounter += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1e9).toString(36);
  return `opt_${rand}_${optionCounter}`;
}
