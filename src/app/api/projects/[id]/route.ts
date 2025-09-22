import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Retrieve or update a project. Only the owner of the project may access
 * this endpoint. GET returns the project object; PUT updates the
 * persistent JSON fields (crop, filters, layers) and timestamps.
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = prisma();
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const project = await db.project.findUnique({ where: { id: context.params.id } });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { project } = body;
  if (!project) {
    return NextResponse.json({ error: 'project is required' }, { status: 400 });
  }
  const db = prisma();
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const existing = await db.project.findUnique({ where: { id: context.params.id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const updated = await db.project.update({
    where: { id: existing.id },
    data: {
      baseAssetUrl: project.baseAssetUrl ?? existing.baseAssetUrl,
      baseWidth: project.baseWidth ?? existing.baseWidth,
      baseHeight: project.baseHeight ?? existing.baseHeight,
      crop: project.crop ?? existing.crop,
      filters: project.filters ?? existing.filters,
      layers: project.layers ?? existing.layers,
    },
  });
  return NextResponse.json({ project: updated });
}