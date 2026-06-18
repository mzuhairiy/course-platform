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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteCourseAction } from "@/server/actions/course";

type DeleteCourseDialogProps = {
  courseId: string;
  courseTitle: string;
  /** Visual style of the trigger button. */
  triggerVariant?: "outline" | "destructive";
  triggerLabel?: string;
};

/**
 * GitHub-style "type the title to confirm" delete. On success the action
 * redirects to the course list; an enrollment block surfaces as an inline error.
 */
export function DeleteCourseDialog({
  courseId,
  courseTitle,
  triggerVariant = "outline",
  triggerLabel = "Delete",
}: DeleteCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = confirmText === courseTitle && !isPending;

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCourseAction(courseId);
      // On success the action redirects; only an error result returns here.
      if (result?.status === "error") {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size="sm"
        data-testid="delete-course-button"
        onClick={() => {
          setConfirmText("");
          setError(null);
          setOpen(true);
        }}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="delete-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Hapus course ini?</DialogTitle>
            <DialogDescription>
              Tindakan ini permanen dan menghapus semua section & lecture di
              dalamnya. Ketik <strong>{courseTitle}</strong> untuk konfirmasi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm-input">Nama course</Label>
            <Input
              id="delete-confirm-input"
              name="confirmTitle"
              autoComplete="off"
              data-testid="delete-confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            {error ? (
              <p
                role="alert"
                data-testid="delete-course-error"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="delete-cancel"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-testid="delete-confirm-button"
              disabled={!canDelete}
              onClick={handleDelete}
            >
              {isPending ? "Menghapus…" : "Hapus permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
