import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const profile = await prisma.profile.findUnique({ where: { email } });
        if (!profile || !profile.passwordHash) return null;

        const valid = await bcrypt.compare(password, profile.passwordHash);
        if (!valid) return null;

        return {
          id: profile.id,
          email: profile.email,
          name: profile.fullName,
          role: profile.role,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session: authConfig.callbacks!.session,
    // Overrides the edge-safe jwt callback (rather than delegating to it)
    // because linking/creating a Profile row for a Google sign-in needs
    // Prisma — which must never be reachable from auth.config.ts, since
    // middleware imports that file into an Edge Function with a strict
    // bundle-size limit.
    jwt: async ({ token, user, account }) => {
      if (account?.provider === "google" && user?.email) {
        let profile = await prisma.profile.findUnique({ where: { email: user.email } });
        if (!profile) {
          profile = await prisma.profile.create({
            data: {
              authUserId: user.email,
              fullName: user.name ?? user.email,
              email: user.email,
              role: "student",
            },
          });
        }
        token.id = profile.id;
        token.role = profile.role;
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "student";
      }
      return token;
    },
  },
});
