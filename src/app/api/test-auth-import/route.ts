import { NextResponse } from "next/server";

/**
 * Test endpoint to verify Auth.js can be imported and configured.
 */
export async function GET() {
  try {
    // Test 1: Import NextAuth
    let nextAuthImport;
    try {
      const NextAuthModule = await import("next-auth");
      nextAuthImport = {
        success: true,
        hasDefault: !!NextAuthModule.default,
      };
    } catch (error) {
      nextAuthImport = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Test 2: Import our auth config
    let authConfigImport;
    try {
      const authModule = await import("@/auth-minimal");
      authConfigImport = {
        success: true,
        hasHandlers: !!authModule.handlers,
        hasAuth: !!authModule.auth,
        hasSignIn: !!authModule.signIn,
        hasSignOut: !!authModule.signOut,
      };
    } catch (error) {
      authConfigImport = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    return NextResponse.json({
      success: true,
      tests: {
        nextAuthImport,
        authConfigImport,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Unexpected error in test endpoint",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
