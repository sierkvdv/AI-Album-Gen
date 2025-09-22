import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

<<<<<<< HEAD
// Force the correct production URL. When deploying to Vercel the env
// variables NEXTAUTH_URL and VERCEL_URL may be set automatically but are
// immutable. Reassign them here to ensure Auth.js uses the canonical host.
=======
// Force the correct production URL
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
if (process.env.NODE_ENV === "production") {
  delete process.env.NEXTAUTH_URL;
  delete process.env.VERCEL_URL;
  process.env.NEXTAUTH_URL = "https://ai-album-gen.vercel.app";
  process.env.VERCEL_URL = "ai-album-gen.vercel.app";
}

<<<<<<< HEAD
// Exported Auth.js configuration. In development credentials may be
// incomplete but the providers must still be defined. Additional providers
// (e.g. GitHub) can be added here if needed.
=======
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
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
<<<<<<< HEAD
          scope: "openid email profile",
        },
      },
=======
          scope: "openid email profile"
        }
      }
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  debug: true,
  callbacks: {
<<<<<<< HEAD
    async jwt({ token, user }: any) {
      if (user) {
        (token as any).id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user && token) {
        (session.user as any).id = (token as any).id;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
=======
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
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
      // Always redirect to dashboard after login
      if (url.startsWith("/")) return `${baseUrl}/dashboard`;
      else if (new URL(url).origin === baseUrl) return `${baseUrl}/dashboard`;
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };