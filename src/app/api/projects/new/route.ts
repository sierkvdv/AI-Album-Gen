import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

/**
 * POST /api/projects/new
 * 
 * Create a new project for a generation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { generationId, project } = await request.json();
    console.log('Projects API: Creating new project for generation:', generationId);
    console.log('Projects API: Received project data:', project);

    if (!generationId) {
      return NextResponse.json({ error: "Missing generationId" }, { status: 400 });
    }

    const db = prisma();
    
    // Find the user by email to get the correct database user ID
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });
    
    if (!user) {
      console.log('Projects API: User not found by email:', session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the generation exists and belongs to the user
    const generation = await db.generation.findUnique({
      where: { 
        id: generationId,
        userId: user.id // Use database user ID instead of session user ID
      },
      select: { id: true, imageUrl: true }
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // Create default project data if not provided
    const defaultProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`,
      baseAssetUrl: generation.imageUrl,
      baseWidth: 1024, // Default width
      baseHeight: 1024, // Default height
      crop: { x: 0, y: 0, width: 1, height: 1 }, // No crop
      filters: {}, // No filters
      layers: [] // No additional layers
    };

    // Decide project payload (client state if present, else defaults)
    const incoming = project ? {
      ...defaultProject,
      ...project,
    } : defaultProject;
    console.log('Projects API: Using project data:', incoming);

    // Single-active project per generation: upsert on (userId, generationId)
    const existing = await db.project.findFirst({
      where: { userId: user.id, generationId },
      orderBy: { updatedAt: 'desc' },
    });

    let persisted;
    if (existing) {
      persisted = await db.project.update({
        where: { id: existing.id },
        data: {
          baseAssetUrl: incoming.baseAssetUrl,
          baseWidth: incoming.baseWidth,
          baseHeight: incoming.baseHeight,
          crop: incoming.crop,
          filters: incoming.filters,
          layers: incoming.layers,
        }
      });

      // Clean up any other stray projects for the same generation
      await db.project.deleteMany({
        where: { generationId, userId: user.id, NOT: { id: existing.id } },
      });
    } else {
      persisted = await db.project.create({
        data: {
          id: incoming.id,
          userId: user.id,
          generationId,
          baseAssetUrl: incoming.baseAssetUrl,
          baseWidth: incoming.baseWidth,
          baseHeight: incoming.baseHeight,
          crop: incoming.crop,
          filters: incoming.filters,
          layers: incoming.layers,
        }
      });
    }

    console.log('Projects API: Persisted project:', persisted.id);

    return NextResponse.json({ success: true, project: { id: persisted.id } });

  } catch (error) {
    console.error('Projects API: Error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}