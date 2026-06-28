"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createCheckoutAction } from "@/server/actions/checkout";

const SNAP_SCRIPT_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";

// Minimal shape of the global Snap.js object (loaded from Midtrans CDN).
type SnapCallbacks = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};
type SnapGlobal = { pay: (token: string, cb?: SnapCallbacks) => void };

function loadSnap(clientKey: string): Promise<SnapGlobal | null> {
  return new Promise((resolve) => {
    const existing = (window as unknown as { snap?: SnapGlobal }).snap;
    if (existing) return resolve(existing);
    const script = document.createElement("script");
    script.src = SNAP_SCRIPT_SANDBOX;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () =>
      resolve((window as unknown as { snap?: SnapGlobal }).snap ?? null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

export function CheckoutButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";

  function payNow() {
    setError(null);
    setNotConfigured(false);
    startTransition(async () => {
      const result = await createCheckoutAction(courseId);
      if (result.status === "error") {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          return;
        }
        setError(result.message);
        return;
      }

      // Skeleton mode: no Midtrans credentials → can't open the real popup.
      if (!result.configured || !result.token || !clientKey) {
        setNotConfigured(true);
        return;
      }

      const snap = await loadSnap(clientKey);
      if (!snap) {
        setError("Gagal memuat Midtrans Snap.");
        return;
      }
      snap.pay(result.token, {
        onSuccess: () =>
          router.push(`/checkout/status?order_id=${result.orderId}`),
        onPending: () =>
          router.push(`/checkout/status?order_id=${result.orderId}`),
        onError: () => setError("Pembayaran gagal. Coba lagi."),
        // onClose: tetap di halaman — transaksi masih PENDING, bisa dilanjut.
      });
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        className="w-full"
        data-testid="pay-now-button"
        disabled={isPending}
        onClick={payNow}
      >
        {isPending ? "Memproses…" : "Pay Now"}
      </Button>

      {error ? (
        <p
          role="alert"
          data-testid="checkout-error"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {notConfigured ? (
        <p
          data-testid="payment-not-configured"
          className="rounded-md bg-surface-muted px-3 py-2 text-sm text-muted-foreground"
        >
          Pembayaran (Midtrans) belum dikonfigurasi di environment ini — alur
          checkout sudah siap, tinggal pasang <code>MIDTRANS_SERVER_KEY</code> +
          client key. Transaksi PENDING sudah tercatat.
        </p>
      ) : null}
    </div>
  );
}
