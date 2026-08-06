// KWIKSELLER - Custom Hooks Index
// Export all custom hooks from a single entry point

// UI hooks
export { usePWA, useNotificationPermission, useOnlineStatus, useServiceWorkerUpdate } from './use-pwa'

// Mobile hook (already exists)
export { useIsMobile } from './use-mobile'

// Toast hook (already exists)
export { useToast } from './use-toast'

// Recent searches (localStorage-persisted)
export { useRecentSearches, type RecentSearch } from './use-recent-searches'
