'use client';

import * as React from 'react';
import { cn } from '../components/utils';

/**
 * PageContainer - Standard page content wrapper
 */

export interface PageContainerProps {
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Maximum width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  /** Padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Center content */
  centered?: boolean;
}

export function PageContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  centered = false,
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
    none: '',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        centered && 'flex flex-col items-center',
        className
      )}
    >
      {children}
    </div>
  );
}

PageContainer.displayName = 'PageContainer';
