import { NextResponse } from "next/server";

/**
 * Test endpoint to directly test Auth.js route handlers.
 */
export async function GET() {
  try {
    // Import the handlers directly
    const { handlers } = await import("@/auth-minimal");
    
    // Try to call the GET handler
    const mockRequest = new Request("https://ai-album-gen.vercel.app/api/auth/test");
    const mockHeaders = new Headers();
    mockHeaders.set("host", "ai-album-gen.vercel.app");
    
    const response = await handlers.GET(mockRequest);
    
    return NextResponse.json({
      success: true,
      authRouteTest: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        // Don't try to read the body as it might be a stream
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Error testing Auth.js route",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
