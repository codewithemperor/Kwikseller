'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Skeleton } from '../feedback/skeleton';

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'solid' | 'soft';
  format?: 'number' | 'currency';
  isLoading?: boolean;
  className?: string;
}

const variantSurface: Record<NonNullable<MetricCardProps['variant']>, string> = {
  default: 'border border-kwik-border bg-surface text-foreground',
  solid: 'border border-accent/40 bg-accent text-accent-foreground',
  soft: 'border border-accent/20 bg-accent/10 text-accent-soft-foreground',
};

const variantIcon: Record<NonNullable<MetricCardProps['variant']>, string> = {
  default: 'bg-accent/10 text-accent',
  solid: 'bg-accent-foreground/15 text-accent-foreground',
  soft: 'bg-accent/15 text-accent',
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  format = 'number',
  isLoading = false,
  className,
}: MetricCardProps) {
  const displayValue =
    typeof value === 'string'
      ? value
      : format === 'currency'
        ? formatCurrency(value)
        : value.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={cn('rounded-2xl p-5', variantSurface[variant], className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-24" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold tracking-tight">{displayValue}</p>
          )}
        </div>
        {Icon && (
          <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', variantIcon[variant])}>
            <Icon className="h-6 w-6" />
          </span>
        )}
      </div>
      {(trend || description || isLoading) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {isLoading ? (
            <Skeleton className="h-4 w-28" />
          ) : (
            <>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                    trend.isPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  )}
                >
                  {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && <span className="truncate text-muted-foreground">{description}</span>}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default MetricCard;
