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

    const db = prisma();
    const generation = await db.generation.findUnique({
      where: { 
        id: generationId,
        userId: session.user.id // Ensure user can only access their own images
      },
      select: { imageUrl: true }
    });

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