"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changeUserRoleAction } from "@/server/actions/admin";

const ROLES: UserRole[] = [
  UserRole.STUDENT,
  UserRole.INSTRUCTOR,
  UserRole.ADMIN,
];

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Role dropdown + confirmation dialog. Self-change is disabled in the UI (and
 * blocked server-side) so an admin can't lock themselves out.
 */
export function AdminRoleControl({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  function confirm() {
    if (!pendingRole) return;
    startTransition(async () => {
      const result = await changeUserRoleAction(userId, pendingRole);
      if (result.status === "error") {
        toast.error(result.message);
        setPendingRole(null);
        return;
      }
      toast.success(<span data-testid="success-toast">{result.message}</span>);
      setPendingRole(null);
      router.refresh();
    });
  }

  return (
    <>
      <select
        className={SELECT_CLASS}
        data-testid="admin-role-dropdown"
        value={currentRole}
        disabled={isSelf || isPending}
        aria-label="Ubah role"
        onChange={(e) => {
          const next = e.target.value as UserRole;
          if (next !== currentRole) setPendingRole(next);
        }}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      <Dialog
        open={pendingRole !== null}
        onOpenChange={(o) => !o && setPendingRole(null)}
      >
        <DialogContent data-testid="admin-role-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Ubah role pengguna?</DialogTitle>
            <DialogDescription>
              Role akan diubah dari <strong>{currentRole}</strong> menjadi{" "}
              <strong>{pendingRole}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRole(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              data-testid="admin-role-confirm"
              disabled={isPending}
              onClick={confirm}
            >
              {isPending ? "Menyimpan…" : "Ya, ubah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
