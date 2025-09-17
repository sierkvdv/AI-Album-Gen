import { NextResponse } from "next/server";

/**
 * Debug endpoint to test Auth.js configuration and catch errors.
 */
export async function GET() {
  try {
    // Test environment variables
    const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
    const AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

    // Test importing Auth.js
    let authConfig;
    try {
      const authModule = await import("@/auth");
      authConfig = {
        hasHandlers: !!authModule.handlers,
        hasAuth: !!authModule.auth,
        hasSignIn: !!authModule.signIn,
        hasSignOut: !!authModule.signOut,
      };
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to import auth module",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    // Test NextAuth import
    let nextAuthInfo;
    try {
      const NextAuth = (await import("next-auth")).default;
      nextAuthInfo = {
        hasNextAuth: !!NextAuth,
        version: "unknown", // NextAuth doesn't expose version easily
      };
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to import NextAuth",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      env: {
        hasSecret: !!AUTH_SECRET,
        hasGoogleId: !!AUTH_GOOGLE_ID,
        hasGoogleSecret: !!AUTH_GOOGLE_SECRET,
        secretLength: AUTH_SECRET?.length || 0,
        googleIdLength: AUTH_GOOGLE_ID?.length || 0,
        googleSecretLength: AUTH_GOOGLE_SECRET?.length || 0,
      },
      authConfig,
      nextAuthInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Unexpected error in debug endpoint",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
