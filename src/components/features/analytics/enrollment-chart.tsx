import type { EnrollmentTrendPoint } from "@/server/services/analytics";

/**
 * Dependency-free 30-day enrollment trend (simple SVG bars). Deterministic
 * markup for tests; swap in recharts later without touching callers.
 */
export function EnrollmentChart({
  data,
}: {
  data: EnrollmentTrendPoint[];
}) {
  const total = data.reduce((sum, p) => sum + p.count, 0);
  const max = Math.max(1, ...data.map((p) => p.count));

  if (total === 0) {
    return (
      <div
        className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
        data-testid="enrollment-chart"
        data-empty="true"
      >
        Belum ada enrollment dalam 30 hari terakhir.
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-border p-4"
      data-testid="enrollment-chart"
      data-total={total}
    >
      <div className="flex h-40 items-end gap-0.5">
        {data.map((point) => (
          <div
            key={point.date}
            className="flex-1 rounded-t bg-primary/80"
            style={{ height: `${Math.round((point.count / max) * 100)}%` }}
            title={`${point.date}: ${point.count}`}
            data-date={point.date}
            data-count={point.count}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} enrollment dalam 30 hari terakhir
      </p>
    </div>
  );
}
