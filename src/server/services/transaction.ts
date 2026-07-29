import "server-only";

import { Prisma, TransactionStatus } from "@prisma/client";

import type { PaymentMethod } from "@/config/payment";
import { db } from "@/lib/db";
import type { PaymentOutcome } from "@/schemas/checkout";

const transactionSelect = {
  id: true,
  orderId: true,
  amount: true,
  status: true,
  paymentMethod: true,
  paidAt: true,
  createdAt: true,
  course: { select: { title: true, slug: true } },
} satisfies Prisma.TransactionSelect;

export type UserTransaction = Prisma.TransactionGetPayload<{
  select: typeof transactionSelect;
}>;

/** A user's payment history, newest first. */
export function getUserTransactions(userId: string) {
  return db.transaction.findMany({
    where: { userId },
    select: transactionSelect,
    orderBy: { createdAt: "desc" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Dummy checkout (no payment gateway — see src/config/payment.ts)
// ─────────────────────────────────────────────────────────────────────────────

/** Unique, traceable order id: ORD-{timestamp}-{random6}. */
export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export function getTransactionByOrderId(orderId: string) {
  return db.transaction.findUnique({ where: { orderId } });
}

export function createPendingTransaction(input: {
  userId: string;
  courseId: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
}) {
  return db.transaction.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      orderId: input.orderId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      status: TransactionStatus.PENDING,
    },
    select: { id: true, orderId: true },
  });
}

/** An existing reusable PENDING transaction for this user+course, if any. */
export function findPendingTransaction(userId: string, courseId: string) {
  return db.transaction.findFirst({
    where: { userId, courseId, status: TransactionStatus.PENDING },
  });
}

/** User can switch method before paying; the pending order id stays the same. */
export function updatePaymentMethod(orderId: string, method: PaymentMethod) {
  return db.transaction.update({
    where: { orderId },
    data: { paymentMethod: method },
    select: { id: true },
  });
}

/** A single transaction owned by `userId` (status page must not leak others'). */
export function getOwnedTransaction(userId: string, orderId: string) {
  return db.transaction.findFirst({
    where: { orderId, userId },
    select: {
      orderId: true,
      status: true,
      amount: true,
      paymentMethod: true,
      createdAt: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          // First lecture, so a settled order can link straight into the player.
          sections: {
            orderBy: { order: "asc" },
            take: 1,
            select: {
              lectures: { orderBy: { order: "asc" }, take: 1, select: { id: true } },
            },
          },
        },
      },
    },
  });
}

export type SettlementResult = {
  ok: boolean;
  status: TransactionStatus | null;
  message: string;
  /** Set when the transaction settled, so the caller can link to the course. */
  courseId?: string;
};

/**
 * Apply a simulated payment outcome (HTTP-free, unit-tested).
 *
 * - Scoped to the owner: you can never settle someone else's order.
 * - Idempotent: a second "success" on a settled order is a no-op.
 * - Only a PENDING transaction can change state.
 * - On success the transaction update AND the enrollment happen in one DB
 *   transaction, so a paid order can never end up without access.
 */
export async function applyPaymentOutcome(
  userId: string,
  orderId: string,
  outcome: PaymentOutcome,
): Promise<SettlementResult> {
  const txn = await db.transaction.findFirst({ where: { orderId, userId } });
  if (!txn) {
    return { ok: false, status: null, message: "Transaksi tidak ditemukan." };
  }

  if (txn.status === TransactionStatus.SUCCESS) {
    return {
      ok: true,
      status: TransactionStatus.SUCCESS,
      message: "Transaksi ini sudah lunas.",
      courseId: txn.courseId,
    };
  }

  if (txn.status !== TransactionStatus.PENDING) {
    return {
      ok: false,
      status: txn.status,
      message: "Transaksi ini sudah tidak aktif.",
    };
  }

  const payload = {
    simulated: true,
    outcome,
    paymentMethod: txn.paymentMethod,
  } satisfies Prisma.InputJsonObject;

  if (outcome === "cancel") {
    await db.transaction.update({
      where: { orderId },
      data: { status: TransactionStatus.CANCELLED, paymentPayload: payload },
    });
    return {
      ok: true,
      status: TransactionStatus.CANCELLED,
      message: "Pembayaran dibatalkan.",
    };
  }

  await db.$transaction([
    db.transaction.update({
      where: { orderId },
      data: {
        status: TransactionStatus.SUCCESS,
        paidAt: new Date(),
        paymentPayload: payload,
      },
    }),
    db.enrollment.upsert({
      where: { userId_courseId: { userId: txn.userId, courseId: txn.courseId } },
      create: { userId: txn.userId, courseId: txn.courseId },
      update: {},
    }),
  ]);

  return {
    ok: true,
    status: TransactionStatus.SUCCESS,
    message: "Pembayaran berhasil.",
    courseId: txn.courseId,
  };
}
