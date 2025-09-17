import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Force the correct production URL
if (process.env.NODE_ENV === "production") {
  delete process.env.NEXTAUTH_URL;
  delete process.env.VERCEL_URL;
  process.env.NEXTAUTH_URL = "https://ai-album-gen.vercel.app";
  process.env.VERCEL_URL = "ai-album-gen.vercel.app";
}

export const authOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  debug: true,
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
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };