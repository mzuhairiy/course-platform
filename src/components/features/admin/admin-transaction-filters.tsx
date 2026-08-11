import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TRANSACTION_STATUS_VALUES } from "@/config/transaction-status";
import {
  hasActiveFilters,
  QUERY_KEYS,
  type AdminTransactionListFilters,
} from "@/lib/admin-transaction-filters";

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-2 text-sm";

const FIELD_CLASS = "flex flex-col gap-1 text-xs text-muted-foreground";

/**
 * Plain GET form — tiap filter jadi query string, jadi state-nya deep-linkable
 * dan bisa di-assert langsung dari URL (kontrak testability).
 */
export function AdminTransactionFilters({
  filters,
  basePath,
}: {
  filters: AdminTransactionListFilters;
  basePath: string;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      data-testid="admin-transaction-filters"
    >
      <label className={FIELD_CLASS}>
        Status
        <select
          name={QUERY_KEYS.status}
          defaultValue={filters.status ?? ""}
          className={SELECT_CLASS}
          data-testid="filter-status"
        >
          <option value="">Semua</option>
          {TRANSACTION_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className={FIELD_CLASS}>
        Cari
        <Input
          name={QUERY_KEYS.q}
          placeholder="Order ID, email, atau course"
          defaultValue={filters.q}
          className="h-9 w-64"
          data-testid="filter-search"
        />
      </label>

      <label className={FIELD_CLASS}>
        Dari tanggal
        <Input
          type="date"
          name={QUERY_KEYS.from}
          defaultValue={filters.from}
          className="h-9 w-40"
          data-testid="filter-from"
        />
      </label>

      <label className={FIELD_CLASS}>
        Sampai tanggal
        <Input
          type="date"
          name={QUERY_KEYS.to}
          defaultValue={filters.to}
          className="h-9 w-40"
          data-testid="filter-to"
        />
      </label>

      <Button type="submit" size="sm" data-testid="apply-filters">
        Filter
      </Button>

      {hasActiveFilters(filters) ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={basePath} data-testid="reset-filters">
            Reset
          </Link>
        </Button>
      ) : null}
    </form>
  );
}
