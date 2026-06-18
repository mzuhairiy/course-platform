"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteLessonAction } from "@/server/actions/lesson";

/**
 * Delete a lesson after confirmation. When students already have progress on
 * the lesson we warn (the progress becomes orphaned) but still allow deletion.
 */
export function DeleteLessonButton({
  courseId,
  lectureId,
  lessonTitle,
  progressCount,
}: {
  courseId: string;
  lectureId: string;
  lessonTitle: string;
  progressCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteLessonAction(courseId, lectureId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-testid="delete-lesson-button"
        aria-label="Hapus lesson"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Hapus
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="delete-lesson-dialog">
          <DialogHeader>
            <DialogTitle>Hapus lesson ini?</DialogTitle>
            <DialogDescription>
              <span className="block">
                &ldquo;{lessonTitle}&rdquo; akan dihapus permanen.
              </span>
              {progressCount > 0 ? (
                <span
                  className="mt-2 block font-medium text-destructive"
                  data-testid="lesson-progress-warning"
                >
                  {progressCount} siswa punya progress di lesson ini — progress
                  tersebut akan jadi orphan.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p
              role="alert"
              data-testid="delete-lesson-error"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-testid="delete-lesson-confirm"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Menghapus…" : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
