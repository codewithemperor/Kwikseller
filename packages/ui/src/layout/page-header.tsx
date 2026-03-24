'use client';

import * as React from 'react';
import { cn } from '../components/utils';

/**
 * PageHeader - Page title and action header component
 */

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Breadcrumb slot */
  breadcrumb?: React.ReactNode;
  /** Action buttons slot */
  actions?: React.ReactNode;
  /** Back button slot */
  backButton?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Center aligned */
  centered?: boolean;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  backButton,
  className,
  centered = false,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumb && (
        <div className="mb-2">
          {breadcrumb}
        </div>
      )}
      <div className={cn(
        'flex items-center gap-4',
        centered ? 'justify-center text-center flex-col' : 'justify-between'
      )}>
        <div className={cn('flex items-center gap-4', centered && 'flex-col')}>
          {backButton}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && !centered && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

PageHeader.displayName = 'PageHeader';
