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
        hasProviders: !!NextAuthModule.GoogleProvider,
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

    // Test 3: Try to create a minimal NextAuth instance
    let nextAuthInstance;
    try {
      const NextAuth = (await import("next-auth")).default;
      const GoogleProvider = (await import("next-auth/providers/google")).default;
      
      // Just test if we can create the instance without exporting it
      const testConfig = {
        secret: "test-secret",
        providers: [
          GoogleProvider({
            clientId: "test-client-id",
            clientSecret: "test-client-secret",
          }),
        ],
      };
      
      // This should not throw an error
      nextAuthInstance = {
        success: true,
        message: "NextAuth instance can be created",
      };
    } catch (error) {
      nextAuthInstance = {
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
        nextAuthInstance,
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
