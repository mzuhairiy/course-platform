"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { ForbiddenError, requireRole } from "@/lib/rbac";
import { toFieldErrors, type FieldErrors } from "@/lib/form-errors";
import {
  questionSchema,
  quizSettingsSchema,
  type QuestionInput,
  type QuizSettingsInput,
} from "@/schemas/quiz-builder";
import {
  addQuestion,
  deleteQuestion,
  moveQuestion,
  QuestionNotFoundError,
  QuizNotFoundError,
  QuizValidationError,
  updateQuestion,
  updateQuizSettings,
  type QuizActor,
} from "@/server/services/quiz-builder";

export type QuizBuilderResult =
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

function quizPath(courseId: string, quizId: string) {
  return `/instructor/courses/${courseId}/quiz/${quizId}`;
}

function toErrorResult(error: unknown): QuizBuilderResult {
  if (
    error instanceof ForbiddenError ||
    error instanceof QuizNotFoundError ||
    error instanceof QuestionNotFoundError ||
    error instanceof QuizValidationError
  ) {
    return { status: "error", message: error.message };
  }
  throw error;
}

export async function updateQuizSettingsAction(
  courseId: string,
  quizId: string,
  input: QuizSettingsInput,
): Promise<QuizBuilderResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

  const parsed = quizSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const actor: QuizActor = { id: user.id, role: user.role };
  try {
    await updateQuizSettings(quizId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(quizPath(courseId, quizId));
  return { status: "success", message: "Settings disimpan" };
}

export async function addQuestionAction(
  courseId: string,
  quizId: string,
  input: QuestionInput,
): Promise<QuizBuilderResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const actor: QuizActor = { id: user.id, role: user.role };
  try {
    await addQuestion(quizId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(quizPath(courseId, quizId));
  return { status: "success", message: "Soal ditambahkan" };
}

export async function updateQuestionAction(
  courseId: string,
  quizId: string,
  questionId: string,
  input: QuestionInput,
): Promise<QuizBuilderResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const actor: QuizActor = { id: user.id, role: user.role };
  try {
    await updateQuestion(questionId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(quizPath(courseId, quizId));
  return { status: "success", message: "Soal diperbarui" };
}

export async function deleteQuestionAction(
  courseId: string,
  quizId: string,
  questionId: string,
): Promise<QuizBuilderResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  const actor: QuizActor = { id: user.id, role: user.role };

  try {
    await deleteQuestion(questionId, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(quizPath(courseId, quizId));
  return { status: "success", message: "Soal dihapus" };
}

export async function moveQuestionAction(
  courseId: string,
  quizId: string,
  questionId: string,
  direction: "up" | "down",
): Promise<QuizBuilderResult> {
  const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  const actor: QuizActor = { id: user.id, role: user.role };

  try {
    await moveQuestion(questionId, direction, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(quizPath(courseId, quizId));
  return { status: "success" };
}
