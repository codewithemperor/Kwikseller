/**
 * KWIKSELLER Admin Panel - Subdomain Proxy Configuration
 * 
 * This proxy handles subdomain routing for the admin panel.
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

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Verify we're on the admin subdomain
  const isAdminSubdomain = hostname === `admin.${MAIN_DOMAIN}` || 
    hostname === 'localhost' ||
    hostname.startsWith('admin.');

  // If not on admin subdomain, redirect to correct app
  if (!isAdminSubdomain) {
    const subdomain = hostname.split('.')[0];
    
    if (subdomain === 'vendor') {
      return NextResponse.redirect(`https://vendor.${MAIN_DOMAIN}${url.pathname}`);
    }
    if (subdomain === 'rider') {
      return NextResponse.redirect(`https://rider.${MAIN_DOMAIN}${url.pathname}`);
    }
    // Default redirect to main marketplace
    return NextResponse.redirect(`https://${MAIN_DOMAIN}${url.pathname}`);
  }

  // Continue with normal request
  const response = NextResponse.next();

  // Add security headers - stricter for admin panel
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};

export default proxy;
