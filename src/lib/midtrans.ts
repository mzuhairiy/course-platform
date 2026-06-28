import "server-only";

import { createHash } from "node:crypto";

/**
 * Midtrans integration boundary (SKELETON).
 *
 * - `verifySignature` is fully implemented (pure SHA512) and unit-tested — the
 *   webhook MUST verify every notification with it.
 * - `createSnapTransaction` talks to Snap's REST API directly (no SDK dep). It
 *   **no-ops** when MIDTRANS_SERVER_KEY is unset (local/dev), returning a null
 *   token so the checkout UI can render a "payment not configured" state.
 *   Wiring real credentials is all that's left to go live.
 *
 * Server key is read only here (server-only); never expose it to the client —
 * the browser uses NEXT_PUBLIC_MIDTRANS_CLIENT_KEY for Snap.js.
 */

export type SnapCustomer = { first_name: string; email: string };
export type SnapItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type SnapResult = {
  token: string | null;
  redirectUrl: string | null;
  /** true when no server key is configured (skeleton/no-op mode). */
  skipped?: boolean;
};

function snapBaseUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

export async function createSnapTransaction(params: {
  orderId: string;
  grossAmount: number;
  customer: SnapCustomer;
  items: SnapItem[];
}): Promise<SnapResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    // Skeleton mode: no credentials → no real transaction created.
    return { token: null, redirectUrl: null, skipped: true };
  }

  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  try {
    const res = await fetch(`${snapBaseUrl()}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: params.orderId,
          gross_amount: params.grossAmount,
        },
        customer_details: params.customer,
        item_details: params.items,
      }),
    });
    if (!res.ok) return { token: null, redirectUrl: null };
    const data = (await res.json()) as {
      token?: string;
      redirect_url?: string;
    };
    return { token: data.token ?? null, redirectUrl: data.redirect_url ?? null };
  } catch {
    return { token: null, redirectUrl: null };
  }
}

/**
 * Verify a Midtrans notification signature:
 * SHA512(order_id + status_code + gross_amount + ServerKey).
 * Returns false when no server key is configured (cannot trust anything).
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;
  const expected = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return expected === signatureKey;
}
