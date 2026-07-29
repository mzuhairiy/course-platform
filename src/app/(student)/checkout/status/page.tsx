import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PaymentSimulator } from "@/components/features/checkout/payment-simulator";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { paymentMethodLabel } from "@/config/payment";
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

  // Status comes from the DB — NEVER from a query param, which the user could
  // forge. Scoped to the owner so someone else's order can't leak.
  const txn = await getOwnedTransaction(user.id, orderId);
  if (!txn) notFound();

  const isSuccess = txn.status === "SUCCESS";
  const isPending = txn.status === "PENDING";
  const firstLectureId = txn.course.sections[0]?.lectures[0]?.id ?? null;
  const learnHref = firstLectureId
    ? `/learn/${txn.course.id}/${firstLectureId}`
    : `/courses/${txn.course.slug}`;

  return (
    <Section spacing="compact">
      <Container size="reading" data-testid="checkout-status">
        <Card>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-4 text-center">
              {isSuccess ? (
                <div className="space-y-3" data-testid="status-success">
                  <Heading as="h1" level="h2">
                    Pembayaran berhasil 🎉
                  </Heading>
                  <Text variant="muted">
                    Kamu sekarang terdaftar di {txn.course.title}.
                  </Text>
                  <Button asChild data-testid="start-learning-button">
                    <Link href={learnHref}>Mulai Belajar</Link>
                  </Button>
                </div>
              ) : isPending ? (
                <div className="space-y-4" data-testid="status-pending">
                  <Heading as="h1" level="h2">
                    Menunggu pembayaran
                  </Heading>
                  <Text variant="muted">
                    Order kamu untuk {txn.course.title} sudah tercatat dan
                    menunggu pembayaran.
                  </Text>
                  <PaymentSimulator orderId={txn.orderId} />
                </div>
              ) : (
                <div className="space-y-3" data-testid="status-failed">
                  <Heading as="h1" level="h2">
                    Pembayaran {txn.status.toLowerCase()}
                  </Heading>
                  <Text variant="muted">Transaksi ini tidak selesai.</Text>
                  <Button asChild data-testid="retry-payment-button">
                    <Link href={`/checkout/${txn.course.id}`}>Coba Lagi</Link>
                  </Button>
                </div>
              )}
            </div>

            <dl
              className="space-y-2 border-t border-border pt-4 text-sm"
              data-testid="transaction-detail"
            >
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Order ID</dt>
                <dd data-testid="detail-order-id">{txn.orderId}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Metode</dt>
                <dd data-testid="detail-payment-method">
                  {paymentMethodLabel(txn.paymentMethod)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd data-testid="detail-status">{txn.status}</dd>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <dt>Total</dt>
                <dd data-testid="detail-amount">{formatPrice(txn.amount)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
