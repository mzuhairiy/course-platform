import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";

export function StatCard({
  label,
  value,
  hint,
  testid,
}: {
  label: string;
  value: string | number;
  hint?: string;
  testid?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 pt-6">
        <p className="text-3xl font-semibold" data-testid={testid}>
          {value}
        </p>
        <Text variant="muted" as="span" className="block text-sm">
          {label}
        </Text>
        {hint ? (
          <Text variant="muted" as="span" className="block text-xs">
            {hint}
          </Text>
        ) : null}
      </CardContent>
    </Card>
  );
}
