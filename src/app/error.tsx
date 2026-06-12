"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging (no sensitive data logged).
    console.error(error);
  }, [error]);

  return (
    <main
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center"
      data-testid="error-boundary"
    >
      <Heading as="h1" level="h2">
        Ada yang tidak beres
      </Heading>
      <Text variant="muted" className="max-w-md">
        Terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
      </Text>
      <Button onClick={reset} data-testid="error-retry">
        Coba lagi
      </Button>
    </main>
  );
}
