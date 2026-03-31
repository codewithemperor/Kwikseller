'use client';

import * as React from 'react';
import { cn } from '../utils';

/**
 * Skeleton - Loading skeleton component
 */

export interface SkeletonProps {
  /** Additional class names */
  className?: string;
  /** Animation variant */
  variant?: 'pulse' | 'wave' | 'none';
  /** Shape variant */
  shape?: 'text' | 'circular' | 'rectangular';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'pulse',
  shape = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
    none: '',
  };

  const shapeClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'bg-muted',
        variantClasses[variant],
        shapeClasses[shape],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Pre-built skeleton variants
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border p-4 space-y-4', className)}>
      <Skeleton className="h-40 w-full" shape="rectangular" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2 border-t">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      shape="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function SkeletonImage({ className }: { className?: string }) {
  return (
    <Skeleton shape="rectangular" className={cn('h-48 w-full', className)} />
  );
}

Skeleton.displayName = 'Skeleton';
