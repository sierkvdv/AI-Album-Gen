import { NextResponse } from "next/server";

/**
 * Test endpoint to check OAuth flow configuration.
 */
export async function GET() {
  try {
    const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
    const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    
    // Construct the callback URL that Auth.js expects
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    
    const expectedCallbackUrl = `${baseUrl}/api/auth/callback/google`;
    
    return NextResponse.json({
      success: true,
      oauthFlow: {
        currentUrl: baseUrl,
        expectedCallbackUrl,
        hasClientId: !!AUTH_GOOGLE_ID,
        hasClientSecret: !!AUTH_GOOGLE_SECRET,
        clientIdPreview: AUTH_GOOGLE_ID ? `${AUTH_GOOGLE_ID.substring(0, 20)}...` : 'missing',
        clientSecretPreview: AUTH_GOOGLE_SECRET ? `${AUTH_GOOGLE_SECRET.substring(0, 10)}...` : 'missing',
      },
      troubleshooting: {
        step1: "Check if the callback URL matches exactly in Google Cloud Console",
        step2: "Verify that the Google OAuth consent screen is configured",
        step3: "Check if the OAuth consent screen is in 'Testing' mode and your email is added to test users",
        step4: "Verify that the Google+ API is enabled in your Google Cloud project",
      },
      googleCloudConsole: {
        step1: "Go to Google Cloud Console",
        step2: "Navigate to APIs & Services > OAuth consent screen",
        step3: "Check if your app is in 'Testing' mode",
        step4: "If in Testing mode, add your email to 'Test users'",
        step5: "Go to APIs & Services > Library",
        step6: "Search for 'Google+ API' and enable it if not already enabled",
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
