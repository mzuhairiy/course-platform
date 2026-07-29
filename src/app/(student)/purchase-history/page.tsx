import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { formatDate, formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { getUserTransactions } from "@/server/services/transaction";

export const metadata: Metadata = {
  title: "Purchase History",
};

const STATUS_VARIANT = {
  SUCCESS: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
  REFUNDED: "outline",
} as const;

export default async function PurchaseHistoryPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect("/sign-in?callbackUrl=/purchase-history");
  }

  const transactions = await getUserTransactions(sessionUser.id);

  return (
    <Section spacing="compact">
      <Container size="reading" className="space-y-8">
        <header className="space-y-2">
          <Heading as="h1" level="h1">
            Purchase History
          </Heading>
          <Text variant="lead">Riwayat pembelian course kamu.</Text>
        </header>

        {transactions.length > 0 ? (
          <div className="space-y-3" data-testid="purchase-history">
            {transactions.map((tx) => (
              <Card key={tx.id} data-testid="transaction-row">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/courses/${tx.course.slug}`}
                      className="font-medium hover:underline"
                    >
                      {tx.course.title}
                    </Link>
                    <Text variant="muted" as="p" className="text-xs">
                      {formatDate(tx.paidAt ?? tx.createdAt)} · {tx.orderId}
                    </Text>
                    {tx.status === "PENDING" ? (
                      <Link
                        href={`/checkout/status?order_id=${tx.orderId}`}
                        className="text-xs font-medium text-primary hover:underline"
                        data-testid="continue-payment-link"
                      >
                        Lanjutkan pembayaran
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold">
                      {formatPrice(tx.amount)}
                    </span>
                    <Badge variant={STATUS_VARIANT[tx.status]}>
                      {tx.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className="rounded-lg border border-dashed border-border p-12 text-center"
            data-testid="purchase-history-empty"
          >
            <Text variant="muted">
              Belum ada transaksi. Pembelian course kamu akan muncul di sini.
            </Text>
          </div>
        )}
      </Container>
    </Section>
  );
}
