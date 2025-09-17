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
    
    // Try to fetch the image from the stored URL
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const imageResponse = await fetch(generation.imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AlbumCoverBot/1.0)'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!imageResponse.ok) {
        // If the URL is expired, serve a placeholder image immediately
        console.log('Image URL expired, serving placeholder:', generation.imageUrl);
        
        // Serve placeholder directly without additional fetch
        const placeholderResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://ai-album-gen.vercel.app'}/placeholder_light_gray_block.png`);
        if (placeholderResponse.ok) {
          const placeholderBuffer = await placeholderResponse.arrayBuffer();
          const contentType = placeholderResponse.headers.get('content-type') || 'image/png';
          
          return new NextResponse(placeholderBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600',
              'X-Image-Status': 'expired-placeholder'
            },
          });
        }
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
