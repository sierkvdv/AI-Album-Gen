import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to see all users and their generations
 * This is for debugging purposes only
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = prisma();
    
    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        createdAt: true,
        _count: {
          select: {
            generations: true
          }
        }
      }
    });

    // Get all generations
    const generations = await db.generation.findMany({
      select: {
        id: true,
        userId: true,
        prompt: true,
        style: true,
        aspectRatio: true,
        width: true,
        height: true,
        imageUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      currentUser: session.user.email,
      users,
      generations,
      totalUsers: users.length,
      totalGenerations: generations.length
    });

  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
