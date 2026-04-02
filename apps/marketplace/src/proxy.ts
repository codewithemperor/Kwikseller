/**
 * KWIKSELLER Marketplace — Middleware / Proxy
 *
 * Responsibilities
 * ────────────────
 * 1. Subdomain routing  (vendor / admin / rider redirects)
 * 2. www → apex redirect
 * 3. Security headers on every HTML response
 *
 * Auth redirects (login ↔ dashboard) are intentionally kept
 * client-side via GuestRoute / ProtectedRoute because:
 *   - The Zustand auth store lives in localStorage (not cookies),
 *     so middleware has no reliable way to read it.
 *   - Doing auth checks here would require duplicating token logic.
 *
 * If you later move to HttpOnly cookie tokens, add an `authMiddleware`
 * section here that reads `request.cookies.get('accessToken')`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAIN_DOMAIN = "kwikseller.com";

/** Subdomains that belong to sibling apps — redirect if hit on wrong host. */
const SIBLING_SUBDOMAINS = ["vendor", "admin", "rider"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    // Any path segment that looks like a file (has an extension)
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

/**
 * Add standard security headers to a response.
 * These are safe to apply to every HTML page response.
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

/**
 * Build an absolute redirect URL, preserving the pathname and search params.
 * Uses 301 for permanent redirects (www → apex, wrong subdomain).
 */
function permanentRedirect(
  targetOrigin: string,
  request: NextRequest,
): NextResponse {
  const url = new URL(request.url);
  const destination = `${targetOrigin}${url.pathname}${url.search}`;
  return NextResponse.redirect(destination, { status: 301 });
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function proxy(request: NextRequest): NextResponse {
  const url = new URL(request.url);
  const { hostname, pathname } = url;

  // ── 1. Short-circuit: pass static assets and API routes straight through ──
  if (isStaticAsset(pathname) || isApiRoute(pathname)) {
    return NextResponse.next();
  }

  // ── 2. www → apex redirect ────────────────────────────────────────────────
  if (hostname === `www.${MAIN_DOMAIN}`) {
    return permanentRedirect(`https://${MAIN_DOMAIN}`, request);
  }

  // ── 3. Sibling-subdomain guard ────────────────────────────────────────────
  //
  // If a user somehow lands on e.g. vendor.kwikseller.com while browsing the
  // marketplace app (e.g. a stale bookmark), redirect them to the correct app.
  // In a monorepo / multi-app setup each subdomain is its own Next.js app, so
  // this primarily guards against misconfigured proxies or direct URL entry.
  const subdomain = hostname.endsWith(`.${MAIN_DOMAIN}`)
    ? hostname.slice(0, hostname.length - MAIN_DOMAIN.length - 1)
    : null;

  if (
    subdomain &&
    SIBLING_SUBDOMAINS.includes(
      subdomain as (typeof SIBLING_SUBDOMAINS)[number],
    )
  ) {
    return permanentRedirect(`https://${subdomain}.${MAIN_DOMAIN}`, request);
  }

  // ── 4. Normal request — continue and add security headers ─────────────────
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - _next/static  (compiled JS / CSS)
     * - _next/image   (Next.js image optimiser)
     * - favicon.ico
     * - Any file with an extension (fonts, images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-z0-9]+$).*)",
  ],
};

export default proxy;
