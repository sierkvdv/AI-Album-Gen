import { NextResponse } from "next/server";

/**
 * Basic test endpoint to verify Auth.js can be imported.
 */
export async function GET() {
  try {
    // Test 1: Import NextAuth
    let nextAuthTest;
    try {
      const NextAuth = (await import("next-auth")).default;
      nextAuthTest = {
        success: true,
        hasNextAuth: !!NextAuth,
      };
    } catch (error) {
      nextAuthTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Test 2: Import our auth config
    let authConfigTest;
    try {
      const authModule = await import("@/auth-working");
      authConfigTest = {
        success: true,
        hasHandlers: !!authModule.handlers,
        hasAuth: !!authModule.auth,
        hasSignIn: !!authModule.signIn,
        hasSignOut: !!authModule.signOut,
      };
    } catch (error) {
      authConfigTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    return NextResponse.json({
      success: true,
      tests: {
        nextAuthTest,
        authConfigTest,
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
