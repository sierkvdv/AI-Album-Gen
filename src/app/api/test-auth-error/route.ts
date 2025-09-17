import { NextResponse } from "next/server";

/**
 * Test endpoint to debug Auth.js errors.
 */
export async function GET() {
  try {
    // Test if we can import and create the handlers
    let handlersTest;
    try {
      const { handlers } = await import("@/auth-final");
      handlersTest = {
        success: true,
        hasGET: !!handlers.GET,
        hasPOST: !!handlers.POST,
      };
    } catch (error) {
      handlersTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    // Test environment variables
    const env = {
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    };

    return NextResponse.json({
      success: true,
      handlersTest,
      environment: env,
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
