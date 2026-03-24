'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils';

/**
 * Sidebar - Collapsible navigation sidebar with nested menu support
 */

export interface SidebarMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Navigation href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Nested menu items */
  children?: SidebarMenuItem[];
  /** Badge count */
  badge?: number;
  /** Is item active */
  active?: boolean;
  /** Is item disabled */
  disabled?: boolean;
}

export interface SidebarProps {
  /** Menu items */
  items: SidebarMenuItem[];
  /** Logo slot (shown at top) */
  logo?: React.ReactNode;
  /** Footer slot (shown at bottom) */
  footer?: React.ReactNode;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Collapse toggle callback */
  onCollapseToggle?: () => void;
  /** Navigate callback (for mobile close) */
  onNavigate?: () => void;
  /** Current active path */
  activePath?: string;
  /** Additional class names */
  className?: string;
  /** Show collapse button */
  showCollapseButton?: boolean;
}

export function Sidebar({
  items,
  logo,
  footer,
  collapsed = false,
  onCollapseToggle,
  onNavigate,
  activePath,
  className,
  showCollapseButton = true,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.children?.length) {
      if (!collapsed) {
        toggleExpanded(item.id);
      }
    } else {
      item.onClick?.();
      onNavigate?.();
    }
  };

  const isItemActive = (item: SidebarMenuItem): boolean => {
    if (item.active) return true;
    if (item.href === activePath) return true;
    if (item.children?.some((child) => isItemActive(child))) return true;
    return false;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Logo Section */}
      {logo && (
        <div className={cn(
          'flex items-center border-b p-4',
          collapsed ? 'justify-center' : 'gap-2'
        )}>
          {logo}
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {items.map((item) => (
            <SidebarMenuItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              expanded={expandedItems.has(item.id)}
              active={isItemActive(item)}
              onToggle={() => toggleExpanded(item.id)}
              onClick={() => handleItemClick(item)}
              onNavigate={onNavigate}
              activePath={activePath}
            />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {footer && (
        <div className="border-t p-4">
          {footer}
        </div>
      )}

      {/* Collapse Toggle */}
      {showCollapseButton && (
        <div className="hidden lg:flex items-center justify-end border-t p-2">
          <button
            onClick={onCollapseToggle}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

interface SidebarMenuItemComponentProps {
  item: SidebarMenuItem;
  collapsed: boolean;
  expanded: boolean;
  active: boolean;
  onToggle: () => void;
  onClick: () => void;
  onNavigate?: () => void;
  activePath?: string;
}

function SidebarMenuItemComponent({
  item,
  collapsed,
  expanded,
  active,
  onToggle,
  onClick,
  onNavigate,
  activePath,
}: SidebarMenuItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0;

  if (collapsed) {
    return (
      <li>
        <button
          onClick={onClick}
          disabled={item.disabled}
          className={cn(
            'flex w-full items-center justify-center p-3 rounded-md transition-colors',
            active
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            item.disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={item.label}
        >
          {item.icon}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={hasChildren ? onToggle : onClick}
        disabled={item.disabled}
        className={cn(
          'flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          item.disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="flex-1 truncate text-left text-sm">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1.5">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {hasChildren && (
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Nested Items */}
      {hasChildren && expanded && (
        <ul className="mt-1 ml-4 pl-4 border-l space-y-1">
          {item.children!.map((child) => (
            <li key={child.id}>
              <button
                onClick={() => {
                  child.onClick?.();
                  onNavigate?.();
                }}
                disabled={child.disabled}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                  (child.active || child.href === activePath)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  child.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {child.icon && <span className="flex-shrink-0">{child.icon}</span>}
                <span className="flex-1 truncate text-left">{child.label}</span>
                {child.badge !== undefined && child.badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
                    {child.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

Sidebar.displayName = 'Sidebar';
