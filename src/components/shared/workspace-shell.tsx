"use client";

import {
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  DashboardNavIcon,
  DashboardNavItem,
} from "@/config/dashboard-nav";
import { siteConfig } from "@/config/site";
import { cn, getInitials } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

// Resolve serializable icon keys (from the nav config) to lucide components on
// the client — components can't cross the server→client boundary as props.
const ICONS: Record<DashboardNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  "my-courses": BookOpen,
  create: PlusCircle,
  courses: Library,
  users: Users,
  transactions: CreditCard,
  categories: Tags,
};

export type ShellUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type WorkspaceShellProps = {
  children: React.ReactNode;
  items: DashboardNavItem[];
  /** Short label shown above the nav and as the first breadcrumb crumb. */
  areaLabel: string;
  user: ShellUser;
  /** Stable testid for the sidebar, e.g. "instructor-sidebar". */
  sidebarTestId: string;
  /** Settings route for this persona's own workspace (not the student one). */
  settingsHref: string;
  /** Optional accent badge (used to flag the admin console). */
  badge?: { label: string; className?: string };
};

/** Pick the most specific nav item matching the current path. */
function useActiveHref(items: DashboardNavItem[]) {
  const pathname = usePathname();
  return [...items]
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function WorkspaceShell({
  children,
  items,
  areaLabel,
  user,
  sidebarTestId,
  settingsHref,
  badge,
}: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeHref = useActiveHref(items);
  const activeItem = items.find((item) => item.href === activeHref);

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label={areaLabel}>
      {items.map((item) => {
        const isActive = item.href === activeHref;
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            data-testid={`sidebar-link-${item.href}`}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarHeader = (
    <div className="flex items-center justify-between gap-2 border-b border-primary-foreground/15 px-5 py-4">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight text-primary-foreground"
      >
        {siteConfig.name}
      </Link>
      {badge ? (
        <Badge
          variant="outline"
          className={cn("border-primary-foreground/30", badge.className)}
        >
          {badge.label}
        </Badge>
      ) : (
        <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/60">
          {areaLabel}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col bg-primary text-primary-foreground md:flex"
        data-testid={sidebarTestId}
      >
        {sidebarHeader}
        {nav}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-primary text-primary-foreground shadow-xl"
            data-testid={`${sidebarTestId}-mobile`}
          >
            {sidebarHeader}
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: mobile toggle + breadcrumb + avatar dropdown */}
        <header
          className="flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6"
          data-testid="workspace-topbar"
        >
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Buka menu"
            aria-expanded={mobileOpen}
            data-testid="workspace-mobile-toggle"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <nav
            className="flex min-w-0 items-center gap-2 text-sm"
            aria-label="Breadcrumb"
            data-testid="workspace-breadcrumb"
          >
            <span className="font-medium text-foreground">{areaLabel}</span>
            {activeItem && activeItem.href !== items[0]?.href ? (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="truncate text-muted-foreground">
                  {activeItem.title}
                </span>
              </>
            ) : null}
          </nav>

          <div className="ml-auto">
            <UserMenu user={user} settingsHref={settingsHref} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function UserMenu({
  user,
  settingsHref,
}: {
  user: ShellUser;
  settingsHref: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="workspace-user-menu-trigger"
          aria-label="Menu pengguna"
        >
          <Avatar className="h-9 w-9 border border-border">
            {user?.image ? (
              <AvatarImage src={user.image} alt={user.name ?? ""} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user?.name ?? user?.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
            {user?.name ?? "Account"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        data-testid="workspace-user-menu"
      >
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium">{user?.name ?? "Account"}</span>
          {user?.email ? (
            <span className="text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsHref} data-testid="workspace-menu-settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <button
            type="submit"
            data-testid="workspace-menu-sign-out"
            className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
