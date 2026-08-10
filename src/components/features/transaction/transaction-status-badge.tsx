import type { TransactionStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<
  TransactionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  SUCCESS: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
  REFUNDED: "outline",
};

export function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  return (
    <Badge variant={VARIANTS[status]} data-testid="transaction-status-badge">
      {status}
    </Badge>
  );
}
