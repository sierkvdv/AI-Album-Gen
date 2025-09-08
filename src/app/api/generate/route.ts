import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAlbumCover } from '@/lib/ai';
import { stylePresets } from '@/lib/stylePresets';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { prompt, styleId } = await req.json();
  if (!prompt || !styleId) {
    return NextResponse.json({ error: 'Missing prompt or style' }, { status: 400 });
  }
  // Find style preset
  const preset = stylePresets.find((p) => p.id === styleId);
  if (!preset) {
    return NextResponse.json({ error: 'Invalid style preset' }, { status: 400 });
  }
  // Check credits
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.credits <= 0) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
  }
  try {
    // Call AI provider to generate image
    const styleDescriptor = `${preset.genre}, ${preset.mood}, ${preset.colour}`;
    const imageUrl = await generateAlbumCover(prompt, styleDescriptor);
    // Save generation and update credits atomically
    const result = await prisma.$transaction(async (tx) => {
      const generation = await tx.generation.create({
        data: {
          userId,
          prompt,
          style: preset.name,
          imageUrl,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      });
      await tx.creditLedger.create({
        data: {
          userId,
          type: 'use',
          amount: -1,
          reference: generation.id,
        },
      });
      return generation;
    });
    return NextResponse.json({ generation: result });
  } catch (error: any) {
    console.error('Generate error', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}