import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const generations = await prisma.generation.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ generations });
}