// KWIKSELLER - Shared UI Components
// Export all shared components for use across all frontend apps

// ==================== Utilities ====================
export { cn } from './components/utils'

// Formatting utilities (re-exported for convenience)
export {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  truncate,
  slugify,
  capitalize,
  getInitials,
  generateId,
} from './components/utils'

// ==================== Base Components ====================

// Button
export { Button, buttonVariants } from './components/button'
export type { ButtonProps } from './components/button'

// Card
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/card'

// Badge
export { Badge, badgeVariants } from './components/badge'
export type { BadgeProps } from './components/badge'

// ==================== Form Components ====================

// Input
export { Input } from './components/input'

// Textarea
export { Textarea } from './components/textarea'

// Label
export { Label } from './components/label'

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './components/select'

// Checkbox
export { Checkbox } from './components/checkbox'

// Radio Group
export { RadioGroup, RadioGroupItem } from './components/radio-group'

// Switch
export { Switch } from './components/switch'

// Slider
export { Slider } from './components/slider'

// Form
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from './components/form'

// Input OTP
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from './components/input-otp'

// ==================== Overlay Components ====================

// Dialog
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog'

// Alert Dialog
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './components/alert-dialog'

// Sheet
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './components/sheet'

// Drawer
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './components/drawer'

// Popover
export { Popover, PopoverTrigger, PopoverContent } from './components/popover'

// Tooltip
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './components/tooltip'

// Hover Card
export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from './components/hover-card'

// ==================== Menu Components ====================

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './components/dropdown-menu'

// Context Menu
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './components/context-menu'

// Menubar
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarShortcut,
} from './components/menubar'

// Navigation Menu
export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
} from './components/navigation-menu'

// ==================== Data Display Components ====================

// Avatar
export { Avatar, AvatarImage, AvatarFallback } from './components/avatar'

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/table'

// Progress
export { Progress } from './components/progress'

// Skeleton
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonImage,
} from './components/skeleton'

// Separator
export { Separator } from './components/separator'

// Scroll Area
export {
  ScrollArea,
  ScrollBar,
} from './components/scroll-area'

// Aspect Ratio
export { AspectRatio } from './components/aspect-ratio'

// Chart
export * from './components/chart'

// Carousel
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from './components/carousel'

// Calendar
export { Calendar, CalendarDayButton } from './components/calendar'

// Command (for search/command palette)
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './components/command'

// Pagination
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './components/pagination'

// Breadcrumb
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './components/breadcrumb'

// Sidebar
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './components/sidebar'

// Resizable
export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from './components/resizable'

// ==================== Feedback Components ====================

// Alert
export { Alert, AlertTitle, AlertDescription } from './components/alert'

// Toast
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './components/toast'

// Toaster
export { Toaster } from './components/toaster'

// Sonner (re-exported as Toaster from sonner)
export { Toaster as Sonner } from './components/sonner'

// ==================== Layout Components ====================

// Tabs
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './components/tabs'

// Accordion
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './components/accordion'

// Collapsible
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './components/collapsible'

// Toggle
export { Toggle, toggleVariants } from './components/toggle'

// Toggle Group
export {
  ToggleGroup,
  ToggleGroupItem,
} from './components/toggle-group'

// ==================== Custom Layout Components ====================

// App Shell
export { AppShell } from './layout/app-shell'
export type { AppShellProps } from './layout/app-shell'

// Page Header
export { PageHeader } from './layout/page-header'
export type { PageHeaderProps } from './layout/page-header'

// Section Header
export { SectionHeader } from './layout/section-header'
export type { SectionHeaderProps } from './layout/section-header'

// Page Container
export { PageContainer } from './layout/page-container'
export type { PageContainerProps } from './layout/page-container'

// Divider
export { Divider } from './layout/divider'
export type { DividerProps } from './layout/divider'

// ==================== Custom Navigation Components ====================

// Top Nav
export { TopNav } from './navigation/top-nav'
export type { TopNavProps } from './navigation/top-nav'

// Mobile Bottom Nav
export { MobileBottomNav } from './navigation/mobile-bottom-nav'
export type { MobileBottomNavProps, MobileBottomNavItem } from './navigation/mobile-bottom-nav'

// ==================== Custom Feedback Components ====================

// Spinner
export { Spinner, LoadingOverlay } from './feedback/spinner'
export type { SpinnerProps } from './feedback/spinner'

// Empty State
export { EmptyState } from './feedback/empty-state'
export type { EmptyStateProps } from './feedback/empty-state'

// Error Boundary
export { ErrorBoundary, ErrorFallback } from './feedback/error-boundary'
export type { ErrorBoundaryProps, ErrorFallbackProps } from './feedback/error-boundary'

// Offline Banner
export { OfflineBanner, ConnectionStatus } from './feedback/offline-banner'
export type { OfflineBannerProps } from './feedback/offline-banner'

// ==================== Hooks ====================

// useToast hook
export { useToast } from './components/hooks/use-toast'

// useMobile hook
export { useIsMobile, useIsMobile as useMobile } from './components/hooks/use-mobile'

// ==================== Types ====================
export type { VariantProps } from 'class-variance-authority'
