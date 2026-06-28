import "server-only";

import { Prisma, TransactionStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { verifySignature } from "@/lib/midtrans";

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
// Checkout + webhook (Fase 2 skeleton)
// ─────────────────────────────────────────────────────────────────────────────

/** Unique, traceable order id: ORD-{timestamp}-{random6}. */
export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

/** Subset of the Midtrans notification payload we rely on. */
export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
};

export type NotificationResult = {
  ok: boolean;
  /** HTTP status the webhook route should return. */
  status: number;
  message: string;
};

/** Map a Midtrans transaction_status (+fraud) to our internal status. */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string,
): TransactionStatus | null {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "accept"
        ? TransactionStatus.SUCCESS
        : TransactionStatus.PENDING;
    case "settlement":
      return TransactionStatus.SUCCESS;
    case "pending":
      return TransactionStatus.PENDING;
    case "deny":
    case "cancel":
      return TransactionStatus.CANCELLED;
    case "expire":
      return TransactionStatus.EXPIRED;
    case "refund":
    case "partial_refund":
      return TransactionStatus.REFUNDED;
    default:
      return null;
  }
}

export function getTransactionByOrderId(orderId: string) {
  return db.transaction.findUnique({ where: { orderId } });
}

export function createPendingTransaction(input: {
  userId: string;
  courseId: string;
  orderId: string;
  amount: number;
}) {
  return db.transaction.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      orderId: input.orderId,
      amount: input.amount,
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

/** Persist the Snap token returned by Midtrans for later reuse. */
export function saveMidtransToken(orderId: string, token: string) {
  return db.transaction.update({
    where: { orderId },
    data: { midtransToken: token },
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
      course: { select: { id: true, title: true, slug: true } },
    },
  });
}

/**
 * Core webhook logic (HTTP-free, unit-tested). Verifies signature + amount,
 * is idempotent (ignores anything after SUCCESS), and on the SUCCESS transition
 * updates the transaction AND creates the enrollment in one DB transaction.
 */
export async function processPaymentNotification(
  payload: MidtransNotification,
): Promise<NotificationResult> {
  const valid = verifySignature(
    payload.order_id,
    payload.status_code,
    payload.gross_amount,
    payload.signature_key,
  );
  if (!valid) {
    return { ok: false, status: 403, message: "Invalid signature" };
  }

  const txn = await getTransactionByOrderId(payload.order_id);
  if (!txn) {
    return { ok: false, status: 404, message: "Transaction not found" };
  }

  // Guard against tampering: notified amount must match what we recorded.
  if (Math.round(Number(payload.gross_amount)) !== txn.amount) {
    return { ok: false, status: 400, message: "Amount mismatch" };
  }

  // Idempotent: once SUCCESS, ignore any later (possibly out-of-order) notice.
  if (txn.status === TransactionStatus.SUCCESS) {
    return { ok: true, status: 200, message: "Already settled (no-op)" };
  }

  const nextStatus = mapMidtransStatus(
    payload.transaction_status,
    payload.fraud_status,
  );
  if (!nextStatus) {
    return { ok: true, status: 200, message: "Unhandled status (ignored)" };
  }

  if (nextStatus === TransactionStatus.SUCCESS) {
    await db.$transaction([
      db.transaction.update({
        where: { orderId: payload.order_id },
        data: {
          status: TransactionStatus.SUCCESS,
          paidAt: new Date(),
          paymentMethod: payload.payment_type ?? null,
          midtransResponse: payload as unknown as Prisma.InputJsonValue,
        },
      }),
      db.enrollment.upsert({
        where: {
          userId_courseId: { userId: txn.userId, courseId: txn.courseId },
        },
        create: { userId: txn.userId, courseId: txn.courseId },
        update: {},
      }),
    ]);
    return { ok: true, status: 200, message: "Settled + enrolled" };
  }

  await db.transaction.update({
    where: { orderId: payload.order_id },
    data: {
      status: nextStatus,
      paymentMethod: payload.payment_type ?? null,
      midtransResponse: payload as unknown as Prisma.InputJsonValue,
    },
  });
  return { ok: true, status: 200, message: `Updated to ${nextStatus}` };
}
