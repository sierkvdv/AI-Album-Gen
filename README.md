# AI Album Cover Generator

The AI Album Cover Generator is a full‑stack SaaS web application that allows users to
create beautiful album covers using artificial intelligence. Users receive
free credits when they sign up and can purchase additional credits via
Stripe. The application features a clean dashboard for generating images,
managing credits and viewing previous generations. An admin panel lets
administrators search users, adjust credits and view data.

## Features

- **Authentication**: Sign in or sign up using email or Google. The first
  login automatically grants the user five free credits.
- **Credits system**: One credit equals one image generation. Credits are
  tracked in a secure ledger. Users can purchase extra credits via Stripe
  Checkout. Purchases are recorded via webhooks.
- **AI image generation**: Generate square 1024×1024 PNG album covers using
  OpenAI's image API. Users provide a freeform prompt and select a style
  preset (genre, mood and colour).
- **Dashboard**: View remaining credits, generate new covers and see the
  history of generated images. Download images directly from the dashboard.
- **Admin panel**: Search and view users, adjust their credits and inspect
  past generations. Only users with the `isAdmin` flag can access this page.
- **Cloud storage ready**: The code is prepared to store generated images in
  an S3 bucket if configured via environment variables.
- **Secure key handling**: All API keys and secrets are stored in
  environment variables and never exposed to the client.
- **Vercel ready**: Works out of the box on Vercel, including Next.js
  middleware, NextAuth and webhooks.

## Project Structure

```
ai-album-cover/
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── page.tsx        # Home page
│   │   ├── layout.tsx      # Root layout with SessionProvider
│   │   ├── dashboard/      # User dashboard (protected)
│   │   │   └── page.tsx
│   │   ├── admin/          # Admin panel (protected)
│   │   │   └── page.tsx
│   │   └── api/            # Serverless API endpoints
│   │       ├── auth/[...nextauth]/route.ts  # NextAuth handlers
│   │       ├── user/route.ts                # Returns current user
│   │       ├── user/generations/route.ts    # Lists user generations
│   │       ├── generate/route.ts            # Calls AI API and saves
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts        # Creates Stripe checkout session
│   │       │   └── webhook/route.ts         # Handles Stripe webhooks
│   │       └── admin/
│   │           ├── users/route.ts           # Lists all users (admin)
│   │           └── user/[id]/credits/route.ts# Adjusts user credits (admin)
│   ├── components/          # React components (extend as needed)
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── prisma.ts        # Prisma client helper
│   │   ├── stripe.ts        # Stripe helper functions
│   │   ├── ai.ts            # OpenAI image generator
│   │   └── stylePresets.ts  # Predefined style presets
│   └── app/globals.css      # Global Tailwind styles
├── prisma/
│   └── schema.prisma        # Database schema
├── .env.example             # Template for environment variables
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── README.md
```

## Getting Started Locally

1. **Install dependencies**

   ```bash
   cd ai-album-cover
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in all required values:

   - `NEXTAUTH_SECRET`: a random string used to sign cookies.
   - `NEXTAUTH_URL`: your site URL (e.g. `http://localhost:3000`).
   - `DATABASE_URL`: connection string for SQLite or your database.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: credentials from Google Cloud.
   - `OPENAI_API_KEY`: your OpenAI API key for generating images.
   - Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`).
   - Email server settings if using email sign‑in (`EMAIL_SERVER_HOST`, etc.).
   - Optional S3 credentials if you wish to upload images to S3 (`AWS_ACCESS_KEY_ID`, etc.).

3. **Database setup**

   Run Prisma to create the SQLite database and generate the client:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

   This will create a local SQLite file (`dev.db`). If you use another
   database (PostgreSQL, MySQL, etc.) update the `DATABASE_URL` accordingly.

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app should now be running at `http://localhost:3000`.

5. **Test image generation**

   Sign in using Google or email. You should be granted 5 free credits. Enter a
   prompt and select a style preset on the dashboard. The AI will
   generate an image and deduct one credit. You can purchase more
   credits via the “Buy Credits” button once you configure Stripe.

## Stripe Integration

1. Create a Stripe account and a product with a price representing one
   credit. Note the **Price ID** and assign it to the `STRIPE_PRICE_ID` environment variable.

2. Set your **Stripe secret key** in `STRIPE_SECRET_KEY`. The publishable
   key is optional for this server‑side implementation but may be used
   client‑side when embedding Stripe.js.

3. Create a webhook endpoint in your Stripe dashboard pointing to
   `/api/stripe/webhook` in your deployed app. Copy the webhook signing
   secret into `STRIPE_WEBHOOK_SECRET`.

4. When a user starts a checkout from the dashboard, the server
   creates a session with metadata (`userId` and `credits`). When the
   payment succeeds, the webhook is triggered and the server updates
   the user’s credit balance, creates a payment record and logs the
   transaction in the credit ledger.

## Deploying to Vercel

1. Push this repository to GitHub or another Git provider.

2. Create a new Vercel project from your repository. During setup,
   provide all environment variables from `.env.local` in the Vercel UI.

3. Add the Stripe webhook URL in your Stripe dashboard pointing to
   `https://your-vercel-app.vercel.app/api/stripe/webhook`. Use the
   generated webhook secret as `STRIPE_WEBHOOK_SECRET`.

4. After deployment, update the `NEXTAUTH_URL` environment variable in
   Vercel to match your deployment URL.

5. (Optional) Configure an S3 bucket and supply the AWS credentials to
   store generated images persistently. Otherwise, the app will use the
   image URL returned by OpenAI directly.

## Security Considerations

- All server secrets (OpenAI key, Stripe key, Prisma secret) must be
  stored in environment variables and **never** exposed to the client.
- The credit ledger provides an audit trail of all credit changes. Do not
  modify user credits without also recording a ledger entry.
- Webhook signature verification is implemented to ensure that only
  genuine Stripe events can modify user credits.
- Admin routes are protected: only users with `isAdmin = true` can
  access the admin page or admin API endpoints.

## Extending the App

- **Additional styles**: You can add more style presets in
  `src/lib/stylePresets.ts` to give users more variety.
- **Different AI providers**: Replace the implementation in `src/lib/ai.ts`
  to call other AI services like Stability AI. Ensure the API key is
  stored in environment variables.
- **Cloud storage**: Upload images to S3 or another provider in the
  `/api/generate` endpoint and save the URL. Update `src/lib/ai.ts`
  accordingly.
- **Email notifications**: Use the `events` callback in NextAuth to
  trigger welcome emails when users sign up.

## License

This project is provided as‑is for educational purposes.