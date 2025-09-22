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
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { prompt, styleId, aspectRatioId } = await request.json();
  if (!prompt || typeof prompt !== "string" || !styleId || typeof styleId !== "string" || !aspectRatioId || typeof aspectRatioId !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Import style presets and aspect ratios from the existing configuration
  const { stylePresets } = await import("@/lib/stylePresets");
  const { aspectRatios } = await import("@/lib/aspectRatios");
  const preset = stylePresets.find((p: any) => p.id === styleId);
  const aspectRatio = aspectRatios.find((r: any) => r.id === aspectRatioId);
  if (!preset) {
    return NextResponse.json({ error: "Invalid style preset" }, { status: 400 });
  }
  if (!aspectRatio) {
    return NextResponse.json({ error: "Invalid aspect ratio" }, { status: 400 });
  }

  // Check if the user has enough credits by email (more reliable than session ID)
  const db = prisma();
  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, credits: true },
  });
  if (!user || user.credits <= 0) {
    return NextResponse.json({ error: "Out of credits" }, { status: 403 });
  }
  const userId = user.id;

  // Generate the image using the AI helper.  In dev, this returns a placeholder.
  const styleDescriptor = preset.styleDescriptor;
  const imageUrl = await generateAlbumCover(prompt, styleDescriptor, userId, aspectRatio.width, aspectRatio.height);

  // Persist the generation and decrement the user's credits in a transaction.
  await db.$transaction(async (tx) => {
    await tx.generation.create({
      data: {
        userId,
        prompt,
        style: preset.name,
        imageUrl,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
    });
    await tx.creditLedger.create({
      data: {
        userId,
        type: LedgerType.USE,
        amount: 1,
        reference: "generate",
      },
    });
  });

  return NextResponse.json({ imageUrl });
}
