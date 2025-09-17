import { NextResponse } from "next/server";
import { auth } from "@/auth";
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { prompt, styleId } = await request.json();
  if (!prompt || typeof prompt !== "string" || !styleId || typeof styleId !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Import style presets from the existing configuration
  const { stylePresets } = await import("@/lib/stylePresets");
  const preset = stylePresets.find((p: any) => p.id === styleId);
  if (!preset) {
    return NextResponse.json({ error: "Invalid style preset" }, { status: 400 });
  }

  // Check if the user has enough credits.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });
  if (!user || user.credits <= 0) {
    return NextResponse.json({ error: "Out of credits" }, { status: 403 });
  }

  // Generate the image using the AI helper.  In dev, this returns a placeholder.
  const imageUrl = await generateAlbumCover(prompt, preset.descriptor);

  // Persist the generation and decrement the user's credits in a transaction.
  await prisma.$transaction(async (tx) => {
    await tx.generation.create({
      data: {
        userId: session.user.id,
        prompt,
        styleId,
        imageUrl,
      },
    });
    await tx.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 1 } },
    });
    await tx.creditLedger.create({
      data: {
        userId: session.user.id,
        type: LedgerType.USE,
        amount: 1,
        reference: "generate",
      },
    });
  });

  return NextResponse.json({ imageUrl });
}
