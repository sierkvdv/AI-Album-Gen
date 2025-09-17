import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
// import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { LedgerType } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // JWT sessions zijn betrouwbaarder dan database sessions
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/',
    error: '/',
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, token }) {
      if (session?.user && token) {
        (session.user as any).id = token.sub;
        // Haal user data op uit database voor credits en admin status
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { credits: true, isAdmin: true }
        });
        if (user) {
          (session.user as any).credits = user.credits;
          (session.user as any).isAdmin = user.isAdmin;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    // Zorgt dat iedere geslaagde login naar /dashboard gaat
    async redirect({ url, baseUrl }) {
      // Interne redirects blijven intern
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Extern naar hetzelfde domein is oké
      try { if (new URL(url).origin === baseUrl) return url; } catch {}
      // Anders altijd naar dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  events: {
    async createUser({ user }) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user.id }, data: { credits: 5 } });
        await tx.creditLedger.create({
          data: { userId: user.id, type: LedgerType.GRANT, amount: 5, reference: 'first_login_bonus' },
        });
      });
    },
  },
};
