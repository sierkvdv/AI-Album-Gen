import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { LedgerType } from '@prisma/client';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new NextResponse('Webhook secret not configured', { status: 500 });

  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig || '', webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const md = (session.metadata || {}) as Record<string, string>;
    const userId = md.userId;
    const credits = parseInt(md.credits || '0', 10);

    if (userId && credits > 0) {
      const amountTotal = Number(session.amount_total || 0);
      const currency = (session.currency || 'usd').toLowerCase();
      const stripeSessionId = String(session.id);

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { credits: { increment: credits } } }),
        prisma.payment.create({ data: { userId, stripeSessionId, credits, amount: amountTotal, currency } }),
        prisma.creditLedger.create({
          data: { userId, type: LedgerType.PURCHASE, amount: credits, reference: stripeSessionId },
        }),
      ]);
    }
  }

  return new NextResponse('Received', { status: 200 });
}
