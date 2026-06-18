import { Heading, Text } from "@/components/ui/typography";

/**
 * Lightweight stand-in for workspace pages whose full build lands in a later
 * Fase 4 prompt (K = course CRUD, N = analytics/admin). Keeps every sidebar
 * nav target reachable instead of 404-ing.
 */
export function WorkspacePlaceholder({
  title,
  description,
  testid,
}: {
  title: string;
  description: string;
  testid: string;
}) {
  return (
    <div className="space-y-6" data-testid={testid}>
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          {title}
        </Heading>
        <Text variant="muted">{description}</Text>
      </header>
      <div
        className="rounded-lg border border-dashed border-border p-12 text-center"
        data-testid={`${testid}-placeholder`}
      >
        <Text variant="muted">Bagian ini akan tersedia di fase berikutnya.</Text>
      </div>
    </div>
  );
}
