import { NextResponse } from 'next/server';

/**
 * GET /api/test-projects
 * 
 * Test endpoint to verify projects API is working
 */
export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: "Projects API is working",
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /api/test-projects
 * 
 * Test endpoint to verify projects API POST is working
 */
export async function POST() {
  return NextResponse.json({ 
    success: true,
    message: "Projects API POST is working",
    timestamp: new Date().toISOString()
  });
}

