import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Force override NEXTAUTH_URL to prevent localhost issues
if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
  delete process.env.NEXTAUTH_URL;
  // Force the correct production URL
  process.env.NEXTAUTH_URL = "https://ai-album-gen.vercel.app";
}

export const {
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
    async redirect({ url, baseUrl }) {
      // Force the correct production URL
      if (process.env.NODE_ENV === "production") {
        if (url.startsWith("/")) return `https://ai-album-gen.vercel.app${url}`;
        if (url.includes("ai-album-gen.vercel.app")) return url;
        return "https://ai-album-gen.vercel.app/dashboard";
      }
      // For development, use the original logic
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  trustHost: true,
  debug: true,
  // Add pages configuration to fix server configuration error
  pages: {
    signIn: "/",
    error: "/",
  },
  // Force new deployment to clear Vercel cache
});
