// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Alleen redirecten in productie, niet in development
  if (process.env.NODE_ENV === 'production') {
    const host = req.headers.get('host') || '';
    const isPreview = host.includes('sierks-projects.vercel.app');

    if (isPreview) {
      const url = new URL(req.url);
      url.host = 'ai-album-gen.vercel.app';
      url.protocol = 'https:';
      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Alleen auth-routes matchen, en alleen in productie
  matcher: ['/api/auth/:path*'],
};
