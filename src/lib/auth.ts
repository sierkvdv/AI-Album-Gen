import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
// import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { LedgerType } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: 'database', 
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  debug: true, // Always debug for now

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        (session.user as any).id = user.id;
        (session.user as any).credits = (user as any).credits;
        (session.user as any).isAdmin = (user as any).isAdmin;
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
