import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAlbumCover } from '@/lib/ai';
import { stylePresets } from '@/lib/stylePresets';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id as string;
  const { prompt, styleId } = await req.json();
  if (!prompt || !styleId) return NextResponse.json({ error: 'Missing prompt or style' }, { status: 400 });

  const preset = stylePresets.find((p) => p.id === styleId);
  if (!preset) return NextResponse.json({ error: 'Invalid style preset' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.credits <= 0) return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });

  try {
    const styleDescriptor = `${preset.genre}, ${preset.mood}, ${preset.colour}`;
    const imageUrl = await generateAlbumCover(prompt, styleDescriptor);

    const generation = await prisma.$transaction(async (tx) => {
      const gen = await tx.generation.create({
        data: { userId, prompt, style: preset.name, imageUrl },
      });
      await tx.user.update({ where: { id: userId }, data: { credits: { decrement: 1 } } });
      await tx.creditLedger.create({
        data: {
          userId,
          type: Prisma.LedgerType.USE,
          amount: 1,
          reference: gen.id,
        },
      });
      return gen;
    });

    return NextResponse.json({ generation });
  } catch (err) {
    console.error('Generate error', err);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
