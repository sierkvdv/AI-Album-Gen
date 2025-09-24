import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/image/[id]
 * 
 * Get download URL for a specific generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const generationId = params.id;
    console.log('Image API: Getting download URL for generation:', generationId);
    console.log('Image API: Session user ID:', session.user.id);
    console.log('Image API: Session user email:', session.user.email);

    const db = prisma();
    
    // First try to find the generation by ID only (for debugging)
    const generationById = await db.generation.findUnique({
      where: { id: generationId },
      select: { id: true, userId: true, imageUrl: true }
    });
    
    console.log('Image API: Generation found by ID:', generationById);
    
    if (!generationById) {
      console.log('Image API: Generation not found by ID:', generationId);
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }
    
    // Find the user by email to get the correct database user ID
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });
    
    if (!user) {
      console.log('Image API: User not found by email:', session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if user owns this generation using database user ID
    if (generationById.userId !== user.id) {
      console.log('Image API: User does not own this generation. Database User ID:', user.id, 'Generation user ID:', generationById.userId);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const generation = generationById;

    if (!generation) {
      console.log('Image API: Generation not found:', generationId);
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    console.log('Image API: Found generation with URL:', generation.imageUrl);

    // Return the image URL directly
    return NextResponse.json({ 
      url: generation.imageUrl,
      success: true 
    });

  } catch (error) {
    console.error('Image API: Error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}