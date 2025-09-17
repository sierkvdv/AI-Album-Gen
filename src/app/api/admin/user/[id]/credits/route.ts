import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { LedgerType } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = params.id;
  const { amount } = await req.json();
  const delta = Number.parseInt(String(amount), 10);

  if (!Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: delta } },
    });

    await tx.creditLedger.create({
      data: {
        userId,
        type: delta > 0 ? LedgerType.GRANT : LedgerType.USE,
        amount: Math.abs(delta),
        reference: 'admin_adjust',
      },
    });

    return user;
  });

  return NextResponse.json({ user: updatedUser });
}
