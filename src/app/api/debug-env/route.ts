import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGoogleClientId: !!process.env.AUTH_GOOGLE_ID,
    hasGoogleClientSecret: !!process.env.AUTH_GOOGLE_SECRET,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasTrustHost: !!process.env.AUTH_TRUST_HOST,
    canonicalHost: process.env.CANONICAL_HOST,
    nodeEnv: process.env.NODE_ENV,
  });
}
