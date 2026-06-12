import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
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
  trustHost: true,
  ...authConfig,
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
