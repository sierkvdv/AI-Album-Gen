import { NextResponse } from 'next/server';

export async function GET() {
  const debugInfo = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    auth: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    },
    urls: {
      currentDomain: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'localhost',
      expectedCallbackUrl: process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/api/auth/callback/google`
        : 'http://localhost:3000/api/auth/callback/google',
    }
  };

  return NextResponse.json(debugInfo, { status: 200 });
}
