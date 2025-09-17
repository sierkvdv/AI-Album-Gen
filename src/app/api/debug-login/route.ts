import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export async function GET() {
  try {
    // Test if we can create the NextAuth instance without errors
    const testAuth = NextAuth({
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      providers: [
        GoogleProvider({
          clientId: process.env.AUTH_GOOGLE_ID || "",
          clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
        }),
      ],
      session: {
        strategy: "jwt",
      },
      trustHost: true,
      debug: true,
    });

    return NextResponse.json({
      success: true,
      message: "NextAuth instance created successfully",
      environment: {
        hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
        hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
        hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
        googleIdPreview: process.env.AUTH_GOOGLE_ID ? `${process.env.AUTH_GOOGLE_ID.substring(0, 20)}...` : 'missing',
        googleSecretPreview: process.env.AUTH_GOOGLE_SECRET ? `${process.env.AUTH_GOOGLE_SECRET.substring(0, 10)}...` : 'missing',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
