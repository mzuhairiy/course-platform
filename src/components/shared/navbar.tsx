"use client";

import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Container } from "@/components/shared/container";
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
import { categoryNav, mainNav, userNav } from "@/config/nav";
import { SIGN_IN_ROUTE, SIGN_UP_ROUTE } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getInitials } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

type NavUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function Navbar({ user }: { user?: NavUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      data-testid="navbar"
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight"
            data-testid="navbar-logo"
          >
            {siteConfig.name}
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            data-testid="navbar-desktop-nav"
          >
            {mainNav.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link
                  href={item.href}
                  data-testid={`nav-link-${slug(item.title)}`}
                >
                  {item.title}
                </Link>
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="nav-categories-trigger"
                >
                  Categories
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {categoryNav.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      data-testid={`nav-category-${slug(item.title)}`}
                    >
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="user-menu-trigger"
                    aria-label="User menu"
                  >
                    <Avatar className="h-9 w-9">
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name ?? ""} />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(user.name ?? user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  data-testid="user-menu"
                >
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-medium">
                      {user.name ?? "Account"}
                    </span>
                    {user.email ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    ) : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userNav.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        data-testid={`menu-${slug(item.title)}`}
                      >
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
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href={SIGN_IN_ROUTE} data-testid="navbar-sign-in">
                    Sign in
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={SIGN_UP_ROUTE} data-testid="navbar-sign-up">
                    Sign up
                  </Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
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

      {mobileOpen ? (
        <div
          className="border-t border-border bg-background md:hidden"
          data-testid="navbar-mobile-menu"
        >
          <Container className="space-y-1 py-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                data-testid={`mobile-nav-link-${slug(item.title)}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.title}
              </Link>
            ))}
            <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase text-muted-foreground">
              Categories
            </p>
            {categoryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                data-testid={`mobile-category-${slug(item.title)}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.title}
              </Link>
            ))}
            {!user ? (
              <div className="flex flex-col gap-2 pt-3">
                <Button asChild variant="outline">
                  <Link
                    href={SIGN_IN_ROUTE}
                    data-testid="mobile-sign-in"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    href={SIGN_UP_ROUTE}
                    data-testid="mobile-sign-up"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign up
                  </Link>
                </Button>
              </div>
            ) : null}
          </Container>
        </div>
      ) : null}
    </header>
  );
}
