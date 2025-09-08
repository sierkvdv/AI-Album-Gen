import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Stripe requires the raw request body to validate the webhook signature. We
// explicitly disable Next.js's default body parsing by marking this route
// handler as an "edge" runtime compatible function and reading the body as
// text. If you deploy to Vercel or another serverless provider, make sure
// that the body is passed through unchanged.

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig || '',
      webhookSecret,
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return new NextResponse('Webhook Error', { status: 400 });
  }
  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const metadata = session.metadata as Record<string, string>;
    const userId = metadata?.userId;
    const creditsStr = metadata?.credits;
    const credits = parseInt(creditsStr || '0', 10);
    if (userId && credits > 0) {
      const amountTotal = session.amount_total as number;
      const currency = session.currency as string;
      const stripeSessionId = session.id;
      // Use a transaction to update user credits, ledger and payment record
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: credits } },
        }),
        prisma.payment.create({
          data: {
            userId,
            stripeSessionId,
            credits,
            amount: amountTotal ?? 0,
            currency: currency ?? 'usd',
          },
        }),
        prisma.creditLedger.create({
          data: {
            userId,
            type: 'purchase',
            amount: credits,
            reference: stripeSessionId,
          },
        }),
      ]);
    }
  }
  return new NextResponse('Received', { status: 200 });
}