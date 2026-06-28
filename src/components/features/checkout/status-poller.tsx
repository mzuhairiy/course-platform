"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * While a transaction is PENDING, refresh the (server-rendered, DB-backed)
 * status periodically — the webhook may land slightly after the user returns.
 * Stops after `maxTicks` to avoid polling forever.
 */
export function StatusPoller({
  intervalMs = 5000,
  maxTicks = 24,
}: {
  intervalMs?: number;
  maxTicks?: number;
}) {
  const router = useRouter();
  const ticks = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      ticks.current += 1;
      if (ticks.current > maxTicks) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, maxTicks]);

  return <span data-testid="status-poller" aria-hidden hidden />;
}
