/**
 * KWIKSELLER Rider App - Middleware / Proxy
 *
 * Responsibilities:
 * 1. Proxy API requests to the NestJS backend on port 4000
 * 2. Handle subdomain routing
 * 3. Add security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Main marketplace domain
 */
const MAIN_DOMAIN = 'kwikseller.com';

/**
 * Backend API URL
 */
const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const pathname = url.pathname;

  // ── 1. Proxy API requests to backend ────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Build the target URL for the backend
    const targetUrl = `${API_URL}${pathname}${url.search}`;
    
    // Forward the request to the backend
    const headers = new Headers(request.headers);
    
    // Add forwarded headers
    headers.set('x-forwarded-for', request.headers.get('x-forwarded-for') || 'unknown');
    headers.set('x-forwarded-host', hostname);
    headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
    
    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      });
      
      // Return the backend response
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      console.error('[Rider Proxy] API proxy error:', error);
      return NextResponse.json(
        { error: 'API proxy error', message: 'Failed to connect to backend' },
        { status: 502 }
      );
    }
  }

  // ── 2. Static assets - pass through ──────────────────────────────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ── 3. Subdomain routing ─────────────────────────────────────────────────────
  const isRiderSubdomain = hostname === `rider.${MAIN_DOMAIN}` || 
    hostname === 'localhost' ||
    hostname.startsWith('rider.');

  // If not on rider subdomain, redirect to correct app
  if (!isRiderSubdomain) {
    const subdomain = hostname.split('.')[0];
    
    if (subdomain === 'vendor') {
      return NextResponse.redirect(`https://vendor.${MAIN_DOMAIN}${pathname}`);
    }
    if (subdomain === 'admin') {
      return NextResponse.redirect(`https://admin.${MAIN_DOMAIN}${pathname}`);
    }
    // Default redirect to main marketplace
    return NextResponse.redirect(`https://${MAIN_DOMAIN}${pathname}`);
  }

  // ── 4. Normal request - add security headers ────────────────────────────────
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};

export default proxy;
