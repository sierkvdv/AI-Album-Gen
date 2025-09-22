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

    if (!generationId || !project) {
      return NextResponse.json({ error: "Missing generationId or project data" }, { status: 400 });
    }

    const db = prisma();
    
    // Verify the generation exists and belongs to the user
    const generation = await db.generation.findUnique({
      where: { 
        id: generationId,
        userId: session.user.id
      },
      select: { id: true, imageUrl: true }
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // Create the project
    const newProject = await db.project.create({
      data: {
        id: project.id,
        userId: session.user.id,
        generationId: generationId,
        baseAssetUrl: project.baseAssetUrl,
        baseWidth: project.baseWidth,
        baseHeight: project.baseHeight,
        crop: project.crop,
        filters: project.filters,
        layers: project.layers
      }
    });

    console.log('Projects API: Created project:', newProject.id);

    return NextResponse.json({ 
      success: true,
      project: {
        ...project,
        id: newProject.id
      }
    });

  } catch (error) {
    console.error('Projects API: Error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}