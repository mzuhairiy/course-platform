"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LearnShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<"player" | "curriculum">("player");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="mb-4 flex gap-2 lg:hidden"
        role="tablist"
        data-testid="learn-tabs"
      >
        <button
          type="button"
          role="tab"
          onClick={() => setTab("player")}
          aria-selected={tab === "player"}
          data-testid="tab-player"
          className={cn(
            "flex-1 rounded-md border px-3 py-2 text-sm",
            tab === "player"
              ? "border-foreground bg-accent font-medium"
              : "border-border",
          )}
        >
          Player
        </button>
        <button
          type="button"
          role="tab"
          onClick={() => setTab("curriculum")}
          aria-selected={tab === "curriculum"}
          data-testid="tab-curriculum"
          className={cn(
            "flex-1 rounded-md border px-3 py-2 text-sm",
            tab === "curriculum"
              ? "border-foreground bg-accent font-medium"
              : "border-border",
          )}
        >
          Curriculum
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside
          className={cn("lg:block", tab === "curriculum" ? "block" : "hidden")}
        >
          <div className="lg:sticky lg:top-20">{sidebar}</div>
        </aside>
        <div className={cn("lg:block", tab === "player" ? "block" : "hidden")}>
          {children}
        </div>
      </div>
    </div>
  );
}
