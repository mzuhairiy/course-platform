import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

const transactionSelect = {
  id: true,
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
