"use client";

import { useRouter } from "next/navigation";
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
import { deleteCategoryAction } from "@/server/actions/category";

/**
 * Plain confirm dialog. A category still referenced by a course or an
 * expert can't be deleted — the block reason surfaces inline (not just a
 * toast) so it stays visible in the DOM.
 */
export function DeleteCategoryDialog({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="delete-category-button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Hapus
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="delete-category-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Hapus kategori ini?</DialogTitle>
            <DialogDescription>
              Kategori <strong>{categoryName}</strong> akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p
              role="alert"
              data-testid="delete-category-error"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="delete-category-cancel"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-testid="delete-category-confirm"
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
