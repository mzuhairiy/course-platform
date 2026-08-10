import { TransactionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { transactionFindMany, transactionCount, dollarTransaction } =
  vi.hoisted(() => ({
    transactionFindMany: vi.fn(),
    transactionCount: vi.fn(),
    dollarTransaction: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: { findMany: transactionFindMany, count: transactionCount },
    $transaction: dollarTransaction,
  },
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

import { getAdminTransactions } from "@/server/services/admin";

const ROWS = [{ id: "tx_1", orderId: "ORD-1", status: TransactionStatus.SUCCESS }];

beforeEach(() => {
  vi.clearAllMocks();
  dollarTransaction.mockResolvedValue([ROWS, 1]);
});

describe("getAdminTransactions", () => {
  it("paginates and returns rows + total", async () => {
    const result = await getAdminTransactions({}, 2, 10);

    expect(result).toEqual({ rows: ROWS, total: 1 });
    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it("filters by status", async () => {
    await getAdminTransactions({ status: TransactionStatus.PENDING }, 1, 10);

    expect(transactionFindMany.mock.calls[0][0].where).toEqual({
      status: TransactionStatus.PENDING,
    });
    expect(transactionCount).toHaveBeenCalledWith({
      where: { status: TransactionStatus.PENDING },
    });
  });

  it("builds an OR search across order id, user, and course", async () => {
    await getAdminTransactions({ q: "budi" }, 1, 10);

    const where = transactionFindMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(4);
    expect(where.OR[0]).toEqual({
      orderId: { contains: "budi", mode: "insensitive" },
    });
  });
});
