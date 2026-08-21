'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Skeleton } from '../feedback/skeleton';

export interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: { value: number; isPositive: boolean; label?: string };
  format?: 'number' | 'currency' | 'percentage';
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorMap: Record<NonNullable<StatsCardProps['color']>, { bg: string; text: string }> = {
  accent: { bg: 'bg-accent/10', text: 'text-accent' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  danger: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
};

function formatValue(value: number | string, format: StatsCardProps['format']): string {
  if (typeof value === 'string') return value;
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percentage') return `${value}%`;
  return value.toLocaleString();
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  format = 'number',
  color = 'accent',
  isLoading = false,
  onClick,
  className,
}: StatsCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-kwik-border bg-surface p-5',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">{formatValue(value, format)}</p>
          )}
        </div>
        {Icon && (
          <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', c.bg)}>
            <Icon className={cn('h-6 w-6', c.text)} />
          </span>
        )}
      </div>
      {(trend || isLoading) && (
        <div className="mt-3">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : trend ? (
            <p
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-danger',
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend.isPositive ? '+' : ''}
              {trend.value}%
              {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
            </p>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}

export default StatsCard;
