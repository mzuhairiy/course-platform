import { NextResponse } from "next/server";

import {
  processPaymentNotification,
  type MidtransNotification,
} from "@/server/services/transaction";

/**
 * Midtrans payment notification webhook. All verification + idempotency lives
 * in processPaymentNotification (unit-tested, HTTP-free). We never log the raw
 * payload (may contain sensitive details).
 */
export async function POST(request: Request) {
  let payload: MidtransNotification;
  try {
    payload = (await request.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await processPaymentNotification(payload);
    return NextResponse.json({ message: result.message }, { status: result.status });
  } catch {
    // Don't leak internals; Midtrans will retry on 5xx.
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}
