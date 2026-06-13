import NextAuth from "next-auth";

import { PROTECTED_PREFIXES, SIGN_IN_ROUTE } from "@/config/routes";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL(SIGN_IN_ROUTE, nextUrl);
    signInUrl.searchParams.set(
      "callbackUrl",
      nextUrl.pathname + nextUrl.search,
    );
    return Response.redirect(signInUrl);
  }

  return undefined;
});

// Only run middleware on the protected route trees.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-courses/:path*",
    "/purchase-history/:path*",
    "/settings/:path*",
    "/learn/:path*",
    "/instructor/:path*",
    "/admin/:path*",
  ],
};
