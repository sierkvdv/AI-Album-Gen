import { NextResponse } from 'next/server';

export async function GET() {
  // Check both new and old environment variable names
  const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  
  return NextResponse.json({
    hasGoogleClientId: !!AUTH_GOOGLE_ID,
    hasGoogleClientSecret: !!AUTH_GOOGLE_SECRET,
    hasAuthSecret: !!AUTH_SECRET,
    hasTrustHost: !!process.env.AUTH_TRUST_HOST,
    canonicalHost: process.env.CANONICAL_HOST,
    nodeEnv: process.env.NODE_ENV,
    // Show which variables are being used
    usingNewVars: {
      authSecret: !!process.env.AUTH_SECRET,
      googleId: !!process.env.AUTH_GOOGLE_ID,
      googleSecret: !!process.env.AUTH_GOOGLE_SECRET,
    },
    usingOldVars: {
      authSecret: !!process.env.NEXTAUTH_SECRET,
      googleId: !!process.env.GOOGLE_CLIENT_ID,
      googleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    }
  });
}
