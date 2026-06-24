'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const variantFill: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  accent: 'bg-accent',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const sizeTrack: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function ProgressBar({
  value,
  variant = 'accent',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label ?? 'Progress'}</span>
          <span className="font-semibold text-foreground">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-default-100', sizeTrack[size])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            variantFill[variant],
            animated && 'animate-pulse',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
