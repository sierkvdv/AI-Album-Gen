import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Create a new editor project for a given generation. The request body must
 * include the generationId and an initial project object containing at
 * minimum the base asset URL, base dimensions, crop, filters and layers. The
 * caller must own the referenced generation. The created project is
 * returned to the client.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { generationId, project } = await req.json();
  if (!generationId || !project) {
    return NextResponse.json({ error: 'generationId and project are required' }, { status: 400 });
  }
  const db = prisma();
  // Find current user
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  // Verify that the generation exists and belongs to the user
  const generation = await db.generation.findUnique({ where: { id: generationId } });
  if (!generation || generation.userId !== user.id) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
  }
  // Create the new project. JSON fields are stored as Prisma Json types.
  const newProject = await db.project.create({
    data: {
      userId: user.id,
      generationId: generation.id,
      baseAssetUrl: project.baseAssetUrl,
      baseWidth: project.baseWidth,
      baseHeight: project.baseHeight,
      crop: project.crop,
      filters: project.filters,
      layers: project.layers,
    },
  });
  return NextResponse.json({ project: newProject });
}