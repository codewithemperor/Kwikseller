'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  unoptimized?: boolean;
}

export function AppImage({
  src,
  alt,
  className,
  fallbackClassName,
  iconClassName,
  objectFit = 'cover',
}: AppImageProps) {
  const [error, setError] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    return (
      <div
        className={cn(
          'bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center',
          fallbackClassName || className
        )}
      >
        <ImageOff
          className={cn(
            'h-8 w-8 text-neutral-400 dark:text-neutral-600',
            iconClassName
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center animate-pulse">
          <ImageOff className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300 w-full h-full',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{ objectFit }}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
