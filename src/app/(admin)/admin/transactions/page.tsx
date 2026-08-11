import type { Metadata } from "next";
import Link from "next/link";

import { AdminTransactionFilters } from "@/components/features/admin/admin-transaction-filters";
import { AdminTransactionSummary } from "@/components/features/admin/admin-transaction-summary";
import { TransactionStatusBadge } from "@/components/features/transaction/transaction-status-badge";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { paymentMethodLabel } from "@/config/payment";
import {
  buildBaseQuery,
  parseAdminTransactionFilters,
  PER_PAGE,
  toDateRange,
} from "@/lib/admin-transaction-filters";
import { formatDate, formatPrice } from "@/lib/format";
import {
  getAdminTransactions,
  getAdminTransactionSummary,
} from "@/server/services/admin-transaction";

export const metadata: Metadata = {
  title: "Transactions · Admin",
};

const BASE_PATH = "/admin/transactions";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AdminTransactionsPage({
  searchParams,
}: PageProps) {
  const filters = parseAdminTransactionFilters(searchParams);
  const range = toDateRange(filters);
  const serviceFilters = { status: filters.status, q: filters.q, ...range };

  const [{ rows, total }, summary] = await Promise.all([
    getAdminTransactions(serviceFilters, filters.page, PER_PAGE),
    getAdminTransactionSummary({ q: filters.q, ...range }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6" data-testid="admin-transactions">
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          Transactions
        </Heading>
        <Text variant="muted">
          {total} transaksi cocok dengan filter ini.
        </Text>
      </header>

      <AdminTransactionSummary summary={summary} />

      <AdminTransactionFilters filters={filters} basePath={BASE_PATH} />

      {rows.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-transaction-list">
          {rows.map((tx) => (
            <li key={tx.id}>
              <Card data-testid="admin-transaction-item">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`${BASE_PATH}/${tx.orderId}`}
                        className="font-semibold leading-tight hover:underline"
                        data-testid="admin-transaction-link"
                      >
                        {tx.orderId}
                      </Link>
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
                      {paymentMethodLabel(tx.paymentMethod)}
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
        basePath={BASE_PATH}
      />
    </div>
  );
}
