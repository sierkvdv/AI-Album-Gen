import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Configure the production URL for Auth.js using CANONICAL_HOST if provided.
// This avoids hardcoding a specific domain and works across Vercel previews
// and custom domains.
if (process.env.NODE_ENV === "production") {
  const canonical = process.env.CANONICAL_HOST;
  if (canonical) {
    const host = canonical.replace(/^https?:\/\//, "");
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;
    process.env.NEXTAUTH_URL = `https://${host}`;
    process.env.VERCEL_URL = host;
  }
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
          } else {
            (session.user as any).credits = 0;
            (session.user as any).isAdmin = false;
          }
        } catch (error) {
          console.error('Error fetching user data in session:', error);
          (session.user as any).credits = 0;
          (session.user as any).isAdmin = false;
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