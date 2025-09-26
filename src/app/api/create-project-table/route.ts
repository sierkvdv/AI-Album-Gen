import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/create-project-table
 * 
 * Create the Project table in the database that Prisma is actually using
 */
export async function POST(req: NextRequest) {
  try {
    const db = prisma();
    
    // Create Project table using raw SQL
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Project" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "generationId" TEXT NOT NULL,
        "baseAssetUrl" TEXT NOT NULL,
        "baseWidth" INTEGER NOT NULL,
        "baseHeight" INTEGER NOT NULL,
        "crop" JSONB NOT NULL,
        "filters" JSONB NOT NULL,
        "layers" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add foreign key constraints
    try {
      await db.$executeRaw`
        ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      `;
    } catch (error) {
      console.log('UserId constraint already exists or failed:', error);
    }
    
    try {
      await db.$executeRaw`
        ALTER TABLE "Project" ADD CONSTRAINT "Project_generationId_fkey" 
        FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE
      `;
    } catch (error) {
      console.log('GenerationId constraint already exists or failed:', error);
    }
    
    // Verify the table was created
    const tableCheck = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Project'
    `;
    
    return NextResponse.json({ 
      success: true,
      message: "Project table created successfully",
      tableExists: Array.isArray(tableCheck) && tableCheck.length > 0,
      tableCheck
    });

  } catch (error) {
    console.error('Create Project Table: Error:', error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to create Project table",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
