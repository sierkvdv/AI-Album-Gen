import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Force the correct production URL
if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
  delete process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_URL = "https://ai-album-gen.vercel.app";
}

const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  trustHost: true,
  debug: true,
  pages: {
    signIn: "/",
    error: "/",
  },
});

export const { GET, POST } = handlers;