import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateAlbumCover } from "@/lib/ai";
import { LedgerType } from "@prisma/client";

/**
 * POST /api/generate
 *
 * Protected route to generate an AI album cover.  Requires a valid
 * authentication session and at least one credit.  Expects a JSON body
 * containing { prompt: string, styleId: string }.  Decrements credits
 * when a generation is successful.  Returns 401 when unauthenticated,
 * 403 when out of credits and 400 for invalid input.
 */
export async function POST(request: Request) {
  try {
    console.log('Generate API: Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      console.log('Generate API: Not authenticated');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { prompt, styleId, aspectRatioId } = await request.json();
    console.log('Generate API: Request data:', { prompt, styleId, aspectRatioId });
    
    if (!prompt || typeof prompt !== "string" || !styleId || typeof styleId !== "string") {
      console.log('Generate API: Invalid request body');
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Import style presets from the existing configuration
    const { stylePresets } = await import("@/lib/stylePresets");
    const preset = stylePresets.find((p: any) => p.id === styleId);
    if (!preset) {
      console.log('Generate API: Invalid style preset:', styleId);
      return NextResponse.json({ error: "Invalid style preset" }, { status: 400 });
    }

    // Check if the user has enough credits by email (more reliable than session ID)
    console.log('Generate API: Checking user credits');
    const db = prisma();
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, credits: true },
    });
    if (!user || user.credits <= 0) {
      console.log('Generate API: Out of credits');
      return NextResponse.json({ error: "Out of credits" }, { status: 403 });
    }
    const userId = user.id;

    // Generate the image using the AI helper.  In dev, this returns a placeholder.
    console.log('Generate API: Generating image');
    const styleDescriptor = preset.styleDescriptor;
    const imageUrl = await generateAlbumCover(prompt, styleDescriptor, userId, 1024, 1024);
    console.log('Generate API: Image generated:', imageUrl);

    // Persist the generation and decrement the user's credits in a transaction.
    console.log('Generate API: Saving to database');
    
    // Use raw SQL to avoid Prisma schema issues
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.$executeRaw`
      INSERT INTO "Generation" ("id", "userId", "prompt", "style", "imageUrl", "createdAt")
      VALUES (${generationId}, ${userId}, ${prompt}, ${preset.name}, ${imageUrl}, NOW())
    `;
    
    await db.$executeRaw`
      UPDATE "User" 
      SET "credits" = "credits" - 1, "updatedAt" = NOW()
      WHERE "id" = ${userId}
    `;
    
    await db.$executeRaw`
      INSERT INTO "CreditLedger" ("id", "userId", "type", "amount", "reference", "createdAt")
      VALUES (${`ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}, ${userId}, ${LedgerType.USE}, 1, 'generate', NOW())
    `;

    console.log('Generate API: Success');
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Generate API: Error:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
