"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { StarInput } from "@/components/features/review/star-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_COMMENT_MAX } from "@/schemas/review";
import {
  deleteReviewAction,
  submitReviewAction,
} from "@/server/actions/review";

export function ReviewForm({
  courseId,
  courseSlug,
  existing,
}: {
  courseId: string;
  courseSlug: string;
  existing?: { rating: number; comment: string | null } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (rating < 1) {
      setError("Beri rating 1–5 bintang");
      return;
    }
    startTransition(async () => {
      const result = await submitReviewAction(courseId, courseSlug, {
        rating,
        comment,
      });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      toast.success(<span data-testid="success-toast">{result.message}</span>);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteReviewAction(courseId, courseSlug);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setRating(0);
      setComment("");
      toast.success(<span data-testid="success-toast">{result.message}</span>);
      router.refresh();
    });
  }

  return (
    <div
      className="space-y-3 rounded-lg border border-border p-4"
      data-testid="review-form"
    >
      <p className="text-sm font-medium">
        {existing ? "Review kamu" : "Tulis review"}
      </p>

      {error ? (
        <p
          role="alert"
          data-testid="review-error"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <StarInput value={rating} onChange={setRating} />

      <Textarea
        rows={3}
        maxLength={REVIEW_COMMENT_MAX}
        placeholder="Bagikan pengalamanmu (opsional)"
        data-testid="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          data-testid="review-submit"
          disabled={isPending}
          onClick={submit}
        >
          {isPending ? "Menyimpan…" : existing ? "Perbarui" : "Kirim Review"}
        </Button>
        {existing ? (
          <Button
            type="button"
            variant="ghost"
            data-testid="review-delete"
            disabled={isPending}
            onClick={remove}
          >
            Hapus
          </Button>
        ) : null}
      </div>
    </div>
  );
}
