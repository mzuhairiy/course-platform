"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { simulatePaymentAction } from "@/server/actions/checkout";
import type { PaymentOutcome } from "@/schemas/checkout";

/**
 * Stand-in for a payment gateway's hosted page. Drives a PENDING transaction to
 * SUCCESS (settle + enroll) or CANCELLED — deterministic, no timers, no random.
 */
export function PaymentSimulator({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(outcome: PaymentOutcome) {
    setError(null);
    startTransition(async () => {
      const result = await simulatePaymentAction({ orderId, outcome });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="space-y-3 rounded-md border border-dashed border-border p-4 text-left"
      data-testid="payment-simulator"
    >
      <p className="text-sm font-medium">Simulasi Pembayaran</p>
      <p className="text-sm text-muted-foreground">
        Tidak ada payment gateway di platform ini. Pilih hasil pembayaran untuk
        menyelesaikan transaksi.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          data-testid="simulate-success-button"
          disabled={isPending}
          onClick={() => run("success")}
        >
          {isPending ? "Memproses…" : "Bayar Berhasil"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          data-testid="simulate-cancel-button"
          disabled={isPending}
          onClick={() => run("cancel")}
        >
          Batalkan Pembayaran
        </Button>
      </div>

      {isPending ? (
        <span data-testid="loading" className="sr-only" role="status">
          Memproses pembayaran
        </span>
      ) : null}

      {error ? (
        <p
          role="alert"
          data-testid="simulator-error"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
