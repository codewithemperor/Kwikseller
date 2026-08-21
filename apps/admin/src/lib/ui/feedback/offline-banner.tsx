'use client'

import React, { useState, useEffect } from 'react'
import { Card, Chip } from '@heroui/react'
import { cn } from '../lib/utils'
import { Wifi, WifiOff } from 'lucide-react'

export interface OfflineBannerProps {
  className?: string
}

/**
 * OfflineBanner - A shared offline detection banner
 * Uses HeroUI Card component
 */
export function OfflineBanner({ className }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <Card
      className={cn('sticky top-0 z-50 rounded-none bg-warning px-4 py-3', className)}
    >
      <div className="flex items-center justify-center gap-2 text-warning-foreground">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">
          You&apos;re offline - Some features may not be available
        </span>
      </div>
    </Card>
  )
}

/**
 * ConnectionStatus - A connection status indicator
 * Uses HeroUI Chip component
 */
export function ConnectionStatus({ className }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isOnline ? (
        <Chip
          size="sm"
          variant="soft"
          color="success"
        >
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            <span>Online</span>
          </div>
        </Chip>
      ) : (
        <Chip
          size="sm"
          variant="soft"
          color="danger"
        >
          <div className="flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        </Chip>
      )}
    </div>
  )
}

export default OfflineBanner
