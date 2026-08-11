import "server-only";

import { Prisma, TransactionStatus } from "@prisma/client";

import { canAdminTransition } from "@/config/transaction-status";
import { db } from "@/lib/db";
import { assertAdmin, type AdminActor } from "@/server/services/admin";

/**
 * Perubahan status transaksi secara manual — pengganti webhook payment gateway
 * yang tidak ada di platform ini. Query/list-nya ada di ./admin-transaction.ts.
 */

export class TransactionNotFoundError extends Error {
  constructor() {
    super("Transaksi tidak ditemukan.");
    this.name = "TransactionNotFoundError";
  }
}

export class InvalidTransactionTransitionError extends Error {
  constructor(from: TransactionStatus, to: TransactionStatus) {
    super(`Transaksi ${from} tidak bisa diubah ke ${to}.`);
    this.name = "InvalidTransactionTransitionError";
  }
}

/** Satu baris jejak audit yang disimpan di Transaction.paymentPayload. */
export type AdminTransactionAuditEntry = {
  at: string;
  from: TransactionStatus;
  to: TransactionStatus;
  actorId: string;
  note: string | null;
};

/** Baca jejak aksi admin dari paymentPayload (aman untuk payload lama/kosong). */
export function readAuditTrail(
  payload: Prisma.JsonValue | null,
): AdminTransactionAuditEntry[] {
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }
  const entries = (payload as Prisma.JsonObject).adminActions;
  if (!Array.isArray(entries)) return [];
  return entries.filter(
    (entry): entry is Prisma.JsonObject =>
      entry != null && typeof entry === "object" && !Array.isArray(entry),
  ) as unknown as AdminTransactionAuditEntry[];
}

function appendAuditEntry(
  payload: Prisma.JsonValue | null,
  entry: AdminTransactionAuditEntry,
): Prisma.InputJsonValue {
  const base =
    payload != null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Prisma.JsonObject)
      : {};
  // Cast dibutuhkan karena Prisma.JsonObject boleh punya nilai null sementara
  // InputJsonObject tidak — nilai lamanya sendiri sudah pernah lolos validasi.
  return {
    ...base,
    adminActions: [...readAuditTrail(payload), entry],
  } as unknown as Prisma.InputJsonValue;
}

export type AdminTransactionUpdateResult = {
  orderId: string;
  from: TransactionStatus;
  status: TransactionStatus;
  enrollmentGranted: boolean;
  enrollmentRevoked: boolean;
};

/**
 * Pindahkan status transaksi secara manual (ADMIN-only).
 *
 * - Transisi divalidasi lewat ADMIN_TRANSACTION_TRANSITIONS — status final
 *   tidak bisa dibuka lagi, jadi riwayat pembayaran tetap bisa diaudit.
 * - PENDING → SUCCESS: update status + enroll user dalam SATU DB transaction,
 *   supaya transaksi lunas tidak pernah berakhir tanpa akses.
 * - SUCCESS → REFUNDED: akses dicabut, KECUALI user masih punya transaksi
 *   SUCCESS lain untuk course yang sama (mis. pembelian ulang).
 * - Setiap aksi menambah jejak audit di paymentPayload.adminActions.
 */
export async function setTransactionStatus(
  orderId: string,
  next: TransactionStatus,
  actor: AdminActor,
  note?: string,
): Promise<AdminTransactionUpdateResult> {
  assertAdmin(actor);

  const txn = await db.transaction.findUnique({ where: { orderId } });
  if (!txn) {
    throw new TransactionNotFoundError();
  }
  if (!canAdminTransition(txn.status, next)) {
    throw new InvalidTransactionTransitionError(txn.status, next);
  }

  const now = new Date();
  const paymentPayload = appendAuditEntry(txn.paymentPayload, {
    at: now.toISOString(),
    from: txn.status,
    to: next,
    actorId: actor.id,
    note: note?.trim() || null,
  });

  if (next === TransactionStatus.SUCCESS) {
    await db.$transaction([
      db.transaction.update({
        where: { orderId },
        data: { status: next, paidAt: txn.paidAt ?? now, paymentPayload },
      }),
      db.enrollment.upsert({
        where: {
          userId_courseId: { userId: txn.userId, courseId: txn.courseId },
        },
        create: { userId: txn.userId, courseId: txn.courseId },
        update: {},
      }),
    ]);

    return {
      orderId,
      from: txn.status,
      status: next,
      enrollmentGranted: true,
      enrollmentRevoked: false,
    };
  }

  if (next === TransactionStatus.REFUNDED) {
    const otherPaid = await db.transaction.count({
      where: {
        userId: txn.userId,
        courseId: txn.courseId,
        status: TransactionStatus.SUCCESS,
        orderId: { not: orderId },
      },
    });
    const revoke = otherPaid === 0;

    await db.$transaction([
      db.transaction.update({
        where: { orderId },
        data: { status: next, paymentPayload },
      }),
      ...(revoke
        ? [
            db.enrollment.deleteMany({
              where: { userId: txn.userId, courseId: txn.courseId },
            }),
          ]
        : []),
    ]);

    return {
      orderId,
      from: txn.status,
      status: next,
      enrollmentGranted: false,
      enrollmentRevoked: revoke,
    };
  }

  // FAILED / EXPIRED / CANCELLED — tidak pernah ada akses untuk dicabut.
  await db.transaction.update({
    where: { orderId },
    data: { status: next, paymentPayload },
  });

  return {
    orderId,
    from: txn.status,
    status: next,
    enrollmentGranted: false,
    enrollmentRevoked: false,
  };
}
