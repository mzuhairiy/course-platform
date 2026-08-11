import { TransactionStatus, UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { txFindUnique, txUpdate, txCount, enrUpsert, enrDeleteMany, dollarTx } =
  vi.hoisted(() => ({
    txFindUnique: vi.fn(),
    txUpdate: vi.fn(),
    txCount: vi.fn(),
    enrUpsert: vi.fn(),
    enrDeleteMany: vi.fn(),
    dollarTx: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: {
      findUnique: txFindUnique,
      update: txUpdate,
      count: txCount,
    },
    enrollment: { upsert: enrUpsert, deleteMany: enrDeleteMany },
    $transaction: dollarTx,
  },
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

import {
  ADMIN_TRANSACTION_TRANSITIONS,
  allowedAdminTransitions,
  canAdminTransition,
} from "@/config/transaction-status";
import { ForbiddenError } from "@/lib/rbac";
import {
  InvalidTransactionTransitionError,
  readAuditTrail,
  setTransactionStatus,
  TransactionNotFoundError,
} from "@/server/services/admin-transaction-status";

const ADMIN = { id: "admin_1", role: UserRole.ADMIN };
const NOT_ADMIN = { id: "user_1", role: UserRole.INSTRUCTOR };

const pendingTxn = {
  orderId: "ORD-1",
  userId: "user_1",
  courseId: "course_1",
  amount: 150_000,
  paymentMethod: "bank_transfer",
  status: TransactionStatus.PENDING,
  paidAt: null,
  paymentPayload: { simulated: true, outcome: "success" },
};

const paidTxn = {
  ...pendingTxn,
  status: TransactionStatus.SUCCESS,
  paidAt: new Date("2026-01-01T10:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  dollarTx.mockResolvedValue([]);
  txUpdate.mockResolvedValue({});
  txCount.mockResolvedValue(0);
  enrUpsert.mockResolvedValue({});
  enrDeleteMany.mockResolvedValue({ count: 1 });
});

describe("transition matrix", () => {
  it("only lets PENDING and SUCCESS move — the rest are final", () => {
    expect(allowedAdminTransitions(TransactionStatus.PENDING)).toEqual([
      "SUCCESS",
      "FAILED",
      "EXPIRED",
      "CANCELLED",
    ]);
    expect(allowedAdminTransitions(TransactionStatus.SUCCESS)).toEqual([
      "REFUNDED",
    ]);

    for (const status of [
      TransactionStatus.FAILED,
      TransactionStatus.EXPIRED,
      TransactionStatus.CANCELLED,
      TransactionStatus.REFUNDED,
    ]) {
      expect(allowedAdminTransitions(status)).toEqual([]);
    }
  });

  it("never allows reopening a settled transaction as PENDING", () => {
    for (const from of Object.keys(
      ADMIN_TRANSACTION_TRANSITIONS,
    ) as TransactionStatus[]) {
      expect(canAdminTransition(from, TransactionStatus.PENDING)).toBe(false);
    }
  });

  it("rejects self-transitions", () => {
    expect(
      canAdminTransition(TransactionStatus.SUCCESS, TransactionStatus.SUCCESS),
    ).toBe(false);
  });
});

describe("setTransactionStatus — guards", () => {
  it("refuses a non-admin actor before touching the DB", async () => {
    await expect(
      setTransactionStatus("ORD-1", TransactionStatus.SUCCESS, NOT_ADMIN),
    ).rejects.toThrow(ForbiddenError);

    expect(txFindUnique).not.toHaveBeenCalled();
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it("throws when the order does not exist", async () => {
    txFindUnique.mockResolvedValue(null);

    await expect(
      setTransactionStatus("ORD-404", TransactionStatus.SUCCESS, ADMIN),
    ).rejects.toThrow(TransactionNotFoundError);
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it("rejects an illegal transition (CANCELLED cannot become SUCCESS)", async () => {
    txFindUnique.mockResolvedValue({
      ...pendingTxn,
      status: TransactionStatus.CANCELLED,
    });

    await expect(
      setTransactionStatus("ORD-1", TransactionStatus.SUCCESS, ADMIN),
    ).rejects.toThrow(InvalidTransactionTransitionError);
    expect(txUpdate).not.toHaveBeenCalled();
    expect(dollarTx).not.toHaveBeenCalled();
  });
});

describe("setTransactionStatus — PENDING → SUCCESS", () => {
  it("settles and enrolls in one DB transaction", async () => {
    txFindUnique.mockResolvedValue(pendingTxn);

    const result = await setTransactionStatus(
      "ORD-1",
      TransactionStatus.SUCCESS,
      ADMIN,
    );

    expect(result).toMatchObject({
      status: TransactionStatus.SUCCESS,
      from: TransactionStatus.PENDING,
      enrollmentGranted: true,
      enrollmentRevoked: false,
    });
    expect(dollarTx).toHaveBeenCalledTimes(1);
    expect(txUpdate.mock.calls[0][0].data.status).toBe(
      TransactionStatus.SUCCESS,
    );
    expect(txUpdate.mock.calls[0][0].data.paidAt).toBeInstanceOf(Date);
    expect(enrUpsert.mock.calls[0][0].create).toEqual({
      userId: "user_1",
      courseId: "course_1",
    });
  });
});

describe("setTransactionStatus — SUCCESS → REFUNDED", () => {
  it("revokes course access when this was the only paid order", async () => {
    txFindUnique.mockResolvedValue(paidTxn);
    txCount.mockResolvedValue(0);

    const result = await setTransactionStatus(
      "ORD-1",
      TransactionStatus.REFUNDED,
      ADMIN,
    );

    expect(result).toMatchObject({
      status: TransactionStatus.REFUNDED,
      enrollmentRevoked: true,
    });
    expect(enrDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1", courseId: "course_1" },
    });
    // Status change + revoke are atomic.
    expect(dollarTx).toHaveBeenCalledTimes(1);
    expect(dollarTx.mock.calls[0][0]).toHaveLength(2);
  });

  it("keeps access when another SUCCESS order covers the same course", async () => {
    txFindUnique.mockResolvedValue(paidTxn);
    txCount.mockResolvedValue(1);

    const result = await setTransactionStatus(
      "ORD-1",
      TransactionStatus.REFUNDED,
      ADMIN,
    );

    expect(result.enrollmentRevoked).toBe(false);
    expect(enrDeleteMany).not.toHaveBeenCalled();
    expect(dollarTx.mock.calls[0][0]).toHaveLength(1);
    // The other-order lookup must exclude the order being refunded.
    expect(txCount.mock.calls[0][0].where).toMatchObject({
      status: TransactionStatus.SUCCESS,
      orderId: { not: "ORD-1" },
    });
  });
});

describe("setTransactionStatus — terminal statuses", () => {
  it("marks FAILED without any enrollment write", async () => {
    txFindUnique.mockResolvedValue(pendingTxn);

    const result = await setTransactionStatus(
      "ORD-1",
      TransactionStatus.FAILED,
      ADMIN,
    );

    expect(result).toMatchObject({
      status: TransactionStatus.FAILED,
      enrollmentGranted: false,
      enrollmentRevoked: false,
    });
    expect(dollarTx).not.toHaveBeenCalled();
    expect(enrUpsert).not.toHaveBeenCalled();
    expect(enrDeleteMany).not.toHaveBeenCalled();
    expect(txUpdate.mock.calls[0][0].data.paidAt).toBeUndefined();
  });
});

describe("audit trail", () => {
  it("appends an entry without dropping the simulation payload", async () => {
    txFindUnique.mockResolvedValue(pendingTxn);

    await setTransactionStatus(
      "ORD-1",
      TransactionStatus.EXPIRED,
      ADMIN,
      "  tidak dibayar 24 jam  ",
    );

    const payload = txUpdate.mock.calls[0][0].data.paymentPayload;
    expect(payload.simulated).toBe(true);
    expect(payload.outcome).toBe("success");
    expect(payload.adminActions).toHaveLength(1);
    expect(payload.adminActions[0]).toMatchObject({
      from: TransactionStatus.PENDING,
      to: TransactionStatus.EXPIRED,
      actorId: "admin_1",
      note: "tidak dibayar 24 jam",
    });
  });

  it("stores a null note when none is given", async () => {
    txFindUnique.mockResolvedValue(pendingTxn);

    await setTransactionStatus("ORD-1", TransactionStatus.FAILED, ADMIN, "   ");

    expect(
      txUpdate.mock.calls[0][0].data.paymentPayload.adminActions[0].note,
    ).toBeNull();
  });

  it("appends to an existing trail instead of replacing it", async () => {
    txFindUnique.mockResolvedValue({
      ...paidTxn,
      paymentPayload: {
        adminActions: [
          {
            at: "2026-01-01T00:00:00.000Z",
            from: "PENDING",
            to: "SUCCESS",
            actorId: "admin_1",
            note: null,
          },
        ],
      },
    });

    await setTransactionStatus("ORD-1", TransactionStatus.REFUNDED, ADMIN);

    expect(txUpdate.mock.calls[0][0].data.paymentPayload.adminActions).toHaveLength(
      2,
    );
  });

  it("readAuditTrail tolerates missing, null, and malformed payloads", () => {
    expect(readAuditTrail(null)).toEqual([]);
    expect(readAuditTrail({ simulated: true })).toEqual([]);
    expect(readAuditTrail("nope")).toEqual([]);
    expect(readAuditTrail([1, 2])).toEqual([]);
    expect(readAuditTrail({ adminActions: "nope" })).toEqual([]);
    // Non-object members are filtered out rather than crashing the page.
    expect(readAuditTrail({ adminActions: [null, "x", { to: "FAILED" }] })).toEqual(
      [{ to: "FAILED" }],
    );
  });
});
