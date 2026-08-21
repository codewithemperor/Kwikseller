'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

/**
 * Spinner - Loading spinner component
 */

export interface SpinnerProps {
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
  /** Show with label */
  label?: string;
  /** Full screen spinner */
  fullscreen?: boolean;
}

export function Spinner({
  className,
  size = 'md',
  variant = 'default',
  label,
  fullscreen = false,
}: SpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]',
    xl: 'h-12 w-12 border-4',
  };

  const variantClasses = {
    default: 'border-muted border-t-foreground',
    primary: 'border-primary/30 border-t-primary',
    secondary: 'border-secondary border-t-secondary-foreground',
    muted: 'border-muted border-t-muted-foreground',
  };

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label={label || 'Loading'}
    >
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
        </div>
      </div>
    );
  }

  if (label) {
    return (
      <div className="flex items-center gap-2">
        {spinner}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    );
  }

  return spinner;
}

// Loading overlay for containers
export function LoadingOverlay({ loading, children, label }: { loading: boolean; children: React.ReactNode; label?: string }) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Spinner label={label} />
        </div>
      )}
    </div>
  );
}

Spinner.displayName = 'Spinner';
