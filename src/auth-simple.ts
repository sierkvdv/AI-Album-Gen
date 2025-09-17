import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
        if (!process.env.TEST_PASSWORD || provided !== process.env.TEST_PASSWORD) {
          return null;
        }
        const email = "dev@test.com";
        return { id: "dev-user", email, name: "Dev Tester" };
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
  secret: AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.credits = 5; // Default credits for testing
        token.isAdmin = false;
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
  pages: {
    signIn: "/",
    error: "/",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig);
