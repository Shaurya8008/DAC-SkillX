import type { NextAuthConfig } from "next-auth";

// Edge-safe half of the auth config — no Credentials provider, no bcrypt,
// no Prisma. middleware.ts runs on the Edge runtime with a strict bundle
// size limit (1MB on Vercel's free tier); importing bcryptjs there alone
// pushed the Edge Function past that limit. This config only reads/refreshes
// the JWT session, which is all middleware needs to gate routes — the real
// Credentials provider lives in auth.ts, used only by Node.js API routes.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "student";
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
