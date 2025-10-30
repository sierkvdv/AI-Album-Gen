import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

type ExecResult = { step: string; ok: boolean; error?: string };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = !!session && (session.user as any)?.isAdmin;
  const confirmed = req.nextUrl.searchParams.get('confirm') === 'true';
  if (!isAdmin || !confirmed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = prisma();
  const results: ExecResult[] = [];
  async function exec(step: string, sql: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await db.$executeRawUnsafe(sql);
      results.push({ step, ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({ step, ok: false, error: message });
    }
  }

  // Core tables (idempotent)
  await exec('create_user', `
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT,
      "email" TEXT UNIQUE,
      "emailVerified" TIMESTAMP(3),
      "image" TEXT,
      "credits" INTEGER NOT NULL DEFAULT 0,
      "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec('create_account', `
    CREATE TABLE IF NOT EXISTS "Account" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec('unique_account_provider', `
    DO $$ BEGIN
      ALTER TABLE "Account" ADD CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId");
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  await exec('create_session', `
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT PRIMARY KEY,
      "sessionToken" TEXT UNIQUE NOT NULL,
      "userId" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec('create_verification_token', `
    CREATE TABLE IF NOT EXISTS "VerificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT UNIQUE NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec('create_generation', `
    CREATE TABLE IF NOT EXISTS "Generation" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "prompt" TEXT NOT NULL,
      "style" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec('create_payment', `
    CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "stripeSessionId" TEXT UNIQUE NOT NULL,
      "credits" INTEGER NOT NULL,
      "amount" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'usd',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec('create_credit_ledger', `
    CREATE TABLE IF NOT EXISTS "CreditLedger" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "reference" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec('create_project', `
    CREATE TABLE IF NOT EXISTS "Project" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "generationId" TEXT NOT NULL,
      "baseAssetUrl" TEXT NOT NULL,
      "baseWidth" INTEGER NOT NULL,
      "baseHeight" INTEGER NOT NULL,
      "crop" JSONB NOT NULL,
      "filters" JSONB NOT NULL,
      "layers" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // FKs
  await exec('fk_account_user', `
    DO $$ BEGIN
      ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await exec('fk_session_user', `
    DO $$ BEGIN
      ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await exec('fk_generation_user', `
    DO $$ BEGIN
      ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await exec('fk_project_user', `
    DO $$ BEGIN
      ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await exec('fk_project_generation', `
    DO $$ BEGIN
      ALTER TABLE "Project" ADD CONSTRAINT "Project_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await exec('fk_payment_user', `
    DO $$ BEGIN
      ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await exec('fk_creditledger_user', `
    DO $$ BEGIN
      ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  // Optional column backfills for Generation
  await exec('gen_aspect', `ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "aspectRatio" TEXT DEFAULT 'square';`);
  await exec('gen_width', `ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "width" INTEGER DEFAULT 1024;`);
  await exec('gen_height', `ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "height" INTEGER DEFAULT 1024;`);

  // Final state
  return NextResponse.json({ success: true, results });
}


