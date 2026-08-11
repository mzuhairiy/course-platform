import type { TransactionStatus } from "@prisma/client";

/**
 * Status transaksi, satu sumber kebenaran untuk filter dropdown, Zod enum, dan
 * badge. Urutannya = urutan tampil di UI.
 */
export const TRANSACTION_STATUS_VALUES = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly TransactionStatus[];

/**
 * Platform ini tidak pakai payment gateway (lihat src/config/payment.ts), jadi
 * tidak ada webhook yang bisa memindahkan transaksi ke FAILED / EXPIRED /
 * REFUNDED. Admin yang melakukannya manual dari halaman detail transaksi.
 *
 * Matriks ini satu-satunya sumber kebenaran transisi yang legal: service pakai
 * untuk guard (server-side), UI pakai untuk menentukan tombol yang dirender.
 * Status selain PENDING/SUCCESS bersifat final — tidak bisa dibuka lagi.
 */
export const ADMIN_TRANSACTION_TRANSITIONS: Record<
  TransactionStatus,
  readonly TransactionStatus[]
> = {
  PENDING: ["SUCCESS", "FAILED", "EXPIRED", "CANCELLED"],
  SUCCESS: ["REFUNDED"],
  FAILED: [],
  EXPIRED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export type AdminTransactionActionMeta = {
  /** Label tombol di halaman detail. */
  label: string;
  /** Penjelasan efek transisi, ditampilkan di dialog konfirmasi. */
  description: string;
  destructive: boolean;
};

export const ADMIN_TRANSACTION_ACTIONS: Record<
  TransactionStatus,
  AdminTransactionActionMeta
> = {
  SUCCESS: {
    label: "Tandai lunas",
    description:
      "Transaksi ditandai SUCCESS dan user langsung di-enroll ke course-nya.",
    destructive: false,
  },
  FAILED: {
    label: "Tandai gagal",
    description: "Transaksi ditandai FAILED. User tidak mendapat akses course.",
    destructive: true,
  },
  EXPIRED: {
    label: "Tandai kedaluwarsa",
    description:
      "Transaksi ditandai EXPIRED. User perlu checkout ulang untuk membeli.",
    destructive: true,
  },
  CANCELLED: {
    label: "Batalkan",
    description: "Transaksi ditandai CANCELLED. User tidak mendapat akses course.",
    destructive: true,
  },
  REFUNDED: {
    label: "Refund",
    description:
      "Transaksi ditandai REFUNDED dan akses course dicabut — kecuali user masih punya transaksi lunas lain untuk course yang sama.",
    destructive: true,
  },
  PENDING: {
    label: "Kembalikan ke pending",
    description: "Transaksi dibuka kembali sebagai PENDING.",
    destructive: false,
  },
};

/** Transisi yang boleh dilakukan admin dari `from`. */
export function allowedAdminTransitions(
  from: TransactionStatus,
): readonly TransactionStatus[] {
  return ADMIN_TRANSACTION_TRANSITIONS[from] ?? [];
}

/** Pure predicate — true kalau admin boleh memindahkan `from` ke `to`. */
export function canAdminTransition(
  from: TransactionStatus,
  to: TransactionStatus,
): boolean {
  return allowedAdminTransitions(from).includes(to);
}
