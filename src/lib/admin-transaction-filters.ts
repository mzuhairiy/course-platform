import type { TransactionStatus } from "@prisma/client";

import { TRANSACTION_STATUS_VALUES } from "@/config/transaction-status";

export const QUERY_KEYS = {
  status: "status",
  q: "q",
  from: "from",
  to: "to",
  page: "page",
} as const;

export const PER_PAGE = 10;

/** `<input type="date">` value: YYYY-MM-DD. */
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type AdminTransactionListFilters = {
  status?: TransactionStatus;
  q: string;
  /** Raw query values, dipakai untuk defaultValue input tanggal. */
  from: string;
  to: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** YYYY-MM-DD yang valid, atau "" kalau formatnya salah / tanggalnya tidak ada. */
function parseDateInput(raw: string): string {
  if (!DATE_INPUT_PATTERN.test(raw)) return "";
  return Number.isNaN(new Date(`${raw}T00:00:00`).getTime()) ? "" : raw;
}

export function parseAdminTransactionFilters(
  searchParams: SearchParams,
): AdminTransactionListFilters {
  const statusRaw = first(searchParams[QUERY_KEYS.status]);
  const status = (
    TRANSACTION_STATUS_VALUES as readonly string[]
  ).includes(statusRaw)
    ? (statusRaw as TransactionStatus)
    : undefined;

  const q = first(searchParams[QUERY_KEYS.q]).trim();

  const from = parseDateInput(first(searchParams[QUERY_KEYS.from]).trim());
  const to = parseDateInput(first(searchParams[QUERY_KEYS.to]).trim());

  const pageRaw = Number(first(searchParams[QUERY_KEYS.page]));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { status, q, from, to, page };
}

/**
 * Rentang tanggal inklusif untuk query: `from` mulai awal hari, `to` sampai
 * akhir hari, supaya transaksi di hari `to` itu sendiri tetap ikut terhitung.
 * Rentang terbalik (`from` > `to`) dibiarkan — hasilnya kosong, dan filternya
 * tetap terbaca apa adanya di URL.
 */
export function toDateRange(filters: AdminTransactionListFilters): {
  from?: Date;
  to?: Date;
} {
  return {
    ...(filters.from ? { from: new Date(`${filters.from}T00:00:00.000`) } : {}),
    ...(filters.to ? { to: new Date(`${filters.to}T23:59:59.999`) } : {}),
  };
}

/** Serializes filters (minus page) so pagination links can preserve them. */
export function buildBaseQuery(filters: AdminTransactionListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set(QUERY_KEYS.status, filters.status);
  if (filters.q) params.set(QUERY_KEYS.q, filters.q);
  if (filters.from) params.set(QUERY_KEYS.from, filters.from);
  if (filters.to) params.set(QUERY_KEYS.to, filters.to);
  return params.toString();
}

/** True kalau ada filter aktif — dipakai untuk menampilkan tombol reset. */
export function hasActiveFilters(
  filters: AdminTransactionListFilters,
): boolean {
  return Boolean(filters.status || filters.q || filters.from || filters.to);
}
