import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Simple database test route
 */
export async function GET(req: NextRequest) {
  try {
    // Create fresh Prisma client for this request
    const db = prisma();
    
    // Test basic database connection
    const userCount = await db.user.count();
    
    return NextResponse.json({ 
      success: true,
      userCount,
      databaseConnected: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      databaseConnected: false,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
