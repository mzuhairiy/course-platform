import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsView } from "@/components/features/settings/settings-view";
import { getCurrentUser } from "@/lib/auth";
import { getUserProfile } from "@/server/services/user";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect("/sign-in?callbackUrl=/admin/settings");
  }

  const user = await getUserProfile(sessionUser.id);
  if (!user) {
    redirect("/sign-in?callbackUrl=/admin/settings");
  }

  return (
    <div data-testid="settings-page">
      <SettingsView
        backHref="/admin"
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          bio: user.bio,
          role: user.role,
        }}
      />
    </div>
  );
}
