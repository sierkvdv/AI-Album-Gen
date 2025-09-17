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
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60 // Update session every 24 hours
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',

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
    // Zorgt dat iedere geslaagde login naar /dashboard gaat
    async redirect({ url, baseUrl }) {
      // Als er al een callbackUrl is, gebruik die
      if (url.includes('callbackUrl')) {
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        if (callbackUrl && callbackUrl.startsWith('/')) {
          return `${baseUrl}${callbackUrl}`;
        }
      }
      
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
