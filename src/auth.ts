import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { LedgerType } from "@prisma/client";

/**
 * Auth.js v5 configuration.
 *
 * This file centralizes all authentication configuration for the application.
 * It exports the helper methods (`auth`, `handlers`, `signIn`, `signOut`)
 * returned from the `NextAuth()` call. These helpers should be imported
 * throughout the codebase instead of using `getServerSession` or passing
 * `authOptions` around.
 *
 * The configuration defines:
 *  - Google OAuth provider for production sign‑in.
 *  - A Credentials provider that is only enabled in non‑production environments.
 *    This makes it possible to sign in during development and automated tests
 *    without hitting Google's OAuth flow. The credentials provider accepts
 *    a single "password" field and will sign in if it matches the `TEST_PASSWORD`
 *    environment variable. When signing in via this provider a user record is
 *    created or updated in the database on the fly.
 *  - Session strategy set to JWT with a 7‑day expiry.
 *  - A JWT callback that embeds the user id, credits and isAdmin flags into
 *    the token so they are available client and server side.
 *  - A session callback that surfaces the embedded fields on the session.user.
 *  - An events handler that grants new users exactly 5 credits on their first
 *    sign‑in. Credits are only granted once by checking if the user already
 *    has any credits before incrementing.
 *
 * Environment variables:
 *  - AUTH_SECRET: Required. Used to sign/encrypt cookies and JWTs.
 *  - AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET: Google OAuth client id/secret.
 *  - AUTH_TRUST_HOST: Set to "true" when deploying behind a proxy (e.g. Vercel).
 *  - TEST_PASSWORD: Password accepted by the credentials provider in dev/tests.
 */

// Environment variable fallbacks for backward compatibility
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

const providers: any[] = [
  GoogleProvider({
    clientId: AUTH_GOOGLE_ID!,
    clientSecret: AUTH_GOOGLE_SECRET!,
  }),
];

// Enable the Credentials provider only when not in production.
if (process.env.NODE_ENV !== "production") {
  providers.push(
    CredentialsProvider({
      id: "password",
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const provided = credentials?.password ?? "";
        // Require the TEST_PASSWORD env in development; fail otherwise.
        if (!process.env.TEST_PASSWORD || provided !== process.env.TEST_PASSWORD) {
          return null;
        }
        const email = "dev@test.com";
        // Find or create a dummy user record. Do not grant credits here; the
        // createUser event will handle credit assignment.
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: "Dev Tester" },
        });
        return { id: user.id, email: user.email, name: user.name };
      },
    })
  );
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      // When a user logs in, persist additional fields on the token.
      if (user) {
        token.id = user.id;
        // Look up credits and admin flag from the database.  Keep this logic in
        // the JWT callback so that the session remains in sync when credits are
        // updated.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id as string },
            select: { credits: true, isAdmin: true },
          });
          token.credits = dbUser?.credits ?? 0;
          token.isAdmin = dbUser?.isAdmin ?? false;
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error);
          token.credits = 0;
          token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        (session.user as any).id = token.id;
        (session.user as any).credits = token.credits;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Grant exactly 5 credits once on account creation. Guard against
      // double‑grants by checking if the user already has any credits.
      if (!user.id) {
        console.error('createUser event: user.id is undefined');
        return;
      }
      
      const userId = user.id;
      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({
            where: { id: userId },
            select: { credits: true },
          });
          if (!existing || existing.credits > 0) return;
          await tx.user.update({
            where: { id: userId },
            data: { credits: 5 },
          });
          await tx.creditLedger.create({
            data: {
              userId,
              type: LedgerType.GRANT,
              amount: 5,
              reference: "first_login_bonus",
            },
          });
        });
      } catch (error) {
        console.error('Error in createUser event:', error);
      }
    },
  },
  pages: {
    // Redirect unknown sign‑ins to the home page.
    signIn: "/",
    error: "/",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig);
