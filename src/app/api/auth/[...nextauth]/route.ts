import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Force the correct production URL
if (process.env.NODE_ENV === "production") {
  delete process.env.NEXTAUTH_URL;
  delete process.env.VERCEL_URL;
  process.env.NEXTAUTH_URL = "https://ai-album-gen.vercel.app";
  process.env.VERCEL_URL = "ai-album-gen.vercel.app";
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
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],
  trustHost: true,
  debug: true,
});

export const { GET, POST } = handlers;