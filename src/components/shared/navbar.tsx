"use client";

import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SearchInput } from "@/components/features/search/search-input";
import { Container } from "@/components/shared/container";
import { NavCategoryMenu } from "@/components/shared/nav-category-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mainNav, userNav } from "@/config/nav";
import { SIGN_IN_ROUTE, SIGN_UP_ROUTE } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn, getInitials } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";
import type { NavCategory } from "@/server/services/category";

type NavUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

// Link-style nav item on the navy header (no solid button box).
const NAV_LINK_CLASS =
  "text-primary-foreground/80 hover:text-primary-foreground hover:bg-transparent";

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function UserMenu({ user }: { user: NonNullable<NavUser> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full pr-1 outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground md:rounded-md md:pr-2"
          data-testid="user-menu-trigger"
          aria-label="User menu"
        >
          <Avatar
            className="h-9 w-9 border border-primary-foreground/30"
            data-testid="navbar-avatar"
          >
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name ?? ""} />
            ) : null}
            {/* Fallback: initials over the navy brand background. */}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.name ?? user.email)}
            </AvatarFallback>
          </Avatar>
          <span
            className="hidden max-w-[10rem] truncate text-sm font-medium md:inline"
            data-testid="navbar-user-name"
          >
            {user.name ?? "Account"}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 opacity-70 transition-transform"
            aria-hidden="true"
            data-testid="user-menu-chevron"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" data-testid="user-menu">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium">{user.name ?? "Account"}</span>
          {user.email ? (
            <span className="text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userNav.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} data-testid={`menu-${slug(item.title)}`}>
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <button
            type="submit"
            data-testid="menu-sign-out"
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

export function Navbar({
  user,
  categories = [],
}: {
  user?: NavUser;
  categories?: NavCategory[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className="sticky top-0 z-40 w-full bg-primary text-primary-foreground"
      data-testid="navbar"
    >
      {/* Row 1: logo · search · auth */}
      <Container>
        <div
          className="flex h-16 items-center gap-3 sm:gap-4"
          data-testid="navbar-top-row"
        >
          <Link
            href="/"
            className="shrink-0 text-lg font-semibold tracking-tight text-primary-foreground"
            data-testid="navbar-logo"
          >
            {siteConfig.name}
          </Link>

          <SearchInput className="min-w-0 flex-1 md:max-w-md" />

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className={NAV_LINK_CLASS}
                >
                  <Link href={SIGN_IN_ROUTE} data-testid="navbar-sign-in">
                    Sign in
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="font-semibold text-primary-foreground hover:text-primary-foreground"
                >
                  <Link href={SIGN_UP_ROUTE} data-testid="navbar-sign-up">
                    Sign up
                  </Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              data-testid="navbar-mobile-toggle"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Container>

      {/* Row 2: navigation menu (desktop) */}
      <div
        className="hidden border-t border-primary-foreground/15 md:block"
        data-testid="navbar-nav-row"
      >
        <Container>
          <nav
            className="flex h-11 items-center gap-1"
            data-testid="navbar-desktop-nav"
          >
            {mainNav.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="link"
                size="sm"
                className={cn(
                  NAV_LINK_CLASS,
                  isActive(item.href) && "text-primary-foreground underline",
                )}
              >
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  data-testid={`nav-link-${slug(item.title)}`}
                >
                  {item.title}
                </Link>
              </Button>
            ))}
            {categories.map((category) => (
              <NavCategoryMenu key={category.id} category={category} />
            ))}
          </nav>
        </Container>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen ? (
        <div
          className="border-t border-primary-foreground/15 bg-primary md:hidden"
          data-testid="navbar-mobile-menu"
        >
          <Container className="max-h-[70vh] space-y-1 overflow-y-auto py-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                data-testid={`mobile-nav-link-${slug(item.title)}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.title}
              </Link>
            ))}

            {categories.map((category) => (
              <div key={category.id} className="pt-2">
                <Link
                  href={`/courses?category=${category.slug}`}
                  className="block px-3 pb-1 text-xs font-medium uppercase text-primary-foreground/60 hover:text-primary-foreground"
                  data-testid={`mobile-category-${category.slug}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {category.name}
                </Link>
                {category.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="block rounded-md px-3 py-2 text-sm text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    data-testid={`mobile-course-${course.slug}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {course.title}
                  </Link>
                ))}
              </div>
            ))}

            {!user ? (
              <div className="flex flex-col gap-1 pt-3">
                <Link
                  href={SIGN_IN_ROUTE}
                  className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  data-testid="mobile-sign-in"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href={SIGN_UP_ROUTE}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="mobile-sign-up"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            ) : null}
          </Container>
        </div>
      ) : null}
    </header>
  );
}
