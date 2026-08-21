'use client';

import React, { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { cn, getInitials } from '../lib/utils';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isVerified?: boolean;
  className?: string;
}

const sizeClass: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const verifiedSize: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
};

export function Avatar({ src, name, size = 'md', isVerified, className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent font-semibold',
          sizeClass[size],
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name ?? 'avatar'}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{name ? getInitials(name) : '?'}</span>
        )}
      </span>
      {isVerified && (
        <BadgeCheck
          className={cn(
            'absolute -bottom-0.5 -right-0.5 fill-emerald-500 text-white',
            verifiedSize[size],
          )}
        />
      )}
    </span>
  );
}

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export function AvatarGroup({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - visible.length;

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((avatar, idx) => (
        <span
          key={idx}
          className="ring-2 ring-background rounded-full"
          style={{ marginLeft: idx === 0 ? 0 : '-8px', zIndex: visible.length - idx }}
        >
          <Avatar {...avatar} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'ring-2 ring-background rounded-full flex items-center justify-center bg-default-100 text-muted-foreground font-semibold',
            sizeClass[size],
          )}
          style={{ marginLeft: '-8px' }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default Avatar;
