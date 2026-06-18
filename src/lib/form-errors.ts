import type { z } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

/** First message per top-level field from a Zod error, for inline display. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
