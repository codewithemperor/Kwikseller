'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

/**
 * SectionHeader - Section title with optional actions
 */

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Action buttons slot */
  actions?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Show border below */
  showBorder?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  showBorder = false,
  size = 'md',
}: SectionHeaderProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        showBorder && 'pb-4 border-b',
        className
      )}
    >
      <div className="space-y-1">
        <h2 className={cn('font-semibold tracking-tight', sizeClasses[size])}>
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

SectionHeader.displayName = 'SectionHeader';
