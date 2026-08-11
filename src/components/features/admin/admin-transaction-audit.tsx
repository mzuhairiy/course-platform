import type { Prisma } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import { formatDateTime } from "@/lib/format";
import { readAuditTrail } from "@/server/services/admin-transaction-status";

/**
 * Jejak simulasi pembayaran + aksi admin. Keduanya hidup di
 * Transaction.paymentPayload (tidak ada tabel audit terpisah), jadi payload
 * mentahnya sekalian ditampilkan supaya bisa diperiksa saat debugging.
 */
export function AdminTransactionAudit({
  payload,
}: {
  payload: Prisma.JsonValue | null;
}) {
  const entries = readAuditTrail(payload);

  return (
    <Card data-testid="admin-transaction-audit">
      <CardHeader>
        <CardTitle className="text-lg">Jejak audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length > 0 ? (
          <ol className="space-y-3" data-testid="admin-transaction-audit-list">
            {entries.map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                className="border-l-2 border-border pl-3"
                data-testid="admin-transaction-audit-item"
              >
                <p className="text-sm font-medium">
                  {entry.from} → {entry.to}
                </p>
                <Text variant="muted" as="span" className="block text-xs">
                  {formatDateTime(entry.at)} · admin {entry.actorId}
                </Text>
                {entry.note ? (
                  <Text as="p" className="mt-1 text-sm">
                    {entry.note}
                  </Text>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <Text variant="muted" data-testid="admin-transaction-audit-empty">
            Belum ada aksi admin pada transaksi ini.
          </Text>
        )}

        <details className="text-sm">
          <summary
            className="cursor-pointer text-muted-foreground"
            data-testid="admin-transaction-payload-toggle"
          >
            Payload mentah
          </summary>
          <pre
            className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs"
            data-testid="admin-transaction-payload"
          >
            {JSON.stringify(payload ?? {}, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
