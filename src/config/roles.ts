/**
 * Role string constants — edge-safe mirror of the Prisma `UserRole` enum.
 *
 * Why duplicate the enum: `middleware.ts` runs on the edge runtime where
 * importing `@prisma/client` (Node-only) is not allowed. The role lives on the
 * JWT-derived session as a plain string, so the middleware compares against
 * these literals. Server-side code (services, actions, `rbac.ts`) should keep
 * using the real `UserRole` enum from `@prisma/client`.
 */
import {
  ADMIN_ROUTE,
  DEFAULT_LOGIN_REDIRECT,
  INSTRUCTOR_ROUTE,
} from "@/config/routes";

export const ROLE = {
  STUDENT: "STUDENT",
  INSTRUCTOR: "INSTRUCTOR",
  ADMIN: "ADMIN",
} as const;

export type RoleValue = (typeof ROLE)[keyof typeof ROLE];

/**
 * The landing path for a given role. Each persona owns a distinct surface, so
 * this is the single source of truth used by both the sign-in redirect and the
 * middleware (which bounces instructor/admin off student/marketing surfaces).
 * Unknown/STUDENT → the student dashboard.
 */
export function getRoleHomePath(
  role: RoleValue | string | null | undefined,
): string {
  switch (role) {
    case ROLE.ADMIN:
      return ADMIN_ROUTE;
    case ROLE.INSTRUCTOR:
      return INSTRUCTOR_ROUTE;
    default:
      return DEFAULT_LOGIN_REDIRECT;
  }
}
