'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface StockBadgeProps {
  stock: number;
  lowStockThreshold?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
  className?: string;
}

export function StockBadge({
  stock,
  lowStockThreshold = 10,
  size = 'md',
  showCount = true,
  className,
}: StockBadgeProps) {
  const isOut = stock <= 0;
  const isLow = stock > 0 && stock <= lowStockThreshold;
  const inStock = stock > lowStockThreshold;

  const config = isOut
    ? { label: 'Out of Stock', cls: 'bg-red-500/10 text-red-600 dark:text-red-400', pulse: false }
    : isLow
      ? {
          label: showCount ? `Low Stock: ${stock} left` : 'Low Stock',
          cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          pulse: true,
        }
      : {
          label: showCount ? `${stock} in stock` : 'In Stock',
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          pulse: false,
        };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.cls,
        config.pulse && 'animate-pulse',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500',
        )}
      />
      {config.label}
    </span>
  );
}

export default StockBadge;
