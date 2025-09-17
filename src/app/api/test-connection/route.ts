import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test 1: Basic Prisma client with pgbouncer settings
    const { PrismaClient } = await import('@prisma/client');
    
    // Modify DATABASE_URL to disable prepared statements for serverless
    const databaseUrl = process.env.DATABASE_URL;
    const modifiedUrl = databaseUrl?.includes('?') 
      ? `${databaseUrl}&pgbouncer=true&connection_limit=1`
      : `${databaseUrl}?pgbouncer=true&connection_limit=1`;
    
    const db = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: modifiedUrl,
        },
      },
    });

    // Test basic connection
    const userCount = await db.user.count();
    
    await db.$disconnect();

    return NextResponse.json({
      success: true,
      userCount,
      message: 'Database connection successful with pgbouncer=true',
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
        modifiedUrl: modifiedUrl ? 'Modified with pgbouncer=true' : 'Not modified',
      }
    });

  } catch (error: any) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      }
    }, { status: 500 });
  }
}
