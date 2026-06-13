"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markLectureCompleteAction } from "@/server/actions/progress";

export function MarkCompleteButton({
  lectureId,
  initialCompleted,
}: {
  lectureId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await markLectureCompleteAction({ lectureId });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setCompleted(true);
      // Refresh server components so the sidebar/header progress updates live.
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={onClick}
        disabled={isPending || completed}
        variant={completed ? "outline" : "default"}
        data-testid="mark-complete-button"
      >
        {completed ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Selesai
          </>
        ) : isPending ? (
          "Menyimpan..."
        ) : (
          "Tandai Selesai"
        )}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" data-testid="mark-complete-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
