"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Interactive 1–5 star picker (controlled). */
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
      data-testid="star-input"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} bintang`}
          data-testid={`star-${i}`}
          className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              i <= active
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}
