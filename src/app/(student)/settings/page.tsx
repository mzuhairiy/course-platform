import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsView } from "@/components/features/settings/settings-view";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { getCurrentUser } from "@/lib/auth";
import { getUserProfile } from "@/server/services/user";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const user = await getUserProfile(sessionUser.id);
  if (!user) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  return (
    <Section spacing="compact">
      <Container size="reading" data-testid="settings-page">
        <SettingsView
          user={{
            name: user.name,
            email: user.email,
            image: user.image,
            bio: user.bio,
            role: user.role,
          }}
        />
      </Container>
    </Section>
  );
}
