import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/shared/workspace-shell";
import { Toaster } from "@/components/ui/sonner";
import { FORBIDDEN_ROUTE } from "@/config/routes";
import { instructorNav } from "@/config/dashboard-nav";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { getNavUser } from "@/server/services/user";

const ALLOWED = [UserRole.INSTRUCTOR, UserRole.ADMIN];

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates this tree; re-check here as defense in depth in
  // case it is ever bypassed or the matcher changes.
  const sessionUser = await getCurrentUser();
  if (!sessionUser || !hasRole(sessionUser.role, ALLOWED)) {
    redirect(FORBIDDEN_ROUTE);
  }

  const user = await getNavUser(sessionUser.id);

  return (
    <>
      <WorkspaceShell
        items={instructorNav}
        areaLabel="Instructor"
        sidebarTestId="instructor-sidebar"
        settingsHref="/instructor/settings"
        user={user}
      >
        {children}
      </WorkspaceShell>
      <Toaster />
    </>
  );
}
