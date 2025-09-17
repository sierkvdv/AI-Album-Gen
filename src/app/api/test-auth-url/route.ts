import { NextResponse } from "next/server";

export async function GET() {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const vercelUrl = process.env.VERCEL_URL;
  const nodeEnv = process.env.NODE_ENV;
  const canonicalHost = process.env.CANONICAL_HOST;

  return NextResponse.json({
    success: true,
    urls: {
      nextAuthUrl,
      vercelUrl,
      nodeEnv,
      canonicalHost,
      expectedProductionUrl: "https://ai-album-gen.vercel.app",
    },
    analysis: {
      isProduction: nodeEnv === "production",
      hasNextAuthUrl: !!nextAuthUrl,
      hasVercelUrl: !!vercelUrl,
      urlsMatch: nextAuthUrl === "https://ai-album-gen.vercel.app",
    },
    timestamp: new Date().toISOString(),
  });
}
