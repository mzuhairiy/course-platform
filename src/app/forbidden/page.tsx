import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { getRoleHomePath } from "@/config/roles";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Akses Ditolak",
};

export default async function ForbiddenPage() {
  // Reached only when authenticated-but-under-privileged (anon is bounced to
  // sign-in by middleware), so send the user back to their own home.
  const user = await getCurrentUser();
  const homePath = getRoleHomePath(user?.role);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-surface px-4"
      data-testid="forbidden-page"
    >
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <Text variant="muted" as="span" className="text-sm font-medium">
            403 · Forbidden
          </Text>
          <Heading as="h1" level="h2">
            Anda tidak memiliki akses ke halaman ini
          </Heading>
          <Text variant="muted">
            Halaman ini terbatas untuk peran tertentu. Jika menurut Anda ini
            keliru, hubungi administrator.
          </Text>
        </div>
        <Button asChild className="w-full">
          <Link href={homePath} data-testid="forbidden-back">
            Kembali ke halaman utama
          </Link>
        </Button>
      </div>
    </main>
  );
}
