"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { startQuizSchema, submitQuizSchema } from "@/schemas/quiz";
import {
  startQuizAttempt,
  submitQuizAttempt,
  type QuizResult,
} from "@/server/services/quiz";

export type StartQuizActionResult =
  | { status: "success"; attemptId: string; startedAt: string; timeLimit: number | null }
  | { status: "error"; message: string };

export type SubmitQuizActionResult =
  | { status: "success"; result: QuizResult }
  | { status: "error"; message: string };

function reasonToMessage(reason: "not_found" | "forbidden"): string {
  return reason === "not_found"
    ? "Quiz tidak ditemukan."
    : "Kamu tidak punya akses ke quiz ini.";
}

export async function startQuizAction(
  input: unknown,
): Promise<StartQuizActionResult> {
  const parsed = startQuizSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Input tidak valid" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Sesi tidak ditemukan. Login ulang." };
  }

  // userId always from the session, never the client.
  const result = await startQuizAttempt(user.id, parsed.data.quizId);
  if (!result.ok) {
    return { status: "error", message: reasonToMessage(result.reason) };
  }

  return {
    status: "success",
    attemptId: result.attemptId,
    startedAt: result.startedAt.toISOString(),
    timeLimit: result.timeLimit,
  };
}

export async function submitQuizAction(
  input: unknown,
): Promise<SubmitQuizActionResult> {
  const parsed = submitQuizSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Input tidak valid" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Sesi tidak ditemukan. Login ulang." };
  }

  // Grading happens server-side; the client never sends a score.
  const result = await submitQuizAttempt(
    user.id,
    parsed.data.attemptId,
    parsed.data.answers,
  );
  if (!result.ok) {
    return { status: "error", message: reasonToMessage(result.reason) };
  }

  // Passing a quiz can complete the lecture/course; refresh derived views.
  if (result.result.passed) {
    revalidatePath("/dashboard");
    revalidatePath("/my-courses");
  }

  return { status: "success", result: result.result };
}
