import { NextResponse } from "next/server";

/**
 * Test endpoint to check NEXTAUTH_URL configuration.
 */
export async function GET() {
  try {
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
    const AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST;
    const VERCEL_URL = process.env.VERCEL_URL;
    const VERCEL = process.env.VERCEL;
    
    // Get the current request URL
    const currentUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    return NextResponse.json({
      success: true,
      urls: {
        NEXTAUTH_URL,
        AUTH_TRUST_HOST,
        VERCEL_URL,
        VERCEL,
        currentUrl,
        isLocalhost: NEXTAUTH_URL?.includes("localhost"),
        isVercel: VERCEL === "1",
      },
      recommendations: {
        issue: NEXTAUTH_URL?.includes("localhost") && VERCEL === "1" 
          ? "❌ NEXTAUTH_URL is set to localhost in production - this causes 500 errors"
          : "✅ NEXTAUTH_URL configuration looks correct",
        solution: VERCEL === "1" 
          ? "Remove NEXTAUTH_URL environment variable in Vercel settings to let Auth.js auto-detect the URL"
          : "NEXTAUTH_URL is correctly configured for local development",
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
