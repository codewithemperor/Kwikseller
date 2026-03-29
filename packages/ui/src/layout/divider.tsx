'use client';

import * as React from 'react';
import { cn } from '../components/utils';

/**
 * Divider - Visual divider component
 */

export interface DividerProps {
  /** Additional class names */
  className?: string;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Variant */
  variant?: 'solid' | 'dashed' | 'dotted';
  /** Show with label */
  label?: string;
  /** Label position */
  labelPosition?: 'left' | 'center' | 'right';
}

export function Divider({
  className,
  orientation = 'horizontal',
  variant = 'solid',
  label,
  labelPosition = 'center',
}: DividerProps) {
  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  if (label && orientation === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        {labelPosition !== 'left' && (
          <div className={cn('flex-1 border-t', variantClasses[variant])} />
        )}
        <span className="text-sm text-muted-foreground shrink-0">{label}</span>
        {labelPosition !== 'right' && (
          <div className={cn('flex-1 border-t', variantClasses[variant])} />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        orientation === 'horizontal' ? 'w-full border-t' : 'h-full border-l self-stretch',
        variantClasses[variant],
        className
      )}
      role="separator"
      aria-orientation={orientation}
    />
  );
}

Divider.displayName = 'Divider';
