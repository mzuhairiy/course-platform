import "server-only";

import type { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";

/**
 * Thrown when an authenticated user lacks the role required for an action.
 * Server Actions should catch this and return a user-facing error rather than
 * letting it bubble as an unhandled 500.
 */
export class ForbiddenError extends Error {
  constructor(message = "Anda tidak memiliki akses untuk melakukan ini.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Pure predicate — true when `role` is one of the allowed roles. */
export function hasRole(
  role: UserRole | null | undefined,
  allowed: readonly UserRole[],
): boolean {
  return role != null && allowed.includes(role);
}

/**
 * Defense-in-depth guard for Server Actions. Middleware already gates the
 * route, but middleware can be bypassed — every mutation must re-check the
 * session role server-side. Returns the session user on success; throws
 * {@link ForbiddenError} when unauthenticated or under-privileged.
 *
 * @example
 *   const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
 */
export async function requireRole(...allowed: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new ForbiddenError("Anda harus login terlebih dahulu.");
  }
  if (!hasRole(user.role, allowed)) {
    throw new ForbiddenError();
  }
  return user;
}
