"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { toFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { ForbiddenError, requireRole } from "@/lib/rbac";
import { categoryFormSchema, type CategoryFormInput } from "@/schemas/category";
import type { AdminActor } from "@/server/services/admin";
import {
  categorySlugExists,
  createCategory,
  CategoryInUseError,
  deleteCategory,
  updateCategory,
} from "@/server/services/category";

export type CategoryActionResult =
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

const CATEGORIES_PATH = "/admin/categories";

const SLUG_TAKEN: FieldErrors = { slug: "Slug ini sudah dipakai kategori lain" };

function toErrorResult(error: unknown): CategoryActionResult {
  if (error instanceof ForbiddenError || error instanceof CategoryInUseError) {
    return { status: "error", message: error.message };
  }
  throw error;
}

export async function createCategoryAction(
  input: CategoryFormInput,
): Promise<CategoryActionResult> {
  const user = await requireRole(UserRole.ADMIN);

  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (await categorySlugExists(parsed.data.slug)) {
    return { status: "error", message: "Slug sudah dipakai", fieldErrors: SLUG_TAKEN };
  }

  const actor: AdminActor = { id: user.id, role: user.role };
  try {
    await createCategory(parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(CATEGORIES_PATH);
  return { status: "success", message: "Kategori ditambahkan" };
}

export async function updateCategoryAction(
  categoryId: string,
  input: CategoryFormInput,
): Promise<CategoryActionResult> {
  const user = await requireRole(UserRole.ADMIN);

  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (await categorySlugExists(parsed.data.slug, categoryId)) {
    return { status: "error", message: "Slug sudah dipakai", fieldErrors: SLUG_TAKEN };
  }

  const actor: AdminActor = { id: user.id, role: user.role };
  try {
    await updateCategory(categoryId, parsed.data, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(CATEGORIES_PATH);
  return { status: "success", message: "Kategori diperbarui" };
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<CategoryActionResult> {
  const user = await requireRole(UserRole.ADMIN);
  const actor: AdminActor = { id: user.id, role: user.role };

  try {
    await deleteCategory(categoryId, actor);
  } catch (error) {
    return toErrorResult(error);
  }

  revalidatePath(CATEGORIES_PATH);
  return { status: "success", message: "Kategori dihapus" };
}
