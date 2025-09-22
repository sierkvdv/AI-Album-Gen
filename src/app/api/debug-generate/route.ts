import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/debug-generate
 * 
 * Debug endpoint to test each step of the generation process
 */
export async function POST(request: Request) {
  try {
    console.log('Debug Generate API: Starting request');
    
    const session = await getServerSession(authOptions);
    console.log('Debug Generate API: Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ 
        step: 'authentication',
        error: "Not authenticated",
        session: session ? 'Partial session' : 'No session'
      }, { status: 401 });
    }

    const body = await request.json();
    console.log('Debug Generate API: Request body:', body);
    
    const { prompt, styleId, aspectRatioId } = body;
    
    if (!prompt || typeof prompt !== "string" || !styleId || typeof styleId !== "string") {
      return NextResponse.json({ 
        step: 'validation',
        error: "Invalid request body",
        received: { prompt: typeof prompt, styleId: typeof styleId, aspectRatioId: typeof aspectRatioId }
      }, { status: 400 });
    }

    // Test style presets import
    try {
      const { stylePresets } = await import("@/lib/stylePresets");
      const preset = stylePresets.find((p: any) => p.id === styleId);
      if (!preset) {
        return NextResponse.json({ 
          step: 'style_preset',
          error: "Invalid style preset",
          styleId,
          availablePresets: stylePresets.map((p: any) => p.id)
        }, { status: 400 });
      }
      console.log('Debug Generate API: Style preset found:', preset.name);
    } catch (error) {
      return NextResponse.json({ 
        step: 'style_preset_import',
        error: "Failed to import style presets",
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Test aspect ratios import
    try {
      const { aspectRatios } = await import("@/lib/aspectRatios");
      const aspectRatio = aspectRatios.find((r: any) => r.id === aspectRatioId) || aspectRatios[0];
      console.log('Debug Generate API: Aspect ratio found:', aspectRatio.name);
    } catch (error) {
      return NextResponse.json({ 
        step: 'aspect_ratio_import',
        error: "Failed to import aspect ratios",
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Test database connection
    try {
      const db = prisma();
      console.log('Debug Generate API: Database connection successful');
      
      const user = await db.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, credits: true },
      });
      
      if (!user) {
        return NextResponse.json({ 
          step: 'user_lookup',
          error: "User not found",
          email: session.user.email
        }, { status: 404 });
      }
      
      if (user.credits <= 0) {
        return NextResponse.json({ 
          step: 'credits_check',
          error: "Out of credits",
          credits: user.credits
        }, { status: 403 });
      }
      
      console.log('Debug Generate API: User found with credits:', user.credits);
    } catch (error) {
      return NextResponse.json({ 
        step: 'database',
        error: "Database error",
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Test AI import
    try {
      const { generateAlbumCover } = await import("@/lib/ai");
      console.log('Debug Generate API: AI import successful');
    } catch (error) {
      return NextResponse.json({ 
        step: 'ai_import',
        error: "Failed to import AI helper",
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "All checks passed - generation should work",
      user: { id: session.user.id, email: session.user.email }
    });
    
  } catch (error) {
    console.error('Debug Generate API: Unexpected error:', error);
    return NextResponse.json({ 
      step: 'unexpected',
      error: "Unexpected error",
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
