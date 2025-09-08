import Stripe from 'stripe';

// Initialize the Stripe client using the secret key from environment variables.
// Do not expose the secret key to the browser. All Stripe calls should
// originate from the backend.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
  typescript: true,
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';

/**
 * Helper to generate a Stripe Checkout Session for purchasing credits.
 *
 * @param userId The ID of the user making the purchase.
 * @param credits The number of credits being purchased.
 * @returns A promise that resolves with the session ID.
 */
export async function createCheckoutSession(userId: string, credits: number) {
  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error('STRIPE_PRICE_ID is not defined');
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: credits,
      },
    ],
    mode: 'payment',
    allow_promotion_codes: true,
    customer_email: undefined,
    metadata: {
      userId,
      credits: String(credits),
    },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
  });
  return session.id;
}