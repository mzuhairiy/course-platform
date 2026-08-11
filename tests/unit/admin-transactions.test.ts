import { TransactionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  transactionFindMany,
  transactionCount,
  transactionGroupBy,
  dollarTransaction,
} = vi.hoisted(() => ({
  transactionFindMany: vi.fn(),
  transactionCount: vi.fn(),
  transactionGroupBy: vi.fn(),
  dollarTransaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: {
      findMany: transactionFindMany,
      count: transactionCount,
      groupBy: transactionGroupBy,
    },
    $transaction: dollarTransaction,
  },
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

import {
  parseAdminTransactionFilters,
  buildBaseQuery,
  hasActiveFilters,
  toDateRange,
} from "@/lib/admin-transaction-filters";
import {
  getAdminTransactions,
  getAdminTransactionSummary,
} from "@/server/services/admin-transaction";

const ROWS = [{ id: "tx_1", orderId: "ORD-1", status: TransactionStatus.SUCCESS }];

beforeEach(() => {
  vi.clearAllMocks();
  dollarTransaction.mockResolvedValue([ROWS, 1]);
  transactionGroupBy.mockResolvedValue([]);
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

  it("narrows by an inclusive createdAt range", async () => {
    const from = new Date("2026-01-01T00:00:00.000");
    const to = new Date("2026-01-31T23:59:59.999");

    await getAdminTransactions({ from, to }, 1, 10);

    expect(transactionFindMany.mock.calls[0][0].where).toEqual({
      createdAt: { gte: from, lte: to },
    });
  });

  it("omits createdAt entirely when no range is given", async () => {
    await getAdminTransactions({ q: "budi" }, 1, 10);

    expect(transactionFindMany.mock.calls[0][0].where.createdAt).toBeUndefined();
  });
});

describe("getAdminTransactionSummary", () => {
  it("maps grouped rows into per-status counts and amounts", async () => {
    transactionGroupBy.mockResolvedValue([
      {
        status: TransactionStatus.SUCCESS,
        _count: { _all: 2 },
        _sum: { amount: 300_000 },
      },
      {
        status: TransactionStatus.REFUNDED,
        _count: { _all: 1 },
        _sum: { amount: 150_000 },
      },
    ]);

    const summary = await getAdminTransactionSummary({});

    expect(summary.revenue).toBe(300_000);
    expect(summary.total).toBe(3);
    expect(summary.countByStatus.SUCCESS).toBe(2);
    expect(summary.amountByStatus.REFUNDED).toBe(150_000);
    // Statuses with no rows still resolve to 0 rather than undefined.
    expect(summary.countByStatus.EXPIRED).toBe(0);
    expect(summary.amountByStatus.PENDING).toBe(0);
  });

  it("keeps the date range but drops the status filter", async () => {
    const from = new Date("2026-01-01T00:00:00.000");

    await getAdminTransactionSummary({
      status: TransactionStatus.PENDING,
      from,
    });

    expect(transactionGroupBy.mock.calls[0][0].where).toEqual({
      createdAt: { gte: from },
    });
  });
});

describe("parseAdminTransactionFilters", () => {
  it("keeps valid values and drops unknown ones", () => {
    expect(
      parseAdminTransactionFilters({
        status: "SUCCESS",
        q: "  budi  ",
        from: "2026-01-01",
        to: "2026-01-31",
        page: "3",
      }),
    ).toEqual({
      status: TransactionStatus.SUCCESS,
      q: "budi",
      from: "2026-01-01",
      to: "2026-01-31",
      page: 3,
    });

    expect(
      parseAdminTransactionFilters({ status: "NOPE", page: "-1" }),
    ).toEqual({ status: undefined, q: "", from: "", to: "", page: 1 });
  });

  it("rejects malformed and impossible dates", () => {
    const filters = parseAdminTransactionFilters({
      from: "01/01/2026",
      to: "2026-13-45",
    });

    expect(filters.from).toBe("");
    expect(filters.to).toBe("");
  });

  it("round-trips active filters through the pagination query", () => {
    const filters = parseAdminTransactionFilters({
      status: "REFUNDED",
      q: "budi",
      from: "2026-01-01",
      page: "2",
    });

    // page is intentionally absent — Pagination re-adds it per link.
    expect(buildBaseQuery(filters)).toBe(
      "status=REFUNDED&q=budi&from=2026-01-01",
    );
    expect(hasActiveFilters(filters)).toBe(true);
    expect(hasActiveFilters(parseAdminTransactionFilters({}))).toBe(false);
  });
});

describe("toDateRange", () => {
  it("expands the day boundaries so both endpoints are inclusive", () => {
    const range = toDateRange(
      parseAdminTransactionFilters({ from: "2026-01-01", to: "2026-01-31" }),
    );

    expect(range.from?.getHours()).toBe(0);
    expect(range.from?.getDate()).toBe(1);
    expect(range.to?.getHours()).toBe(23);
    expect(range.to?.getMinutes()).toBe(59);
    expect(range.to?.getDate()).toBe(31);
  });

  it("returns an empty range when no dates are set", () => {
    expect(toDateRange(parseAdminTransactionFilters({}))).toEqual({});
  });
});
