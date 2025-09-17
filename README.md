# AI Album Cover Generator

The AI Album Cover Generator is a full‑stack SaaS web application that allows users to
create beautiful album covers using artificial intelligence. Built with **Auth.js v5**,
the application provides secure authentication, credit management, and AI-powered
image generation. Users receive free credits when they sign up and can purchase
additional credits via Stripe.

## Features

- **Modern Authentication**: Built with **Auth.js v5** supporting Google OAuth
  and development credentials provider. Secure JWT-based sessions with automatic
  user creation and credit allocation.
- **Credits System**: One credit equals one image generation. Credits are
  tracked in a secure ledger with full audit trail. Users can purchase extra
  credits via Stripe Checkout with webhook-based processing.
- **AI Image Generation**: Generate square 1024×1024 album covers using
  OpenAI's DALL·E API or placeholder images for development. Users provide
  a freeform prompt and select from predefined style presets.
- **Responsive Dashboard**: View remaining credits, generate new covers, and
  browse generation history. Clean, modern UI built with Tailwind CSS.
- **Admin Panel**: Search users, adjust credits, and inspect generations.
  Protected routes accessible only to users with `isAdmin` flag.
- **Development-Friendly**: Mock AI generation for local development without
  API keys. Comprehensive environment variable configuration.
- **Production-Ready**: Vercel-optimized with canonical host redirects,
  secure cookie handling, and proper middleware configuration.

## Project Structure

```
ai-album-cover/
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── page.tsx        # Home page with Auth.js v5 sign-in
│   │   ├── layout.tsx      # Root layout with SessionProvider
│   │   ├── dashboard/      # User dashboard (protected)
│   │   │   └── page.tsx
│   │   ├── admin/          # Admin panel (protected)
│   │   │   └── page.tsx
│   │   └── api/            # Serverless API endpoints
│   │       ├── auth/[...nextauth]/route.ts  # Auth.js v5 handlers
│   │       ├── user/route.ts                # Returns current user
│   │       ├── user/generations/route.ts    # Lists user generations
│   │       ├── generate/route.ts            # AI generation with Auth.js v5
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts        # Creates Stripe checkout session
│   │       │   └── webhook/route.ts         # Handles Stripe webhooks
│   │       └── admin/
│   │           ├── users/route.ts           # Lists all users (admin)
│   │           └── user/[id]/credits/route.ts# Adjusts user credits (admin)
│   ├── components/          # React components
│   │   └── Providers.tsx    # SessionProvider wrapper
│   ├── lib/
│   │   ├── prisma.ts        # Singleton Prisma client
│   │   ├── stripe.ts        # Stripe helper functions
│   │   ├── ai.ts            # AI generator with mock support
│   │   └── stylePresets.ts  # Predefined style presets
│   ├── auth.ts              # Auth.js v5 configuration
│   └── middleware.ts        # Canonical host redirects
├── prisma/
│   └── schema.prisma        # Database schema
├── public/
│   └── placeholder_light_gray_block.png  # Mock image for development
├── .env.example             # Auth.js v5 environment variables
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

   **Authentication (Required):**
   - `AUTH_SECRET`: A strong random string for JWT signing. Generate with `openssl rand -base64 32`.
   - `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`: Google OAuth credentials from Google Cloud Console.
   - `AUTH_TRUST_HOST=true`: Required for Vercel deployments.

   **Database:**
   - `DATABASE_URL`: Connection string for your database (SQLite for local development).

   **Development (Optional):**
   - `MOCK_OPENAI=true`: Use placeholder images instead of OpenAI API.
   - `TEST_PASSWORD`: Password for development credentials provider.

   **Production:**
   - `OPENAI_API_KEY`: Your OpenAI API key for DALL·E image generation.
   - `CANONICAL_HOST`: Canonical hostname for redirects (e.g., `ai-album-gen.vercel.app`).
   - Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`).

3. **Database setup**

   Run Prisma to create the SQLite database and generate the client:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

   This will create a local SQLite file (`dev.db`). If you use another
   database (PostgreSQL, MySQL, etc.) update the `DATABASE_URL` accordingly.

