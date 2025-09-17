import { NextResponse } from "next/server";

/**
 * Simple test endpoint to verify the app is working.
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "App is working",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Error in test endpoint",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
