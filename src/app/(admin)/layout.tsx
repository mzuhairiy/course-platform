import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/shared/workspace-shell";
import { Toaster } from "@/components/ui/sonner";
import { FORBIDDEN_ROUTE } from "@/config/routes";
import { adminNav } from "@/config/dashboard-nav";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { getNavUser } from "@/server/services/user";

const ALLOWED = [UserRole.ADMIN];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates this tree; re-check here as defense in depth.
  const sessionUser = await getCurrentUser();
  if (!sessionUser || !hasRole(sessionUser.role, ALLOWED)) {
    redirect(FORBIDDEN_ROUTE);
  }

  const user = await getNavUser(sessionUser.id);

  return (
    <>
      <WorkspaceShell
        items={adminNav}
        areaLabel="Admin"
        sidebarTestId="admin-sidebar"
        settingsHref="/admin/settings"
        user={user}
        badge={{
          label: "Admin",
          className: "bg-amber-500/15 text-amber-200 border-amber-400/40",
        }}
      >
        {children}
      </WorkspaceShell>
      <Toaster />
    </>
  );
}