4. **Configure Google OAuth**

   To enable Google sign-in:

   a. Go to the [Google Cloud Console](https://console.cloud.google.com/).
   
   b. Create a new project or select an existing one.
   
   c. Enable the Google+ API.
   
   d. Go to "Credentials" and create OAuth 2.0 Client IDs:
      - **Application type**: Web application
      - **Authorized redirect URIs**: 
        - `http://localhost:3000/api/auth/callback/google` (for local development)
        - `https://your-domain.vercel.app/api/auth/callback/google` (for production)
        - `https://your-preview-domain.vercel.app/api/auth/callback/google` (for preview deployments)
   
   e. Copy the Client ID and Client Secret to your `.env.local` file.

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The app should now be running at `http://localhost:3000`.

6. **Test the application**

   - Sign in using Google OAuth or the development credentials provider.
   - You should be granted 5 free credits automatically.
   - Enter a prompt and select a style preset on the dashboard.
   - The AI will generate an image (or placeholder in development mode).
   - Credits are automatically deducted and tracked in the ledger.

## Credit Management System

The application features a comprehensive credit system with full audit trail:

### **Automatic Credit Allocation**
- New users receive **5 free credits** upon first sign-in
- Credits are automatically granted via the `createUser` event in Auth.js
- All credit transactions are logged in the `creditLedger` table

### **Credit Usage**
- Each image generation costs **1 credit**
- Credits are deducted immediately when generation starts
- Failed generations do not consume credits (error handling in place)

### **Credit Purchase via Stripe**
- Users can purchase additional credits through Stripe Checkout
- Webhook-based processing ensures reliable credit allocation
- All purchases are recorded in the credit ledger

### **Admin Credit Management**
- Administrators can manually adjust user credits
- All manual adjustments are logged with reference information
- Credit ledger provides complete audit trail of all transactions

### **Credit Ledger Types**
- `GRANT`: Free credits given to new users
- `USE`: Credits consumed for image generation
- `PURCHASE`: Credits purchased via Stripe
- `ADJUSTMENT`: Manual credit adjustments by admins

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

1. **Push to GitHub**
   Push this repository to GitHub or another Git provider.

2. **Create Vercel Project**
   Create a new Vercel project from your repository. During setup, provide all environment variables from `.env.local` in the Vercel UI.

3. **Configure Auth.js Environment Variables**
   Set these Auth.js v5 specific variables in Vercel:
   - `AUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `AUTH_TRUST_HOST=true`: Required for Vercel deployments
   - `CANONICAL_HOST=your-domain.vercel.app`: For canonical redirects

4. **Update Google OAuth Settings**
   Add your Vercel domain to Google OAuth redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
   - `https://your-preview-domain.vercel.app/api/auth/callback/google`

5. **Configure Stripe Webhook**
   Add the Stripe webhook URL in your Stripe dashboard pointing to:
   `https://your-vercel-app.vercel.app/api/stripe/webhook`
   
   Use the generated webhook secret as `STRIPE_WEBHOOK_SECRET`.

6. **Test Deployment**
   - Visit your deployed app and test Google OAuth sign-in
   - Verify credit allocation works correctly
   - Test image generation (ensure `MOCK_OPENAI=false` in production)

## Security Considerations

- **Environment Variables**: All secrets (AUTH_SECRET, OpenAI key, Stripe key) must be stored in environment variables and **never** exposed to the client.
- **JWT Security**: Auth.js v5 uses secure JWT tokens with proper signing and validation.
- **Credit Audit Trail**: The credit ledger provides complete audit trail of all credit changes. Never modify user credits without recording a ledger entry.
- **Webhook Security**: Stripe webhook signature verification ensures only genuine events can modify user credits.
- **Admin Protection**: Admin routes are protected - only users with `isAdmin = true` can access admin functionality.
- **Canonical Host**: Middleware enforces canonical host redirects to prevent cookie domain issues.

## Auth.js v5 Features

This application leverages the latest Auth.js v5 features:

- **Modern Configuration**: Centralized auth configuration in `src/auth.ts`
- **JWT Sessions**: Fast, stateless sessions with embedded user data
- **Provider Flexibility**: Google OAuth for production, credentials provider for development
- **Event-Driven**: Automatic user creation and credit allocation via events
- **Middleware Integration**: Secure cookie handling and canonical host enforcement
- **TypeScript Support**: Full type safety with proper session and user typing

## Extending the App

- **Additional Providers**: Add more OAuth providers (GitHub, Discord, etc.) in `src/auth.ts`
- **Style Presets**: Add more style presets in `src/lib/stylePresets.ts`
- **AI Providers**: Replace OpenAI with other providers (Stability AI, Midjourney API) in `src/lib/ai.ts`
- **Cloud Storage**: Integrate S3 or Cloudinary for persistent image storage
- **Email Notifications**: Use Auth.js events to trigger welcome emails
- **Advanced Credit Logic**: Implement credit expiration, bonus credits, or subscription models
- **Analytics**: Add user generation analytics and usage tracking

## License

This project is provided as‑is for educational purposes.