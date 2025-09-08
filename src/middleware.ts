// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';

  // Alle Vercel preview hosts hebben dit patroon; pas zo nodig aan je projectnaam aan
  const isPreview = host.includes('sierks-projects.vercel.app');

  if (isPreview) {
    const url = new URL(req.url);
    url.host = 'ai-album-gen.vercel.app'; // jouw productie-domein
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Auth-routes altijd naar productie; je kunt hier eventueel ook '/' of meer paden aan toevoegen
  matcher: ['/api/auth/:path*'],
};
