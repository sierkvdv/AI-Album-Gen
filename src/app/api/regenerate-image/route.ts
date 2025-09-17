import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { generateAlbumCover } from '@/lib/ai';
import { LedgerType } from '@prisma/client';

/**
 * Regenerate an expired image for a user
 * This allows users to get a fresh image URL without losing their generation history
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { generationId } = await req.json();
  
  if (!generationId) {
    return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
  }

  try {
    const db = prisma();
    
    // Find user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the generation
    const generation = await db.generation.findFirst({
      where: { 
        id: generationId,
        userId: user.id 
      },
    });
    
    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Check if user has enough credits for regeneration
    if (user.credits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits for regeneration' }, { status: 403 });
    }

    // Generate new image URL
    const styleDescriptor = `${generation.style}`;
    const newImageUrl = await generateAlbumCover(generation.prompt, styleDescriptor);

    // Update the generation with new image URL and decrement credits
    await db.$transaction(async (tx) => {
      await tx.generation.update({
        where: { id: generationId },
        data: { 
          imageUrl: newImageUrl
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      });

      await tx.creditLedger.create({
        data: {
          userId: user.id,
          type: LedgerType.USE,
          amount: 1,
          reference: `regenerate_${generationId}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Image regenerated successfully',
      newImageUrl,
      remainingCredits: user.credits - 1
    });

  } catch (error) {
    console.error('Image regeneration error:', error);
    return NextResponse.json({ 
      error: 'Failed to regenerate image',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
