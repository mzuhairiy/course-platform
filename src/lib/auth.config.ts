import type { UserRole } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

import { SIGN_IN_ROUTE } from "@/config/routes";

/**
 * Edge-safe Auth.js config (no adapter, no Node-only providers). This is the
 * piece imported by `middleware.ts`. The full config (Prisma adapter +
 * Credentials/Google providers) lives in `auth.ts` and spreads this.
 */
export const authConfig = {
  pages: {
    signIn: SIGN_IN_ROUTE,
  },
  // Providers are added in auth.ts; the edge instance only reads the JWT.
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id;
        if ("role" in user) {
          token.role = user.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // token carries the fields set in the jwt callback; cast because the
        // JWT augmentation does not propagate to the callback's token type.
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
