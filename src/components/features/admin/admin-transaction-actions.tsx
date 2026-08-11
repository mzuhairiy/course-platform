"use client";

import type { TransactionStatus } from "@prisma/client";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/typography";
import {
  ADMIN_TRANSACTION_ACTIONS,
  allowedAdminTransitions,
} from "@/config/transaction-status";
import { ADMIN_NOTE_MAX } from "@/schemas/transaction";
import { updateTransactionStatusAction } from "@/server/actions/admin-transaction";

/**
 * Aksi status manual pengganti webhook payment gateway. Tombol yang dirender
 * mengikuti matriks transisi yang sama dengan yang divalidasi server, jadi UI
 * tidak pernah menawarkan aksi yang bakal ditolak. Error tampil inline (bukan
 * cuma toast) supaya tetap terbaca di DOM.
 */
export function AdminTransactionActions({
  orderId,
  status,
}: {
  orderId: string;
  status: TransactionStatus;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<TransactionStatus | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const transitions = allowedAdminTransitions(status);

  function open(next: TransactionStatus) {
    setTarget(next);
    setNote("");
    setError(null);
  }

  function submit() {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTransactionStatusAction({
        orderId,
        status: target,
        note: note.trim() || undefined,
      });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setTarget(null);
      router.refresh();
    });
  }

  if (transitions.length === 0) {
    return (
      <div data-testid="admin-transaction-actions">
        <Text variant="muted" data-testid="admin-transaction-status-final">
          Status <strong>{status}</strong> bersifat final — tidak ada aksi admin
          yang tersedia.
        </Text>
      </div>
    );
  }

  const meta = target ? ADMIN_TRANSACTION_ACTIONS[target] : null;

  return (
    <div className="space-y-3" data-testid="admin-transaction-actions">
      <div className="flex flex-wrap gap-2">
        {transitions.map((next) => (
          <Button
            key={next}
            type="button"
            variant={
              ADMIN_TRANSACTION_ACTIONS[next].destructive
                ? "outline"
                : "default"
            }
            size="sm"
            data-testid={`admin-transaction-action-${next.toLowerCase()}`}
            onClick={() => open(next)}
          >
            {ADMIN_TRANSACTION_ACTIONS[next].label}
          </Button>
        ))}
      </div>

      <Dialog
        open={target != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTarget(null);
        }}
      >
        <DialogContent data-testid="admin-transaction-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Ubah status ke {target}?</DialogTitle>
            <DialogDescription>{meta?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="admin-transaction-note">Catatan (opsional)</Label>
            <Textarea
              id="admin-transaction-note"
              name="note"
              maxLength={ADMIN_NOTE_MAX}
              placeholder="Alasan perubahan status — tersimpan di jejak audit."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              data-testid="admin-transaction-note"
            />
          </div>

          {error ? (
            <p
              role="alert"
              data-testid="admin-transaction-error"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="admin-transaction-cancel"
              onClick={() => setTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant={meta?.destructive ? "destructive" : "default"}
              disabled={isPending}
              data-testid="admin-transaction-confirm"
              onClick={submit}
            >
              {isPending ? "Menyimpan…" : `Ubah ke ${target}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPending ? <span data-testid="loading" className="sr-only">Menyimpan</span> : null}
    </div>
  );
}
