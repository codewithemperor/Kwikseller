/**
 * KWIKSELLER Marketplace - Subdomain Proxy Configuration
 * 
 * This proxy handles subdomain routing for the marketplace app.
 * In Next.js 16, proxy.ts replaces middleware.ts for subdomain routing.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Main marketplace domain
 */
const MAIN_DOMAIN = 'kwikseller.com';

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Handle API requests - forward to backend
  if (url.pathname.startsWith('/api/')) {
    // For API routes, we handle them via Next.js API routes
    // which internally call the backend
    return NextResponse.next();
  }

  // Check for subdomain
  const isSubdomain = hostname.includes(MAIN_DOMAIN) && 
    hostname !== MAIN_DOMAIN && 
    !hostname.startsWith('www.');

  // If accessing via a different subdomain (vendor, admin, rider), redirect
  if (isSubdomain) {
    const subdomain = hostname.split('.')[0];
    
    // Redirect to correct app based on subdomain
    if (subdomain === 'vendor') {
      return NextResponse.redirect(`https://vendor.${MAIN_DOMAIN}${url.pathname}`);
    }
    if (subdomain === 'admin') {
      return NextResponse.redirect(`https://admin.${MAIN_DOMAIN}${url.pathname}`);
    }
    if (subdomain === 'rider') {
      return NextResponse.redirect(`https://rider.${MAIN_DOMAIN}${url.pathname}`);
    }
  }

  // Handle www redirect to main domain
  if (hostname.startsWith('www.')) {
    return NextResponse.redirect(`https://${MAIN_DOMAIN}${url.pathname}`);
  }

  // Continue with normal request
  const response = NextResponse.next();

  // Add headers for PWA support
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};

export default proxy;
