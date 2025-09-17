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
    const db = prisma();
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Find the generation by ID and ensure it belongs to this user
    const generation = await db.generation.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      },
    });
    
    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }
    
    // Try to fetch the image from Azure Storage
    try {
      const imageResponse = await fetch(generation.imageUrl);
      
      if (!imageResponse.ok) {
        // If the URL is expired, return a placeholder or error
        return new NextResponse(
          JSON.stringify({ 
            error: 'Image URL expired',
            message: 'The image URL has expired. Please regenerate the image.',
            originalUrl: generation.imageUrl
          }), 
          { 
            status: 410,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Get the image data
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      
      // Return the image data
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
      
    } catch (error) {
      console.error('Error fetching image:', error);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch image',
          message: 'Could not retrieve the image from storage.'
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
