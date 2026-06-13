"use client";

import type { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AccountCard } from "@/components/features/settings/account-card";
import { ProfileForm } from "@/components/features/settings/profile-form";
import { SecurityForm } from "@/components/features/settings/security-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heading } from "@/components/ui/typography";
import type { UpdateProfileInput } from "@/schemas/profile";

type SettingsUser = {
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: UserRole;
};

const HOME_ROUTE = "/";

export function SettingsView({ user }: { user: SettingsUser }) {
  const router = useRouter();
  const [profileDirty, setProfileDirty] = useState(false);
  const [securityDirty, setSecurityDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasUnsavedChanges = profileDirty || securityDirty;

  const handleProfileDirty = useCallback(
    (dirty: boolean) => setProfileDirty(dirty),
    [],
  );
  const handleSecurityDirty = useCallback(
    (dirty: boolean) => setSecurityDirty(dirty),
    [],
  );

  // Warn on hard navigation / tab close while there are unsaved edits.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  function handleBack() {
    if (hasUnsavedChanges) {
      setDialogOpen(true);
    } else {
      router.push(HOME_ROUTE);
    }
  }

  const profileDefaults: UpdateProfileInput = {
    name: user.name ?? "",
    bio: user.bio ?? "",
    image: user.image ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          data-testid="settings-back-button"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke beranda
        </Button>
        <Heading as="h1" level="h1">
          Settings
        </Heading>
      </header>

      <ProfileForm
        defaultValues={profileDefaults}
        onDirtyChange={handleProfileDirty}
      />
      <AccountCard email={user.email} role={user.role} />
      <SecurityForm onDirtyChange={handleSecurityDirty} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="unsaved-changes-dialog">
          <DialogHeader>
            <DialogTitle>Perubahan belum disimpan</DialogTitle>
            <DialogDescription>
              Kamu punya perubahan yang belum disimpan. Yakin ingin keluar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="unsaved-cancel"
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-testid="unsaved-confirm-leave"
              onClick={() => {
                setDialogOpen(false);
                router.push(HOME_ROUTE);
              }}
            >
              Keluar tanpa menyimpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
