import { NextResponse } from "next/server";

/**
 * Test endpoint to verify Google OAuth configuration.
 */
export async function GET() {
  try {
    const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
    const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
    const AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST;

    // Check if Google OAuth credentials look valid
    const googleIdValid = AUTH_GOOGLE_ID && AUTH_GOOGLE_ID.length > 50 && AUTH_GOOGLE_ID.includes('.googleusercontent.com');
    const googleSecretValid = AUTH_GOOGLE_SECRET && AUTH_GOOGLE_SECRET.length > 20;

    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      auth: {
        hasSecret: !!AUTH_SECRET,
        secretLength: AUTH_SECRET?.length || 0,
        hasGoogleId: !!AUTH_GOOGLE_ID,
        googleIdValid,
        googleIdPreview: AUTH_GOOGLE_ID ? `${AUTH_GOOGLE_ID.substring(0, 20)}...` : 'missing',
        hasGoogleSecret: !!AUTH_GOOGLE_SECRET,
        googleSecretValid,
        googleSecretPreview: AUTH_GOOGLE_SECRET ? `${AUTH_GOOGLE_SECRET.substring(0, 10)}...` : 'missing',
        hasNextAuthUrl: !!NEXTAUTH_URL,
        nextAuthUrl: NEXTAUTH_URL,
        authTrustHost: AUTH_TRUST_HOST,
      },
      recommendations: {
        secret: AUTH_SECRET ? '✅ Secret is set' : '❌ AUTH_SECRET or NEXTAUTH_SECRET is missing',
        googleId: googleIdValid ? '✅ Google ID looks valid' : '❌ Google ID is missing or invalid format',
        googleSecret: googleSecretValid ? '✅ Google Secret looks valid' : '❌ Google Secret is missing or too short',
        nextAuthUrl: NEXTAUTH_URL ? '✅ NEXTAUTH_URL is set' : '⚠️ NEXTAUTH_URL not set (may be auto-detected)',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Error in test endpoint",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
