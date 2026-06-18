/** Where users land after a successful login. */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export const SIGN_IN_ROUTE = "/sign-in";
export const SIGN_UP_ROUTE = "/sign-up";

/** Area roots gated by role (enforced in middleware + server actions). */
export const INSTRUCTOR_ROUTE = "/instructor";
export const ADMIN_ROUTE = "/admin";

/** Where the middleware rewrites requests that fail a role check. */
export const FORBIDDEN_ROUTE = "/forbidden";

/**
 * Shared account settings. Lives under the student group, so instructor/admin
 * are redirected to their own `${workspace}/settings` to keep the student
 * navbar out of their persona.
 */
export const SETTINGS_ROUTE = "/settings";

/** Route prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/purchase-history",
  "/settings",
  "/learn",
  "/instructor",
  "/admin",
] as const;

/**
 * Authenticated surfaces that belong to the STUDENT persona (consumer +
 * learning). Instructor/admin who land here are redirected to their own
 * workspace — they have no enrolled-courses / learning / purchase UI.
 * `/settings` is intentionally excluded (account settings are shared).
 */
export const STUDENT_AREA_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/learn",
  "/purchase-history",
] as const;
