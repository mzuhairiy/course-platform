import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only star display (rounds to nearest whole star). */
export function StarRating({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const filled = Math.round(value);
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      data-testid="star-rating"
      data-value={value}
      aria-label={`${value} dari 5 bintang`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i <= filled
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}
