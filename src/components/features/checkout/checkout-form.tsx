"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/config/payment";
import { createCheckoutAction } from "@/server/actions/checkout";

/**
 * Dummy checkout: pick a payment method, record a PENDING transaction, then go
 * to the status page where the payment itself is simulated.
 */
export function CheckoutForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHOD);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutAction({
        courseId,
        paymentMethod: method,
      });
      if (result.status === "error") {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          return;
        }
        setError(result.message);
        return;
      }
      router.push(`/checkout/status?order_id=${result.orderId}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4"
      data-testid="checkout-form"
      noValidate
    >
      <fieldset className="space-y-2" disabled={isPending}>
        <legend className="mb-2 text-sm font-medium">Metode Pembayaran</legend>
        {PAYMENT_METHODS.map((option) => (
          <label
            key={option.value}
            htmlFor={`payment-method-${option.value}`}
            data-testid={`payment-method-${option.value}`}
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
              method === option.value
                ? "border-primary bg-surface-muted"
                : "border-border"
            }`}
          >
            <input
              type="radio"
              id={`payment-method-${option.value}`}
              name="paymentMethod"
              value={option.value}
              checked={method === option.value}
              onChange={() => setMethod(option.value)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-sm text-muted-foreground">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        data-testid="pay-now-button"
        disabled={isPending}
      >
        {isPending ? "Memproses…" : "Bayar Sekarang"}
      </Button>

      {isPending ? (
        <span data-testid="loading" className="sr-only" role="status">
          Memproses checkout
        </span>
      ) : null}

      {error ? (
        <p
          role="alert"
          data-testid="checkout-error"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground" data-testid="dummy-payment-note">
        Ini checkout simulasi — tidak ada payment gateway dan tidak ada uang
        sungguhan. Transaksinya tetap tercatat di database.
      </p>
    </form>
  );
}
