import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { credits } = await req.json();
  const numCredits = parseInt(credits, 10);
  if (!numCredits || numCredits <= 0) {
    return NextResponse.json({ error: 'Invalid credit quantity' }, { status: 400 });
  }
  try {
    const sessionId = await createCheckoutSession(session.user.id, numCredits);
    return NextResponse.json({ sessionId });
  } catch (error: any) {
    console.error('Stripe checkout error', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}