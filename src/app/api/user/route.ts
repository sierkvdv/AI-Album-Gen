import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createPrismaClient } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    // Create fresh Prisma client for this request
    const prisma = createPrismaClient();
    
    // Find user in database by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('User API error:', error);
    // Return a more detailed error for debugging
    return NextResponse.json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}