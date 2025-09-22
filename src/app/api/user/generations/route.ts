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
    // Create fresh Prisma client for this request
    const db = prisma();
    
    // Find user in database by email
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const generations = await db.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        prompt: true,
        style: true,
        imageUrl: true,
        createdAt: true
      }
    });
    
    console.log('Found generations for user:', user.id, 'Count:', generations.length);
    console.log('Generations:', generations);
    
    return NextResponse.json({ generations });
  } catch (error) {
    console.error('Generations API error:', error);
    return NextResponse.json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}