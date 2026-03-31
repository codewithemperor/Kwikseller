'use client'

import React from 'react'
import { Spinner } from '@heroui/react'
import { cn } from '../lib/utils'

export interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  label?: string
  blur?: boolean
  className?: string
}

/**
 * LoadingOverlay - A shared loading overlay component
 */
export function LoadingOverlay({
  isLoading,
  children,
  label = 'Loading...',
  blur = true,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      
      {isLoading && (
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-50',
          blur && 'backdrop-blur-sm'
        )}>
          <Spinner size="lg" />
          {label && (
            <p className="mt-2 text-sm text-default-500">{label}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default LoadingOverlay
