import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/projects/[id]
 * 
 * Get a specific project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const projectId = params.id;
    console.log('Projects API: Getting project:', projectId);

    const db = prisma();
    const project = await db.project.findUnique({
      where: { 
        id: projectId,
        userId: session.user.id // Ensure user can only access their own projects
      }
    });

    if (!project) {
      console.log('Projects API: Project not found:', projectId);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    console.log('Projects API: Found project:', project.id);

    return NextResponse.json({ 
      success: true,
      project: {
        id: project.id,
        baseAssetUrl: project.baseAssetUrl,
        baseWidth: project.baseWidth,
        baseHeight: project.baseHeight,
        crop: project.crop,
        filters: project.filters,
        layers: project.layers
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