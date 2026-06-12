/** Where users land after a successful login. */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export const SIGN_IN_ROUTE = "/sign-in";
export const SIGN_UP_ROUTE = "/sign-up";

/** Route prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/learn",
  "/instructor",
  "/admin",
] as const;
