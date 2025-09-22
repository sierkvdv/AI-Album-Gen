import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Force the correct production URL. When deploying to Vercel the env
// variables NEXTAUTH_URL and VERCEL_URL may be set automatically but are
// immutable. Reassign them here to ensure Auth.js uses the canonical host.
if (process.env.NODE_ENV === "production") {
  delete process.env.NEXTAUTH_URL;
  delete process.env.VERCEL_URL;
  process.env.NEXTAUTH_URL = "https://ai-album-gen.vercel.app";
  process.env.VERCEL_URL = "ai-album-gen.vercel.app";
}

// Exported Auth.js configuration. In development credentials may be
// incomplete but the providers must still be defined. Additional providers
// (e.g. GitHub) can be added here if needed.
export const authOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  debug: true,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        (token as any).id = user.id;
        // Store user data in token for session callback
        (token as any).email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user && token) {
        (session.user as any).id = (token as any).id;
        // Fetch fresh user data from database to get updated credits
        try {
          const { prisma } = await import('@/lib/prisma');
          const db = prisma();
          const user = await db.user.findUnique({
            where: { email: (token as any).email || session.user.email! },
            select: { credits: true, isAdmin: true }
          });
          if (user) {
            (session.user as any).credits = user.credits;
            (session.user as any).isAdmin = user.isAdmin;
          }
        } catch (error) {
          console.error('Error fetching user data in session:', error);
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Always redirect to dashboard after login
      if (url.startsWith("/")) return `${baseUrl}/dashboard`;
      else if (new URL(url).origin === baseUrl) return `${baseUrl}/dashboard`;
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };