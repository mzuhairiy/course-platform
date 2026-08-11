import "server-only";

import { Prisma, TransactionStatus } from "@prisma/client";

import { TRANSACTION_STATUS_VALUES } from "@/config/transaction-status";
import { db } from "@/lib/db";

export type AdminTransactionFilters = {
  status?: TransactionStatus;
  q?: string;
  /** Inklusif; sudah dinormalisasi ke awal hari oleh caller. */
  from?: Date;
  /** Inklusif; sudah dinormalisasi ke akhir hari oleh caller. */
  to?: Date;
};

/**
 * Where clause bersama untuk list dan summary. `status` sengaja dipisah lewat
 * `withStatus` supaya summary bisa memakai rentang + pencarian yang sama tapi
 * tetap menghitung breakdown seluruh status.
 */
function buildWhere(
  filters: AdminTransactionFilters,
  withStatus = true,
): Prisma.TransactionWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.from) createdAt.gte = filters.from;
  if (filters.to) createdAt.lte = filters.to;

  return {
    ...(withStatus && filters.status ? { status: filters.status } : {}),
    ...(filters.from || filters.to ? { createdAt } : {}),
    ...(filters.q
      ? {
          OR: [
            { orderId: { contains: filters.q, mode: "insensitive" } },
            { user: { email: { contains: filters.q, mode: "insensitive" } } },
            { user: { name: { contains: filters.q, mode: "insensitive" } } },
            { course: { title: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

const adminTransactionSelect = {
  id: true,
  orderId: true,
  amount: true,
  status: true,
  paymentMethod: true,
  paidAt: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
  course: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.TransactionSelect;

export type AdminTransactionRow = Prisma.TransactionGetPayload<{
  select: typeof adminTransactionSelect;
}>;

/** Admin-wide transaction list: filter by status, free-text, date range. */
export async function getAdminTransactions(
  filters: AdminTransactionFilters,
  page: number,
  perPage: number,
): Promise<{ rows: AdminTransactionRow[]; total: number }> {
  const where = buildWhere(filters);

  const [rows, total] = await db.$transaction([
    db.transaction.findMany({
      where,
      select: adminTransactionSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.transaction.count({ where }),
  ]);

  return { rows, total };
}

export type AdminTransactionSummary = {
  countByStatus: Record<TransactionStatus, number>;
  amountByStatus: Record<TransactionStatus, number>;
  total: number;
  /** Jumlah rupiah yang benar-benar masuk (status SUCCESS). */
  revenue: number;
};

function emptyStatusMap(): Record<TransactionStatus, number> {
  return Object.fromEntries(
    TRANSACTION_STATUS_VALUES.map((status) => [status, 0]),
  ) as Record<TransactionStatus, number>;
}

/**
 * Breakdown per status untuk rentang + pencarian yang sama dengan list (filter
 * status diabaikan — summary justru yang menampilkan semua status sekaligus).
 */
export async function getAdminTransactionSummary(
  filters: AdminTransactionFilters,
): Promise<AdminTransactionSummary> {
  const grouped = await db.transaction.groupBy({
    by: ["status"],
    where: buildWhere(filters, false),
    _count: { _all: true },
    _sum: { amount: true },
  });

  const countByStatus = emptyStatusMap();
  const amountByStatus = emptyStatusMap();
  let total = 0;

  for (const row of grouped) {
    countByStatus[row.status] = row._count._all;
    amountByStatus[row.status] = row._sum.amount ?? 0;
    total += row._count._all;
  }

  return {
    countByStatus,
    amountByStatus,
    total,
    revenue: amountByStatus.SUCCESS,
  };
}

const adminTransactionDetailSelect = {
  id: true,
  orderId: true,
  amount: true,
  status: true,
  paymentMethod: true,
  paymentPayload: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, role: true } },
  course: { select: { id: true, title: true, slug: true, price: true } },
} satisfies Prisma.TransactionSelect;

export type AdminTransactionDetail = Prisma.TransactionGetPayload<{
  select: typeof adminTransactionDetailSelect;
}>;

/** Detail satu transaksi untuk admin (tidak di-scope ke owner — admin-only route). */
export function getAdminTransactionByOrderId(orderId: string) {
  return db.transaction.findUnique({
    where: { orderId },
    select: adminTransactionDetailSelect,
  });
}
