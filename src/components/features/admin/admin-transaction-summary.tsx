import { StatCard } from "@/components/features/analytics/stat-card";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/typography";
import { TRANSACTION_STATUS_VALUES } from "@/config/transaction-status";
import { formatPrice } from "@/lib/format";
import type { AdminTransactionSummary as Summary } from "@/server/services/admin-transaction";

/**
 * Ringkasan untuk rentang tanggal + pencarian yang aktif (filter status tidak
 * ikut — breakdown-nya justru menampilkan semua status).
 */
export function AdminTransactionSummary({ summary }: { summary: Summary }) {
  return (
    <section className="space-y-4" data-testid="admin-transaction-summary">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue (SUCCESS)"
          value={formatPrice(summary.revenue)}
          testid="summary-revenue"
        />
        <StatCard
          label="Transaksi"
          value={summary.total}
          testid="summary-total"
        />
        <StatCard
          label="Menunggu pembayaran"
          value={summary.countByStatus.PENDING}
          testid="summary-pending"
        />
        <StatCard
          label="Direfund"
          value={formatPrice(summary.amountByStatus.REFUNDED)}
          hint={`${summary.countByStatus.REFUNDED} transaksi`}
          testid="summary-refunded"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TRANSACTION_STATUS_VALUES.map((status) => (
          <Badge
            key={status}
            variant="outline"
            data-testid={`summary-count-${status.toLowerCase()}`}
          >
            {status}
            <Text as="span" className="ml-1.5 font-semibold">
              {summary.countByStatus[status]}
            </Text>
          </Badge>
        ))}
      </div>
    </section>
  );
}
