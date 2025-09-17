import { NextResponse } from 'next/server';
import { auth } from '@/auth-simple';

export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json({ 
      success: true,
      hasSession: !!session,
      session: session ? {
        user: {
          id: (session.user as any).id,
          name: session.user?.name,
          email: session.user?.email,
          credits: (session.user as any).credits
        }
      } : null,
      env: {
        hasSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
        hasGoogleId: !!(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID),
        hasGoogleSecret: !!(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET),
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
