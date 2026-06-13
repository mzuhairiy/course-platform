import { cn } from "@/lib/utils";

/**
 * Course completion bar + label. Pure/presentational so it can render in both
 * server (sidebar, course header, cards) and client trees.
 */
export function CourseProgressBar({
  completed,
  total,
  percentage,
  className,
}: {
  completed: number;
  total: number;
  percentage: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {completed} dari {total} selesai
        </span>
        <span
          className="font-semibold text-foreground"
          data-testid="course-progress-percentage"
        >
          {percentage}%
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="lecture-progress-bar"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
