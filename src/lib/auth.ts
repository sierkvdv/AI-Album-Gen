import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
// import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { LedgerType } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: 'jwt', 
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  debug: true, // Always debug for now
  useSecureCookies: process.env.NODE_ENV === 'production',

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Get user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true, isAdmin: true }
        });
        token.credits = dbUser?.credits || 0;
        token.isAdmin = dbUser?.isAdmin || false;
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
    async redirect({ url, baseUrl }) {
      // interne urls
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try { if (new URL(url).origin === baseUrl) return url; } catch {}
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
