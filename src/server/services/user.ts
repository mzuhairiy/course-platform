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
