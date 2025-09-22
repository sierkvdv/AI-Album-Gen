import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    // Create fresh Prisma client for this request
    const db = prisma();
    
    // Find user in database by email
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    
    console.log('User API - Looking for user with email:', session.user.email);
    console.log('User API - Found user:', user ? { id: user.id, email: user.email, credits: user.credits } : 'null');
    
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