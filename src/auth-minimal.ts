import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Environment variables with fallbacks
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

// Validate required environment variables
if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET environment variable is required");
}

if (!AUTH_GOOGLE_ID) {
  throw new Error("AUTH_GOOGLE_ID or GOOGLE_CLIENT_ID environment variable is required");
}

if (!AUTH_GOOGLE_SECRET) {
  throw new Error("AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET environment variable is required");
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: AUTH_GOOGLE_ID,
      clientSecret: AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  debug: true, // Always enable debug for troubleshooting
});
