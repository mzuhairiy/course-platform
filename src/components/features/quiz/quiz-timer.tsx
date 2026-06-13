"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function format(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Countdown anchored to a server-provided deadline (startedAt + timeLimit), so
 * the displayed time can't be gamed by a client-only timer. Fires onExpire once
 * when the deadline passes.
 */
export function QuizTimer({
  deadline,
  onExpire,
}: {
  deadline: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.round((deadline - Date.now()) / 1000),
  );
  const firedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const secondsLeft = Math.round((deadline - Date.now()) / 1000);
      setRemaining(secondsLeft);
      if (secondsLeft <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  const urgent = remaining <= 10;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium tabular-nums",
        urgent
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border text-foreground",
      )}
      data-testid="quiz-timer"
      data-remaining-seconds={Math.max(0, remaining)}
      role="timer"
      aria-live="off"
    >
      <Clock className="h-4 w-4" />
      {format(remaining)}
    </div>
  );
}
