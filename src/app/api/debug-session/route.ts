import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug-session
 * 
 * Debug endpoint to check session and user data
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: "No session found",
        session: null
      });
    }

    console.log('Debug Session: Session data:', {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name
    });

    const db = prisma();
    
    // Find user by email
    const userByEmail = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, email: true, name: true, credits: true }
    });

    // Find user by ID (if different)
    const userById = session.user.id ? await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, credits: true }
    }) : null;

    // Get all generations for this user
    const generations = await db.generation.findMany({
      where: { 
        OR: [
          { userId: session.user.id },
          { userId: userByEmail?.id }
        ]
      },
      select: { 
        id: true, 
        userId: true, 
        prompt: true, 
        imageUrl: true, 
        createdAt: true 
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({ 
      success: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      userByEmail,
      userById,
      generations,
      message: "Session debug data retrieved"
    });

  } catch (error) {
    console.error('Debug Session: Error:', error);
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
