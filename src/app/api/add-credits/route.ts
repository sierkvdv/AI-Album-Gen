import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { LedgerType } from '@prisma/client';

/**
 * Temporary endpoint to add credits to a user account
 * This is for testing purposes only
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount } = await req.json();
  const creditsToAdd = Number.parseInt(String(amount), 10);

  if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  try {
    const db = prisma();
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add credits in a transaction
    const updatedUser = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { credits: { increment: creditsToAdd } },
      });

      await tx.creditLedger.create({
        data: {
          userId: user.id,
          type: LedgerType.GRANT,
          amount: creditsToAdd,
          reference: 'manual_add',
        },
      });

      return updated;
    });

    return NextResponse.json({ 
      success: true,
      message: `Added ${creditsToAdd} credits to your account`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        credits: updatedUser.credits
      }
    });

  } catch (error) {
    console.error('Add credits error:', error);
    return NextResponse.json({ 
      error: 'Failed to add credits',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
