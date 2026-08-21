'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface KPIBadgeProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClass: Record<NonNullable<KPIBadgeProps['variant']>, string> = {
  default: 'bg-default-100 text-muted-foreground',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

export function KPIBadge({
  label,
  value,
  variant = 'default',
  size = 'md',
  className,
}: KPIBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        variantClass[variant],
        className,
      )}
    >
      <span className="opacity-80">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

export default KPIBadge;
