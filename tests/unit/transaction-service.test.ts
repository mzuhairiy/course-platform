import { TransactionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { txFindFirst, txUpdate, enrUpsert, dollarTx } = vi.hoisted(() => ({
  txFindFirst: vi.fn(),
  txUpdate: vi.fn(),
  enrUpsert: vi.fn(),
  dollarTx: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: { findFirst: txFindFirst, update: txUpdate },
    enrollment: { upsert: enrUpsert },
    $transaction: dollarTx,
  },
}));

import { paymentSimulationSchema } from "@/schemas/checkout";
import {
  applyPaymentOutcome,
  generateOrderId,
} from "@/server/services/transaction";

const pendingTxn = {
  orderId: "ORD-1",
  userId: "user_1",
  courseId: "course_1",
  amount: 150000,
  paymentMethod: "bank_transfer",
  status: TransactionStatus.PENDING,
};

beforeEach(() => {
  vi.clearAllMocks();
  dollarTx.mockResolvedValue([]);
  txUpdate.mockResolvedValue({});
  enrUpsert.mockResolvedValue({});
});

describe("generateOrderId", () => {
  it("matches the ORD-x-y format and is unique", () => {
    const a = generateOrderId();
    const b = generateOrderId();
    expect(a).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]{6}$/);
    expect(a).not.toBe(b);
  });

  it("produces ids the simulation schema accepts", () => {
    const parsed = paymentSimulationSchema.safeParse({
      orderId: generateOrderId(),
      outcome: "success",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("paymentSimulationSchema", () => {
  it("rejects a malformed order id and an unknown outcome", () => {
    expect(
      paymentSimulationSchema.safeParse({ orderId: "nope", outcome: "success" })
        .success,
    ).toBe(false);
    expect(
      paymentSimulationSchema.safeParse({
        orderId: "ORD-ABC-123456",
        outcome: "refund",
      }).success,
    ).toBe(false);
  });
});

describe("applyPaymentOutcome", () => {
  it("settles + enrolls atomically on success", async () => {
    txFindFirst.mockResolvedValue(pendingTxn);

    const result = await applyPaymentOutcome("user_1", "ORD-1", "success");

    expect(result).toMatchObject({
      ok: true,
      status: TransactionStatus.SUCCESS,
      courseId: "course_1",
    });
    // One DB transaction wrapping BOTH the status update and the enrollment.
    expect(dollarTx).toHaveBeenCalledTimes(1);
    expect(txUpdate.mock.calls[0][0].data.status).toBe(TransactionStatus.SUCCESS);
    expect(txUpdate.mock.calls[0][0].data.paidAt).toBeInstanceOf(Date);
    expect(enrUpsert.mock.calls[0][0].create).toEqual({
      userId: "user_1",
      courseId: "course_1",
    });
  });

  it("cancels without enrolling", async () => {
    txFindFirst.mockResolvedValue(pendingTxn);

    const result = await applyPaymentOutcome("user_1", "ORD-1", "cancel");

    expect(result).toMatchObject({ ok: true, status: TransactionStatus.CANCELLED });
    expect(txUpdate.mock.calls[0][0].data.status).toBe(
      TransactionStatus.CANCELLED,
    );
    expect(dollarTx).not.toHaveBeenCalled();
    expect(enrUpsert).not.toHaveBeenCalled();
  });

  it("is idempotent once SUCCESS (second settle is a no-op)", async () => {
    txFindFirst.mockResolvedValue({
      ...pendingTxn,
      status: TransactionStatus.SUCCESS,
    });

    const result = await applyPaymentOutcome("user_1", "ORD-1", "success");

    expect(result).toMatchObject({ ok: true, status: TransactionStatus.SUCCESS });
    expect(dollarTx).not.toHaveBeenCalled();
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it("refuses to reopen a transaction that is no longer PENDING", async () => {
    txFindFirst.mockResolvedValue({
      ...pendingTxn,
      status: TransactionStatus.CANCELLED,
    });

    const result = await applyPaymentOutcome("user_1", "ORD-1", "success");

    expect(result.ok).toBe(false);
    expect(dollarTx).not.toHaveBeenCalled();
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it("is scoped to the owner — another user's order is not found", async () => {
    txFindFirst.mockResolvedValue(null);

    const result = await applyPaymentOutcome("intruder", "ORD-1", "success");

    expect(result.ok).toBe(false);
    expect(txFindFirst.mock.calls[0][0].where).toEqual({
      orderId: "ORD-1",
      userId: "intruder",
    });
    expect(dollarTx).not.toHaveBeenCalled();
    expect(txUpdate).not.toHaveBeenCalled();
  });
});
