import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

export default function NotFound() {
  return (
    <main
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center"
      data-testid="not-found"
    >
      <p className="text-sm font-semibold text-brand">404</p>
      <Heading as="h1" level="h2">
        Halaman tidak ditemukan
      </Heading>
      <Text variant="muted" className="max-w-md">
        Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </Text>
      <Button asChild>
        <Link href="/" data-testid="not-found-home">
          Kembali ke beranda
        </Link>
      </Button>
    </main>
  );
}
