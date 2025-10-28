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
    // Map session email -> database user id to avoid mixing external OAuth id
    const dbUser = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try by project id first
    let project = await db.project.findUnique({
      where: { id: projectId, userId: dbUser.id },
    });
    // Fallback: some clients pass generationId here; support that too
    if (!project) {
      project = await db.project.findFirst({
        where: { generationId: projectId, userId: dbUser.id },
        orderBy: { updatedAt: 'desc' },
      });
    }

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

/**
 * PUT /api/projects/[id]
 *
 * Update an existing project. Only owner can update.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const projectUpdate = body?.project;
    if (!projectUpdate) {
      return NextResponse.json({ error: 'Missing project payload' }, { status: 400 });
    }

    const db = prisma();
    const dbUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure the project belongs to the user
    let target = await db.project.findUnique({
      where: { id: params.id, userId: dbUser.id },
    });
    // Fallback: some clients send generationId here
    if (!target) {
      target = await db.project.findFirst({
        where: { generationId: params.id, userId: dbUser.id },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (target) {
      const updated = await db.project.update({
        where: { id: target.id },
        data: {
          baseAssetUrl: projectUpdate.baseAssetUrl ?? target.baseAssetUrl,
          baseWidth: projectUpdate.baseWidth ?? target.baseWidth,
          baseHeight: projectUpdate.baseHeight ?? target.baseHeight,
          crop: projectUpdate.crop ?? target.crop,
          filters: projectUpdate.filters ?? target.filters,
          layers: projectUpdate.layers ?? target.layers,
        },
        select: { id: true },
      });
      return NextResponse.json({ success: true, id: updated.id });
    }

    // If nothing existed, create a new project keyed by generationId=params.id
    const created = await db.project.create({
      data: {
        id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        userId: dbUser.id,
        generationId: params.id,
        baseAssetUrl: projectUpdate.baseAssetUrl,
        baseWidth: projectUpdate.baseWidth,
        baseHeight: projectUpdate.baseHeight,
        crop: projectUpdate.crop ?? {},
        filters: projectUpdate.filters ?? {},
        layers: projectUpdate.layers ?? [],
      },
      select: { id: true },
    });
    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error('Projects API: Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}