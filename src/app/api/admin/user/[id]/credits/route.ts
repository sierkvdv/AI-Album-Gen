import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = params.id;
  const { amount } = await req.json();
  const delta = parseInt(amount, 10);
  if (!delta) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }
  // Update credits and record ledger
  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: delta } },
    });
    await tx.creditLedger.create({
      data: {
        userId,
        type: delta > 0 ? 'grant' : 'use',
        amount: delta,
        reference: 'admin_adjust',
      },
    });
    return user;
  });
  return NextResponse.json({ user: updatedUser });
}