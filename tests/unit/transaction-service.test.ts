import { createHash } from "node:crypto";

import { TransactionStatus } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { txFindUnique, txUpdate, enrUpsert, dollarTx } = vi.hoisted(() => ({
  txFindUnique: vi.fn(),
  txUpdate: vi.fn(),
  enrUpsert: vi.fn(),
  dollarTx: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: { findUnique: txFindUnique, update: txUpdate },
    enrollment: { upsert: enrUpsert },
    $transaction: dollarTx,
  },
}));

import { verifySignature } from "@/lib/midtrans";
import {
  generateOrderId,
  processPaymentNotification,
  type MidtransNotification,
} from "@/server/services/transaction";

const SERVER_KEY = "SB-Mid-server-TESTKEY";

function sign(orderId: string, statusCode: string, grossAmount: string): string {
  return createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`)
    .digest("hex");
}

function notification(over: Partial<MidtransNotification> = {}): MidtransNotification {
  const base = {
    order_id: "ORD-1",
    status_code: "200",
    gross_amount: "150000.00",
    transaction_status: "settlement",
    payment_type: "bank_transfer",
  };
  const merged = { ...base, ...over };
  return {
    ...merged,
    signature_key:
      over.signature_key ??
      sign(merged.order_id, merged.status_code, merged.gross_amount),
  };
}

beforeAll(() => {
  process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
});

beforeEach(() => {
  vi.clearAllMocks();
  dollarTx.mockResolvedValue([]);
  txUpdate.mockResolvedValue({});
  enrUpsert.mockResolvedValue({});
});

const pendingTxn = {
  orderId: "ORD-1",
  userId: "user_1",
  courseId: "course_1",
  amount: 150000,
  status: TransactionStatus.PENDING,
};

describe("verifySignature", () => {
  it("accepts a correct signature", () => {
    expect(verifySignature("ORD-1", "200", "150000.00", sign("ORD-1", "200", "150000.00"))).toBe(true);
  });

  it("rejects a tampered signature / amount", () => {
    const good = sign("ORD-1", "200", "150000.00");
    expect(verifySignature("ORD-1", "200", "999999.00", good)).toBe(false);
    expect(verifySignature("ORD-1", "200", "150000.00", "deadbeef")).toBe(false);
  });
});

describe("generateOrderId", () => {
  it("matches the ORD-x-y format and is unique", () => {
    const a = generateOrderId();
    const b = generateOrderId();
    expect(a).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]{6}$/);
    expect(a).not.toBe(b);
  });
});

describe("processPaymentNotification", () => {
  it("settles + enrolls on settlement", async () => {
    txFindUnique.mockResolvedValue(pendingTxn);

    const result = await processPaymentNotification(notification());

    expect(result).toMatchObject({ ok: true, status: 200 });
    expect(dollarTx).toHaveBeenCalledTimes(1);
    expect(txUpdate.mock.calls[0][0].data.status).toBe(TransactionStatus.SUCCESS);
    expect(enrUpsert.mock.calls[0][0].create).toEqual({
      userId: "user_1",
      courseId: "course_1",
    });
  });

  it("is idempotent once SUCCESS (later notice is a no-op)", async () => {
    txFindUnique.mockResolvedValue({
      ...pendingTxn,
      status: TransactionStatus.SUCCESS,
    });

    const result = await processPaymentNotification(
      notification({ transaction_status: "expire", status_code: "407" }),
    );

    expect(result).toMatchObject({ ok: true, status: 200 });
    expect(dollarTx).not.toHaveBeenCalled();
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature (403)", async () => {
    const result = await processPaymentNotification(
      notification({ signature_key: "forged" }),
    );

    expect(result.status).toBe(403);
    expect(txFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a mismatched amount (400, no status change)", async () => {
    txFindUnique.mockResolvedValue(pendingTxn);

    const result = await processPaymentNotification(
      notification({ gross_amount: "200000.00" }),
    );

    expect(result.status).toBe(400);
    expect(dollarTx).not.toHaveBeenCalled();
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the order is unknown", async () => {
    txFindUnique.mockResolvedValue(null);

    const result = await processPaymentNotification(notification());

    expect(result.status).toBe(404);
  });
});
