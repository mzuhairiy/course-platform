"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { ForbiddenError, requireRole } from "@/lib/rbac";
import {
  adminTransactionStatusSchema,
  type AdminTransactionStatusInput,
} from "@/schemas/transaction";
import type { AdminActor } from "@/server/services/admin";
import {
  InvalidTransactionTransitionError,
  setTransactionStatus,
  TransactionNotFoundError,
} from "@/server/services/admin-transaction-status";

export type AdminTransactionActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const LIST_PATH = "/admin/transactions";

/**
 * Ubah status transaksi secara manual. Tanpa payment gateway, ini satu-satunya
 * jalan sebuah transaksi bisa berakhir di FAILED / EXPIRED / REFUNDED.
 */
export async function updateTransactionStatusAction(
  input: AdminTransactionStatusInput,
): Promise<AdminTransactionActionResult> {
  const user = await requireRole(UserRole.ADMIN);

  const parsed = adminTransactionStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }
  const { orderId, status, note } = parsed.data;

  const actor: AdminActor = { id: user.id, role: user.role };
  try {
    const result = await setTransactionStatus(orderId, status, actor, note);

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${orderId}`);

    const suffix = result.enrollmentGranted
      ? " — user di-enroll ke course."
      : result.enrollmentRevoked
        ? " — akses course dicabut."
        : "";
    return {
      status: "success",
      message: `Transaksi ditandai ${result.status}${suffix}`,
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof TransactionNotFoundError ||
      error instanceof InvalidTransactionTransitionError
    ) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}
