'use client';

import * as React from 'react';
import { cn } from '../utils';

/**
 * MobileBottomNav - 5-tab bottom navigation for Marketplace mobile + Rider app
 */

export interface MobileBottomNavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component (inactive state) */
  icon: React.ReactNode;
  /** Active icon component */
  activeIcon?: React.ReactNode;
  /** Navigation href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Badge count */
  badge?: number;
  /** Is item active */
  active?: boolean;
  /** Is item disabled */
  disabled?: boolean;
}

export interface MobileBottomNavProps {
  /** Navigation items (max 5 recommended) */
  items: MobileBottomNavItem[];
  /** Current active path or item id */
  activePath?: string;
  /** Additional class names */
  className?: string;
  /** Safe area padding for iOS */
  safeAreaPadding?: boolean;
}

export function MobileBottomNav({
  items,
  activePath,
  className,
  safeAreaPadding = true,
}: MobileBottomNavProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-around h-16 bg-background border-t',
        safeAreaPadding && 'pb-safe',
        className
      )}
    >
      {items.slice(0, 5).map((item) => {
        const isActive = item.active || item.id === activePath;
        const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 relative',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              {Icon}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium truncate max-w-full px-1">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

MobileBottomNav.displayName = 'MobileBottomNav';
