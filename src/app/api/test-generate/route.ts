import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST /api/test-generate
 * 
 * Simple test endpoint to verify the API is working
 */
export async function POST(request: Request) {
  try {
    console.log('Test Generate API: Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      console.log('Test Generate API: Not authenticated');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { prompt, styleId } = await request.json();
    console.log('Test Generate API: Request data:', { prompt, styleId });
    
    if (!prompt || typeof prompt !== "string" || !styleId || typeof styleId !== "string") {
      console.log('Test Generate API: Invalid request body');
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // For now, just return a placeholder image URL
    const imageUrl = "/placeholder_light_gray_block.png";
    
    console.log('Test Generate API: Success - returning placeholder');
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      message: "Test successful - placeholder image returned"
    });
  } catch (error) {
    console.error('Test Generate API: Error:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

