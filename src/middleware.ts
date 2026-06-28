import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import {
  ADMIN_ROUTE,
  FORBIDDEN_ROUTE,
  INSTRUCTOR_ROUTE,
  PROTECTED_PREFIXES,
  SETTINGS_ROUTE,
  SIGN_IN_ROUTE,
  STUDENT_AREA_PREFIXES,
} from "@/config/routes";
import { getRoleHomePath, ROLE } from "@/config/roles";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const startsWithArea = (pathname: string, area: string) =>
  pathname === area || pathname.startsWith(`${area}/`);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = Boolean(session);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    nextUrl.pathname.startsWith(prefix),
  );

  // Unauthenticated access to any protected tree → bounce to sign-in (UX).
  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL(SIGN_IN_ROUTE, nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  // Role gates. The role rides on the JWT-derived session as a plain string, so
  // this stays edge-safe (no Prisma import). This is UX-level enforcement only —
  // every Server Action re-checks via requireRole() (middleware can be bypassed).
  const role = session?.user?.role;

  if (
    startsWithArea(nextUrl.pathname, INSTRUCTOR_ROUTE) &&
    role !== ROLE.INSTRUCTOR &&
    role !== ROLE.ADMIN
  ) {
    return NextResponse.rewrite(new URL(FORBIDDEN_ROUTE, nextUrl));
  }

  if (startsWithArea(nextUrl.pathname, ADMIN_ROUTE) && role !== ROLE.ADMIN) {
    return NextResponse.rewrite(new URL(FORBIDDEN_ROUTE, nextUrl));
  }

  // Persona separation: instructor/admin never land on marketing ("/") or the
  // student-only surfaces — send them to their own workspace instead.
  if (isLoggedIn && role && role !== ROLE.STUDENT) {
    const home = getRoleHomePath(role);

    // Shared "/settings" renders under the student navbar — send each persona
    // to its own workspace settings instead.
    if (startsWithArea(nextUrl.pathname, SETTINGS_ROUTE)) {
      return NextResponse.redirect(new URL(`${home}${SETTINGS_ROUTE}`, nextUrl));
    }

    const onStudentSurface =
      nextUrl.pathname === "/" ||
      STUDENT_AREA_PREFIXES.some((prefix) =>
        startsWithArea(nextUrl.pathname, prefix),
      );
    if (onStudentSurface && !startsWithArea(nextUrl.pathname, home)) {
      return NextResponse.redirect(new URL(home, nextUrl));
    }
  }

  return undefined;
});

// Only run middleware on the protected route trees + the marketing homepage
// (so instructor/admin get redirected off "/").
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/my-courses/:path*",
    "/purchase-history/:path*",
    "/checkout/:path*",
    "/settings/:path*",
    "/learn/:path*",
    "/instructor/:path*",
    "/admin/:path*",
  ],
};
