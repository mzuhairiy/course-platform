import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { resolveLiveRole } from "@/lib/rbac";
import { signInSchema } from "@/schemas/auth";
import { getUserByEmail } from "@/server/services/user";

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Credentials provider requires the JWT strategy in Auth.js v5. Must be set
  // explicitly because the presence of an adapter otherwise defaults to "database".
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // The JWT's `role` claim is only refreshed on sign-in, so a role change
    // (e.g. an admin revoking INSTRUCTOR) would otherwise stay invisible to an
    // already-open session until the user signs out and back in (BUG-002).
    // Re-reading the role from the DB on every session read closes that gap
    // for the Node-side authorization boundary (getCurrentUser/requireRole).
    // Middleware stays on the edge-safe authConfig.callbacks.session (no DB
    // access there) and remains UX-only enforcement, as already documented.
    async session(params) {
      const session = authConfig.callbacks.session(params);
      if (session.user) {
        const dbUser = await db.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        session.user.role = resolveLiveRole(session.user.role, dbUser?.role);
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await getUserByEmail(email);
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
});

/** Convenience helper for Server Components: returns the user or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
