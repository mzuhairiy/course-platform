import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment the Auth.js types so `session.user` and the JWT carry our `id` + `role`.
declare module "next-auth" {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
