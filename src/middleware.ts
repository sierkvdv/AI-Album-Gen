// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Vaste domein (productie)
const CANONICAL_HOST = process.env.CANONICAL_HOST ?? 'ai-album-gen.vercel.app';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  // Als je NIET op je hoofd-domein zit (bv. preview), stuur dan door
  if (host !== CANONICAL_HOST) {
    const url = new URL(req.url);
    url.protocol = 'https:';       // forceer https
    url.host = CANONICAL_HOST;     // stuur naar productie-domein
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

// Redirect ALLES (ook /api/auth/*), zodat Google/NextAuth altijd het juiste domein ziet
export const config = {
  matcher: ['/:path*'],
};
