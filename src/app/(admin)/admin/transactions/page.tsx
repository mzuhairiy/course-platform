import type { Metadata } from "next";

import { WorkspacePlaceholder } from "@/components/shared/workspace-placeholder";

export const metadata: Metadata = {
  title: "Transactions · Admin",
};

export default function AdminTransactionsPage() {
  return (
    <WorkspacePlaceholder
      title="Transactions"
      description="Riwayat transaksi platform (tersedia setelah Fase 2)."
      testid="admin-transactions"
    />
  );
}
