import { NextRequest, NextResponse } from 'next/server';

/**
 * Ultra simple database test without Prisma
 */
export async function GET(req: NextRequest) {
  try {
    // Just return environment info
    return NextResponse.json({ 
      success: true,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      timestamp: new Date().toISOString(),
      message: 'Environment variables are loaded'
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
