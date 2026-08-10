import type { TransactionStatus } from "@prisma/client";
import type { Metadata } from "next";

import { TransactionStatusBadge } from "@/components/features/transaction/transaction-status-badge";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heading, Text } from "@/components/ui/typography";
import {
  buildBaseQuery,
  parseAdminTransactionFilters,
  PER_PAGE,
} from "@/lib/admin-transaction-filters";
import { formatDate, formatPrice } from "@/lib/format";
import { getAdminTransactions } from "@/server/services/admin";

export const metadata: Metadata = {
  title: "Transactions · Admin",
};

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-2 text-sm";

const STATUS_OPTIONS: TransactionStatus[] = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
];

type PageProps = {
  searchParams: { status?: string; q?: string; page?: string };
};

export default async function AdminTransactionsPage({
  searchParams,
}: PageProps) {
  const filters = parseAdminTransactionFilters(searchParams);

  const { rows, total } = await getAdminTransactions(
    { status: filters.status, q: filters.q },
    filters.page,
    PER_PAGE,
  );
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6" data-testid="admin-transactions">
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          Transactions
        </Heading>
        <Text variant="muted">{total} transaksi tercatat.</Text>
      </header>

      <form
        className="flex flex-wrap items-end gap-3"
        data-testid="admin-transaction-filters"
      >
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Status
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className={SELECT_CLASS}
            data-testid="filter-status"
          >
            <option value="">Semua</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Cari
          <Input
            name="q"
            placeholder="Order ID, email, atau course"
            defaultValue={searchParams.q ?? ""}
            className="h-9 w-64"
            data-testid="filter-search"
          />
        </label>
        <Button type="submit" size="sm" data-testid="apply-filters">
          Filter
        </Button>
      </form>

      {rows.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-transaction-list">
          {rows.map((tx) => (
            <li key={tx.id}>
              <Card data-testid="admin-transaction-item">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-tight">
                        {tx.orderId}
                      </p>
                      <TransactionStatusBadge status={tx.status} />
                    </div>
                    <Text variant="muted" as="span" className="block text-sm">
                      {tx.user.name ?? "—"} ({tx.user.email}) ·{" "}
                      {tx.course.title} · {formatDate(tx.paidAt ?? tx.createdAt)}
                    </Text>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{formatPrice(tx.amount)}</p>
                    <Text variant="muted" as="span" className="block text-xs">
                      {tx.paymentMethod ?? "—"}
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="rounded-lg border border-dashed border-border p-12 text-center"
          data-testid="admin-transactions-empty"
        >
          <Text variant="muted">Tidak ada transaksi untuk filter ini.</Text>
        </div>
      )}

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        baseQuery={buildBaseQuery(filters)}
        basePath="/admin/transactions"
      />
    </div>
  );
}
