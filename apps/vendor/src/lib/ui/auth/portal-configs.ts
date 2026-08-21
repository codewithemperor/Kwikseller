/**
 * Portal Configurations
 *
 * Centralised auth / branding config for each Kwikseller portal:
 *   - Marketplace  (BUYER)
 *   - Vendor Portal (VENDOR)
 *   - Admin Portal  (ADMIN)
 *   - Rider Portal  (RIDER)
 *
 * Each portal shares the same NextAuth provider but routes the user to a
 * different dashboard after login. Import these configs in your app's
 * NextAuth setup to keep portal-specific values DRY.
 */

export type PortalSlug = 'marketplace' | 'vendor' | 'admin' | 'rider'

export interface PortalConfig {
  /** Unique identifier */
  slug: PortalSlug
  /** Human-readable name shown on login screens */
  name: string
  /** Short tagline / description */
  description: string
  /** Brand color token (maps to Tailwind / HeroUI theme) */
  themeColor: string
  /** Where the user lands after a successful login */
  redirectPath: string
  /** Login page route inside this app */
  loginPath: string
  /** Registration page route (null if invites-only) */
  registerPath: string | null
  /** Forgot-password route */
  forgotPasswordPath: string
  /** API base URL for this portal's backend (relative) */
  apiBasePath: string
  /** Logo alt text */
  logoAlt: string
  /** Favicon path (relative to /public) */
  favicon: string
  /** Default role assigned after onboarding */
  defaultRole: string
  /** Whether this portal requires MFA */
  mfaRequired: boolean
  /** Allowed OAuth providers */
  oauthProviders: string[]
  /** Session max age in seconds (default 30 days) */
  sessionMaxAge: number
}

// ---------------------------------------------------------------------------
// Portal definitions
// ---------------------------------------------------------------------------

export const PORTALS: Record<PortalSlug, PortalConfig> = {
  marketplace: {
    slug: 'marketplace',
    name: 'KWIKSELLER',
    description: 'Africa\'s largest multi-vendor marketplace',
    themeColor: 'orange',
    redirectPath: '/dashboard',
    loginPath: '/login',
    registerPath: '/register',
    forgotPasswordPath: '/forgot-password',
    apiBasePath: '/api/marketplace',
    logoAlt: 'KWIKSELLER Marketplace',
    favicon: '/favicon.ico',
    defaultRole: 'BUYER',
    mfaRequired: false,
    oauthProviders: ['google', 'facebook'],
    sessionMaxAge: 30 * 24 * 60 * 60, // 30 days
  },

  vendor: {
    slug: 'vendor',
    name: 'KWIKSELLER Vendor',
    description: 'Manage your store, products, and orders',
    themeColor: 'orange',
    redirectPath: '/vendor/dashboard',
    loginPath: '/vendor/login',
    registerPath: '/vendor/register',
    forgotPasswordPath: '/vendor/forgot-password',
    apiBasePath: '/api/vendor',
    logoAlt: 'KWIKSELLER Vendor Portal',
    favicon: '/favicon.ico',
    defaultRole: 'VENDOR',
    mfaRequired: false,
    oauthProviders: ['google', 'facebook'],
    sessionMaxAge: 30 * 24 * 60 * 60,
  },

  admin: {
    slug: 'admin',
    name: 'KWIKSELLER Admin',
    description: 'Platform administration and analytics',
    themeColor: 'red',
    redirectPath: '/admin/dashboard',
    loginPath: '/admin/login',
    registerPath: null, // invite-only
    forgotPasswordPath: '/admin/forgot-password',
    apiBasePath: '/api/admin',
    logoAlt: 'KWIKSELLER Admin Portal',
    favicon: '/favicon.ico',
    defaultRole: 'ADMIN',
    mfaRequired: true,
    oauthProviders: ['google'],
    sessionMaxAge: 8 * 60 * 60, // 8 hours
  },

  rider: {
    slug: 'rider',
    name: 'KWIKSELLER Rider',
    description: 'Delivery management and tracking',
    themeColor: 'green',
    redirectPath: '/rider/dashboard',
    loginPath: '/rider/login',
    registerPath: '/rider/register',
    forgotPasswordPath: '/rider/forgot-password',
    apiBasePath: '/api/rider',
    logoAlt: 'KWIKSELLER Rider Portal',
    favicon: '/favicon.ico',
    defaultRole: 'RIDER',
    mfaRequired: false,
    oauthProviders: ['google'],
    sessionMaxAge: 7 * 24 * 60 * 60, // 7 days
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get a portal config by slug.
 * Falls back to the marketplace config if the slug is unknown.
 */
export function getPortalConfig(slug: string): PortalConfig {
  return PORTALS[slug as PortalSlug] ?? PORTALS.marketplace
}

/**
 * Build the full login URL for a given portal.
 */
export function getLoginUrl(slug: PortalSlug): string {
  return PORTALS[slug].loginPath
}

/**
 * Build the full post-login redirect URL for a given portal.
 */
export function getRedirectUrl(slug: PortalSlug): string {
  return PORTALS[slug].redirectPath
}

/**
 * Check if a given portal requires multi-factor authentication.
 */
export function isMfaRequired(slug: PortalSlug): boolean {
  return PORTALS[slug].mfaRequired
}
