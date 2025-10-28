import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { LedgerType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    // Create fresh Prisma client for this request
    const db = prisma();
    
    // Find user in database by email
    let user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    
    console.log('User API - Looking for user with email:', session.user.email);
    console.log('User API - Found user:', user ? { id: user.id, email: user.email, credits: user.credits } : 'null');
    
    if (!user) {
      // Auto-create user with initial credits so dashboard can load
      user = await db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: session.user!.email!,
            name: session.user?.name ?? null,
            image: session.user?.image ?? null,
            credits: 5,
          },
        });
        try {
          await tx.creditLedger.create({
            data: { userId: created.id, type: LedgerType.GRANT, amount: 5, reference: 'auto_create' },
          });
        } catch {}
        return created;
      });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('User API error:', error);
    // Return a more detailed error for debugging
    return NextResponse.json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}