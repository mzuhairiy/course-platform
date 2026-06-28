import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatusPoller } from "@/components/features/checkout/status-poller";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getOwnedTransaction } from "@/server/services/transaction";

export const metadata: Metadata = {
  title: "Status Pembayaran",
};

type PageProps = { searchParams: { order_id?: string } };

export default async function CheckoutStatusPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/purchase-history");

  const orderId = searchParams.order_id;
  if (!orderId) notFound();

  // Status comes from the DB (updated by the webhook) — NEVER from a query
  // param, which the user could forge. Scoped to the owner so it can't leak.
  const txn = await getOwnedTransaction(user.id, orderId);
  if (!txn) notFound();

  const isSuccess = txn.status === "SUCCESS";
  const isPending = txn.status === "PENDING";

  return (
    <Section spacing="compact">
      <Container size="reading" data-testid="checkout-status">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            {isSuccess ? (
              <div className="space-y-3" data-testid="status-success">
                <Heading as="h1" level="h2">
                  Pembayaran berhasil 🎉
                </Heading>
                <Text variant="muted">
                  Kamu sekarang terdaftar di {txn.course.title}.
                </Text>
                <Button asChild data-testid="start-learning-button">
                  <Link href={`/learn/${txn.course.id}`}>Mulai Belajar</Link>
                </Button>
              </div>
            ) : isPending ? (
              <div className="space-y-3" data-testid="status-pending">
                <Heading as="h1" level="h2">
                  Menunggu konfirmasi pembayaran…
                </Heading>
                <Text variant="muted">
                  Kami sedang memverifikasi pembayaranmu. Halaman ini akan
                  diperbarui otomatis.
                </Text>
                <StatusPoller />
              </div>
            ) : (
              <div className="space-y-3" data-testid="status-failed">
                <Heading as="h1" level="h2">
                  Pembayaran {txn.status.toLowerCase()}
                </Heading>
                <Text variant="muted">
                  Transaksi tidak selesai ({formatPrice(txn.amount)}).
                </Text>
                <Button asChild data-testid="retry-payment-button">
                  <Link href={`/checkout/${txn.course.id}`}>Coba Lagi</Link>
                </Button>
              </div>
            )}

            <Text variant="muted" as="p" className="text-xs">
              Order ID: {txn.orderId}
            </Text>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
