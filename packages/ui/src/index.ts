// KWIKSELLER - Shared UI Components
// Export all shared components

// Utilities
export { cn, formatCurrency, formatDate, formatRelativeTime, truncate, slugify, capitalize, getInitials, generateId } from './utils'

// Base Components
export { Button, buttonVariants, type ButtonProps } from './button'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'
export { Badge, badgeVariants, type BadgeProps } from './badge'

// Layout Components
export { AppShell, type AppShellProps } from './layout/app-shell'
export { PageHeader, type PageHeaderProps } from './layout/page-header'
export { SectionHeader, type SectionHeaderProps } from './layout/section-header'
export { PageContainer, type PageContainerProps } from './layout/page-container'
export { Divider, type DividerProps } from './layout/divider'

// Navigation Components
export { TopNav, type TopNavProps } from './navigation/top-nav'
export { Sidebar, type SidebarProps, type SidebarMenuItem } from './navigation/sidebar'
export { MobileBottomNav, type MobileBottomNavProps, type MobileBottomNavItem } from './navigation/mobile-bottom-nav'
export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem } from './navigation/breadcrumb'

// Feedback Components
export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonAvatar, 
  SkeletonImage,
  type SkeletonProps 
} from './feedback/skeleton'
export { Spinner, LoadingOverlay, type SpinnerProps } from './feedback/spinner'
export { ErrorBoundary, ErrorFallback, type ErrorBoundaryProps, type ErrorFallbackProps } from './feedback/error-boundary'
export { EmptyState, type EmptyStateProps } from './feedback/empty-state'
export { OfflineBanner, ConnectionStatus, type OfflineBannerProps } from './feedback/offline-banner'

// Types
export type { VariantProps } from 'class-variance-authority'
