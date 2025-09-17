// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CANONICAL_HOST = process.env.CANONICAL_HOST ?? 'ai-album-gen.vercel.app';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  if (host !== CANONICAL_HOST) {
    const url = new URL(req.url);
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'], // redirect ALLES, incl. /api/auth/*
};