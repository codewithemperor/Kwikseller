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
