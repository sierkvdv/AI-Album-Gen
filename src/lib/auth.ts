import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

// This file centralises the NextAuth configuration so it can be reused
// both in API route handlers and client-side when creating the session.

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    /**
     * When a session is created, expose additional fields on the session
     * object. This ensures that the client can display the current
     * credit balance and whether the user has admin privileges.
     */
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        session.user.credits = user.credits;
        session.user.isAdmin = user.isAdmin;
      }
      return session;
    },
  },
  events: {
    /**
     * Triggered when a new user is created. We use this hook to grant
     * an initial set of free credits (5 by default) and record the
     * transaction in the credit ledger. This ensures new users can
     * generate images without making a purchase.
     */
    async createUser(message) {
      const userId = message.user.id;
      const initialCredits = 5;
      await prisma.user.update({
        where: { id: userId },
        data: { credits: initialCredits },
      });
      await prisma.creditLedger.create({
        data: {
          userId,
          type: 'grant',
          amount: initialCredits,
          reference: 'signup',
        },
      });
    },
  },
  pages: {
    // Redirect unauthenticated users to the home page
    signIn: '/',
  },
};

// Augment the session type to include our custom fields. This allows TypeScript
// to be aware of session.user.id, session.user.credits, etc. The changes are
// global once imported in the app.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      credits: number;
      isAdmin: boolean;
    };
  }
  interface User {
    id: string;
    credits: number;
    isAdmin: boolean;
  }
}