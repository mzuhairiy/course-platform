import type { TransactionStatus } from "@prisma/client";

export const QUERY_KEYS = {
  status: "status",
  q: "q",
  page: "page",
} as const;

export const PER_PAGE = 10;

const TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
];

export type AdminTransactionListFilters = {
  status?: TransactionStatus;
  q: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseAdminTransactionFilters(
  searchParams: SearchParams,
): AdminTransactionListFilters {
  const statusRaw = first(searchParams[QUERY_KEYS.status]);
  const status = TRANSACTION_STATUSES.includes(statusRaw as TransactionStatus)
    ? (statusRaw as TransactionStatus)
    : undefined;

  const q = first(searchParams[QUERY_KEYS.q]).trim();

  const pageRaw = Number(first(searchParams[QUERY_KEYS.page]));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { status, q, page };
}

/** Serializes filters (minus page) so pagination links can preserve them. */
export function buildBaseQuery(filters: AdminTransactionListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set(QUERY_KEYS.status, filters.status);
  if (filters.q) params.set(QUERY_KEYS.q, filters.q);
  return params.toString();
}
