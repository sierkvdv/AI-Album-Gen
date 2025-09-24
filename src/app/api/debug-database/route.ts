import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug-database
 * 
 * Debug endpoint to check database connection and tables
 */
export async function GET(req: NextRequest) {
  try {
    const db = prisma();
    
    // Test basic connection
    const connectionTest = await db.$queryRaw`SELECT 1 as test`;
    
    // Check if Project table exists
    const projectTableCheck = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Project'
    `;
    
    // Check all tables
    const allTables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    // Check environment variables (without exposing sensitive data)
    const envInfo = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      supabaseUrlLength: process.env.SUPABASE_URL?.length,
      databaseUrlLength: process.env.DATABASE_URL?.length,
      supabaseUrlPrefix: process.env.SUPABASE_URL?.substring(0, 20),
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20),
    };

    return NextResponse.json({ 
      success: true,
      connectionTest,
      projectTableExists: Array.isArray(projectTableCheck) && projectTableCheck.length > 0,
      projectTableCheck,
      allTables,
      environment: envInfo,
      message: "Database debug info retrieved"
    });

  } catch (error) {
    console.error('Debug Database: Error:', error);
    return NextResponse.json({ 
      success: false,
      error: "Database connection failed",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
