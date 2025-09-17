import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test 1: Basic Prisma client
    const { PrismaClient } = await import('@prisma/client');
    
    const db = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Test basic connection
    const userCount = await db.user.count();
    
    await db.$disconnect();

    return NextResponse.json({
      success: true,
      userCount,
      message: 'Database connection successful',
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
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
