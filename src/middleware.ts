import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global middleware for the application.
 *
 * This middleware performs a single responsibility: it redirects requests to
 * the canonical host in production environments.  When deploying behind a
 * proxy (e.g. Vercel), domain aliases such as the preview or `www` subdomain
 * may still resolve to the same deployment.  To avoid duplicate content and
 * ensure cookies are scoped correctly, the canonical host can be enforced via
 * the `CANONICAL_HOST` environment variable.  If the incoming request host
 * does not match the canonical host, the request is redirected to the
 * canonical host preserving the path and query string.
 *
 * The matcher below excludes `/api/auth/*` (Auth.js routes), Next.js static
 * assets (`_next/static` and `_next/image`), and common static files (like
 * `favicon.ico` and `robots.txt`) from this middleware.  Excluding these
 * paths prevents interference with the authentication flow and avoids
 * unnecessary redirects for assets.
 */
export function middleware(request: NextRequest) {
  // Only enforce canonical host in production when explicitly configured.
  const canonical = process.env.CANONICAL_HOST;
  if (
    process.env.NODE_ENV === "production" &&
    canonical &&
    request.headers.get("host") !== canonical
  ) {
    const url = new URL(request.url);
    url.host = canonical;
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

// The matcher defines which paths this middleware applies to.  We exclude
// authentication routes and static assets to avoid breaking OAuth callbacks
// and to minimize overhead on asset requests.
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};