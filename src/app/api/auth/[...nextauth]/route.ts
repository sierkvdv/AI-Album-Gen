import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Next.js route handler for NextAuth. It simply passes through the
// authOptions exported from our lib/auth module. This file is placed
// under the App Router API directory so that NextAuth can use the
// built-in Route Handlers feature introduced in Next.js 13.

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };