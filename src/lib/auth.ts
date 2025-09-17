import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
// import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { LedgerType } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  // Geen adapter voor JWT sessions - we gebruiken alleen de database voor user data
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
        (session.user as any).credits = token.credits;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        // Haal user data op uit database bij eerste login
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true, isAdmin: true }
        });
        if (dbUser) {
          token.credits = dbUser.credits;
          token.isAdmin = dbUser.isAdmin;
        }
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
    async signIn({ user, account, profile }) {
      // Controleer of user al bestaat, zo niet maak hem aan
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!existingUser) {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              credits: 5,
            }
          });
          await tx.creditLedger.create({
            data: { userId: user.id, type: LedgerType.GRANT, amount: 5, reference: 'first_login_bonus' },
          });
        });
      }
    },
  },
};
