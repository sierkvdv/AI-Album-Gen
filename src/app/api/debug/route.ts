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
    
    // Get user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        generations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!user) {
      // Try to find all users to see if database is working
      const allUsers = await db.user.findMany({
        select: { id: true, email: true, name: true }
      });
      
      return NextResponse.json({ 
        error: 'User not found in database',
        sessionUser: session.user,
        email: session.user.email,
        allUsers: allUsers,
        totalUsers: allUsers.length
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      user,
      sessionUser: session.user,
      totalGenerations: user.generations.length,
      generations: user.generations,
      databaseConnected: true
    });
  } catch (error) {
    console.error('Debug error:', error);
    
    // Try to get more info about the error
    let errorDetails = {
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
      sessionUser: session.user,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
