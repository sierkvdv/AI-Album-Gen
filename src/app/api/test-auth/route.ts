import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          id: (session.user as any).id,
          name: session.user?.name,
          email: session.user?.email,
          credits: (session.user as any).credits
        }
      } : null,
      authConfig: {
        hasGoogleClientId: !!(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID),
        hasGoogleClientSecret: !!(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET),
        hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
        hasTrustHost: !!process.env.AUTH_TRUST_HOST
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Auth test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
