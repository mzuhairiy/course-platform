import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminTransactionActions } from "@/components/features/admin/admin-transaction-actions";
import { AdminTransactionAudit } from "@/components/features/admin/admin-transaction-audit";
import { TransactionStatusBadge } from "@/components/features/transaction/transaction-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { paymentMethodLabel } from "@/config/payment";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getAdminTransactionByOrderId } from "@/server/services/admin-transaction";

type PageProps = { params: { orderId: string } };

export function generateMetadata({ params }: PageProps): Metadata {
  return { title: `${params.orderId} · Transactions · Admin` };
}

function Field({
  label,
  children,
  testid,
}: {
  label: string;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium" data-testid={testid}>
        {children}
      </dd>
    </div>
  );
}

export default async function AdminTransactionDetailPage({
  params,
}: PageProps) {
  const txn = await getAdminTransactionByOrderId(params.orderId);
  if (!txn) {
    notFound();
  }

  return (
    <div className="space-y-6" data-testid="admin-transaction-detail">
      <div>
        <Link
          href="/admin/transactions"
          className="text-sm text-muted-foreground hover:underline"
          data-testid="back-to-transactions"
        >
          ← Semua transaksi
        </Link>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Heading as="h1" level="h1">
            {txn.orderId}
          </Heading>
          <TransactionStatusBadge status={txn.status} />
        </div>
        <Text variant="muted">
          {formatPrice(txn.amount)} · {paymentMethodLabel(txn.paymentMethod)}
        </Text>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Field label="Pembeli" testid="detail-user">
              {txn.user.name ?? "—"}
            </Field>
            <Field label="Email" testid="detail-email">
              {txn.user.email}
            </Field>
            <Field label="Role" testid="detail-role">
              {txn.user.role}
            </Field>
            <Field label="Course" testid="detail-course">
              <Link
                href={`/courses/${txn.course.slug}`}
                className="hover:underline"
              >
                {txn.course.title}
              </Link>
            </Field>
            <Field label="Harga course saat ini" testid="detail-course-price">
              {formatPrice(txn.course.price)}
            </Field>
            <Field label="Jumlah dibayar" testid="detail-amount">
              {formatPrice(txn.amount)}
            </Field>
            <Field label="Metode" testid="detail-method">
              {paymentMethodLabel(txn.paymentMethod)}
            </Field>
            <Field label="Dibuat" testid="detail-created">
              {formatDateTime(txn.createdAt)}
            </Field>
            <Field label="Dibayar" testid="detail-paid">
              {txn.paidAt ? formatDateTime(txn.paidAt) : "—"}
            </Field>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aksi admin</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTransactionActions
            orderId={txn.orderId}
            status={txn.status}
          />
        </CardContent>
      </Card>

      <AdminTransactionAudit payload={txn.paymentPayload} />
    </div>
  );
}
