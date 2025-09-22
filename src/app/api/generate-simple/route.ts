import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateAlbumCover } from "@/lib/ai";

/**
 * POST /api/generate-simple
 * 
 * Simplified generate endpoint that bypasses Prisma schema issues
 */
export async function POST(request: Request) {
  try {
    console.log('Generate Simple API: Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      console.log('Generate Simple API: Not authenticated');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { prompt, styleId } = await request.json();
    console.log('Generate Simple API: Request data:', { prompt, styleId });
    
    if (!prompt || typeof prompt !== "string" || !styleId || typeof styleId !== "string") {
      console.log('Generate Simple API: Invalid request body');
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Import style presets
    const { stylePresets } = await import("@/lib/stylePresets");
    const preset = stylePresets.find((p: any) => p.id === styleId);
    if (!preset) {
      console.log('Generate Simple API: Invalid style preset:', styleId);
      return NextResponse.json({ error: "Invalid style preset" }, { status: 400 });
    }

    // Check user credits using raw SQL
    console.log('Generate Simple API: Checking user credits');
    const db = prisma();
    
    const userResult = await db.$queryRaw`
      SELECT id, credits FROM "User" WHERE email = ${session.user.email!}
    ` as any[];
    
    if (!userResult || userResult.length === 0 || userResult[0].credits <= 0) {
      console.log('Generate Simple API: Out of credits');
      return NextResponse.json({ error: "Out of credits" }, { status: 403 });
    }
    
    const userId = userResult[0].id;
    const currentCredits = userResult[0].credits;

    // Generate the image
    console.log('Generate Simple API: Generating image');
    const styleDescriptor = preset.styleDescriptor;
    const imageUrl = await generateAlbumCover(prompt, styleDescriptor, userId, 1024, 1024);
    console.log('Generate Simple API: Image generated:', imageUrl);

    // Save to database using raw SQL
    console.log('Generate Simple API: Saving to database');
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ledgerId = `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert generation
    await db.$executeRaw`
      INSERT INTO "Generation" ("id", "userId", "prompt", "style", "imageUrl", "createdAt")
      VALUES (${generationId}, ${userId}, ${prompt}, ${preset.name}, ${imageUrl}, NOW())
    `;
    
    // Update user credits
    await db.$executeRaw`
      UPDATE "User" 
      SET "credits" = ${currentCredits - 1}, "updatedAt" = NOW()
      WHERE "id" = ${userId}
    `;
    
    // Insert credit ledger entry
    await db.$executeRaw`
      INSERT INTO "CreditLedger" ("id", "userId", "type", "amount", "reference", "createdAt")
      VALUES (${ledgerId}, ${userId}, 'USE', 1, 'generate', NOW())
    `;

    console.log('Generate Simple API: Success');
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      generationId,
      creditsRemaining: currentCredits - 1
    });
  } catch (error) {
    console.error('Generate Simple API: Error:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

