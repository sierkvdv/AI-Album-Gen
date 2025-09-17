import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        generations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found in database',
        sessionUser: session.user,
        email: session.user.email 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      user,
      sessionUser: session.user,
      totalGenerations: user.generations.length,
      generations: user.generations
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
      sessionUser: session.user
    }, { status: 500 });
  }
}
