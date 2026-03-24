'use client';

import * as React from 'react';
import { Menu, Search, Bell, X } from 'lucide-react';
import { cn } from '../utils';
// import { Avatar, AvatarFallback, AvatarImage } from './avatar';

/**
 * TopNav - Top navigation bar with logo, search, notifications, and user menu
 */

export interface TopNavProps {
  /** Logo slot */
  logo?: React.ReactNode;
  /** Logo URL for navigation */
  logoHref?: string;
  /** Global search slot */
  searchSlot?: React.ReactNode;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Search callback */
  onSearch?: (query: string) => void;
  /** Notification bell slot */
  notificationSlot?: React.ReactNode;
  /** Unread notification count */
  notificationCount?: number;
  /** Notification click handler */
  onNotificationClick?: () => void;
  /** User avatar slot */
  userSlot?: React.ReactNode;
  /** User avatar image URL */
  userAvatar?: string;
  /** User avatar fallback text */
  userAvatarFallback?: string;
  /** User menu items */
  userMenuItems?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
    divider?: boolean;
  }>;
  /** Right side actions slot */
  rightActions?: React.ReactNode;
  /** Menu button click (for mobile sidebar) */
  onMenuClick?: () => void;
  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Additional class names */
  className?: string;
  /** Show search bar */
  showSearch?: boolean;
  /** Show notification bell */
  showNotifications?: boolean;
  /** Show user menu */
  showUserMenu?: boolean;
}

export function TopNav({
  logo,
  logoHref = '/',
  searchSlot,
  searchPlaceholder = 'Search...',
  onSearch,
  notificationSlot,
  notificationCount = 0,
  onNotificationClick,
  userSlot,
  userAvatar,
  userAvatarFallback = 'U',
  userMenuItems = [],
  rightActions,
  onMenuClick,
  sidebarCollapsed,
  className,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
}: TopNavProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className={cn('flex h-16 items-center px-4 gap-4', className)}>
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-accent"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo */}
      <div className="flex items-center">
        {logo ? (
          logo
        ) : (
          <a href={logoHref} className="flex items-center gap-2 font-semibold text-lg">
            <span className="text-primary">KWIKSELLER</span>
          </a>
        )}
      </div>

      {/* Search Bar - Desktop */}
      {showSearch && (
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          {searchSlot || (
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </form>
          )}
        </div>
      )}

      {/* Mobile Search Toggle */}
      {showSearch && (
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 rounded-md hover:bg-accent"
          aria-label="Search"
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1 md:hidden" />

      {/* Right Side Actions */}
      {rightActions && (
        <div className="flex items-center gap-2">
          {rightActions}
        </div>
      )}

      {/* Notifications */}
      {showNotifications && (
        <div className="relative">
          {notificationSlot || (
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded-md hover:bg-accent"
              aria-label={`Notifications ${notificationCount > 0 ? `(${notificationCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* User Menu */}
      {showUserMenu && (
        <div className="relative">
          {userSlot || (
            <>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-accent"
                aria-label="User menu"
              >
                {/* <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} alt="User avatar" />
                  <AvatarFallback>{userAvatarFallback}</AvatarFallback>
                </Avatar> */}
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-background shadow-lg z-50">
                    <div className="p-2">
                      {userMenuItems.map((item, index) => (
                        <React.Fragment key={index}>
                          {item.divider ? (
                            <div className="my-1 border-t" />
                          ) : (
                            <button
                              onClick={() => {
                                item.onClick?.();
                                setUserMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                            >
                              {item.icon}
                              {item.label}
                            </button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

TopNav.displayName = 'TopNav';

// Avatar component inline (simplified version for the UI package)
interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

function AvatarRoot({ className, children }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
    >
      {children}
    </span>
  );
}

function AvatarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={cn('aspect-square h-full w-full object-cover', className)}
    />
  );
}

function AvatarFallback({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium',
        className
      )}
    >
      {children}
    </span>
  );
}

const Avatar = Object.assign(AvatarRoot, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
});
