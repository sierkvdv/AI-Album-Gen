import { NextResponse } from "next/server";

/**
 * GET /api/debug-env
 * 
 * Debug endpoint to check environment variables
 */
export async function GET() {
  try {
    const env = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'none',
      mockOpenAI: process.env.MOCK_OPENAI,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    };

    return NextResponse.json({ 
      success: true,
      environment: env,
      message: "Environment variables checked"
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to check environment",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
