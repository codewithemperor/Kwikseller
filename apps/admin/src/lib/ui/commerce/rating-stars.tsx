'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

export interface RatingStarsProps {
  rating: number; // 0-5
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const sizeClass: Record<NonNullable<RatingStarsProps['size']>, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-[18px] w-[18px]',
  lg: 'h-6 w-6',
};

export function RatingStars({
  rating,
  count,
  size = 'md',
  showCount = true,
  className,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.25 && clamped - fullStars < 0.75;
  const roundUp = clamped - fullStars >= 0.75;
  const filledStars = roundUp ? fullStars + 1 : fullStars;
  const emptyStars = 5 - filledStars - (hasHalf ? 1 : 0);

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: filledStars }).map((_, i) => (
          <Star key={`full-${i}`} className={cn(sizeClass[size], 'fill-amber-400 text-amber-400')} />
        ))}
        {hasHalf && (
          <span className="relative inline-flex">
            <Star className={cn(sizeClass[size], 'text-muted-foreground/30')} />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: '50%' }}
            >
              <Star className={cn(sizeClass[size], 'fill-amber-400 text-amber-400')} />
            </span>
          </span>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={cn(sizeClass[size], 'text-muted-foreground/30')} />
        ))}
      </div>
      <span className="text-xs font-medium text-foreground">
        {clamped.toFixed(1)}
      </span>
      {showCount && typeof count === 'number' && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

export default RatingStars;
