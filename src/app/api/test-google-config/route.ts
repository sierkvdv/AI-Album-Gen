import { NextResponse } from "next/server";

/**
 * Test endpoint to check Google OAuth configuration.
 */
export async function GET() {
  try {
    const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
    const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    
    // Check if Google OAuth credentials look valid
    const googleIdValid = AUTH_GOOGLE_ID && AUTH_GOOGLE_ID.length > 50 && AUTH_GOOGLE_ID.includes('.googleusercontent.com');
    const googleSecretValid = AUTH_GOOGLE_SECRET && AUTH_GOOGLE_SECRET.length > 20;

    return NextResponse.json({
      success: true,
      googleOAuth: {
        hasClientId: !!AUTH_GOOGLE_ID,
        clientIdValid: googleIdValid,
        clientIdPreview: AUTH_GOOGLE_ID ? `${AUTH_GOOGLE_ID.substring(0, 20)}...` : 'missing',
        hasClientSecret: !!AUTH_GOOGLE_SECRET,
        clientSecretValid: googleSecretValid,
        clientSecretPreview: AUTH_GOOGLE_SECRET ? `${AUTH_GOOGLE_SECRET.substring(0, 10)}...` : 'missing',
      },
      recommendations: {
        clientId: googleIdValid ? '✅ Google Client ID looks valid' : '❌ Google Client ID is missing or invalid format',
        clientSecret: googleSecretValid ? '✅ Google Client Secret looks valid' : '❌ Google Client Secret is missing or too short',
        redirectUri: '⚠️ Check Google Cloud Console - Authorized redirect URIs should include: https://ai-album-gen.vercel.app/api/auth/callback/google',
      },
      googleCloudConsole: {
        step1: 'Go to Google Cloud Console',
        step2: 'Navigate to APIs & Services > Credentials',
        step3: 'Find your OAuth 2.0 Client ID',
        step4: 'Click Edit',
        step5: 'Add to Authorized redirect URIs: https://ai-album-gen.vercel.app/api/auth/callback/google',
        step6: 'Save changes',
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
