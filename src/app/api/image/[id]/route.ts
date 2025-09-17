import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

/**
 * Proxy route for serving generation images
 * This ensures images remain accessible even when Azure Storage URLs expire
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Find user in database by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Find the generation by ID and ensure it belongs to this user
    const generation = await prisma.generation.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      },
    });
    
    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }
    
    // For now, redirect to the original URL
    // In a real implementation, you would:
    // 1. Check if the URL is expired
    // 2. Generate a new SAS token if needed
    // 3. Proxy the image content
    
    return NextResponse.redirect(generation.imageUrl);
    
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
