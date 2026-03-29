'use client';

import * as React from 'react';
import { Package, Search, FileX, Inbox, FolderX } from 'lucide-react';
import { cn } from '../components/utils';

/**
 * EmptyState - Empty state display component
 */

export interface EmptyStateProps {
  /** Icon component */
  icon?: React.ReactNode;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Action button slot */
  action?: React.ReactNode;
  /** Preset variant */
  variant?: 'default' | 'products' | 'orders' | 'search' | 'data' | 'files';
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const variantIcons: Record<string, React.ReactNode> = {
  products: <Package className="h-12 w-12" />,
  orders: <Inbox className="h-12 w-12" />,
  search: <Search className="h-12 w-12" />,
  data: <FolderX className="h-12 w-12" />,
  files: <FileX className="h-12 w-12" />,
  default: <Inbox className="h-12 w-12" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizeClasses[size],
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
        {icon || variantIcons[variant]}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';
