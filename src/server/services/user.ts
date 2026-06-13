import "server-only";

import { db } from "@/lib/db";

export function getUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return db.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: input.passwordHash,
    },
  });
}

/** Full profile data for the settings page (no password). */
export function getUserProfile(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
    },
  });
}

/** Minimal data the navbar needs; read fresh from the DB so profile edits
 * reflect immediately after revalidation (the JWT alone would be stale). */
export function getNavUser(id: string) {
  return db.user.findUnique({
    where: { id },
    select: { name: true, email: true, image: true },
  });
}

export function updateUserProfile(
  id: string,
  data: { name: string; image: string | null; bio: string | null },
) {
  return db.user.update({ where: { id }, data });
}

/** Read just the password hash (for verifying the current password). */
export function getUserPasswordHash(id: string) {
  return db.user.findUnique({ where: { id }, select: { password: true } });
}

export function updateUserPassword(id: string, passwordHash: string) {
  return db.user.update({ where: { id }, data: { password: passwordHash } });
}
