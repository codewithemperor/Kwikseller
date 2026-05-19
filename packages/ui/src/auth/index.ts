// Auth Config Exports
// Shared portal configurations for all Kwikseller apps

export {
  PORTALS,
  getPortalConfig,
  getLoginUrl,
  getRedirectUrl,
  isMfaRequired,
} from './portal-configs'

export type {
  PortalSlug,
  PortalConfig,
} from './portal-configs'

export {
  KwiksellerLogo,
  BrandedAuthHeader,
  BrandedAuthSidePanel,
  BrandedAuthLayout,
} from './branded-auth'

export type {
  KwiksellerLogoProps,
  BrandedAuthHeaderProps,
  BrandedAuthSidePanelProps,
  BrandedAuthLayoutProps,
} from './branded-auth'
