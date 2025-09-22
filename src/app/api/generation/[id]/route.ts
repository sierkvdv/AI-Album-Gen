import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * API handler to fetch a single generation by ID. Only the owner of the
 * generation may retrieve it. Returns a 401 if the user is not signed in
 * and a 404 if the generation does not exist or does not belong to the
 * current user.
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = prisma();
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const generation = await db.generation.findUnique({ where: { id: context.params.id } });
  if (!generation || generation.userId !== user.id) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
  }
  return NextResponse.json(generation);
}