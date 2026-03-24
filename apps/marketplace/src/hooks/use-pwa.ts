// KWIKSELLER - PWA Hooks
// Custom hooks for PWA functionality

'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { useUIStore } from '@/stores'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Hook to handle PWA installation
 * Manages the beforeinstallprompt event and provides install functionality
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const { pwaCanInstall, pwaInstallPromptShown, setPWACanInstall, setPWAInstallPromptShown } = useUIStore()

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setPWACanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [setPWACanInstall])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setInstallPrompt(null)
        setPWACanInstall(false)
        setPWAInstallPromptShown(true)
        return true
      }

      return false
    } catch (error) {
      console.error('PWA install error:', error)
      return false
    }
  }, [installPrompt, setPWACanInstall, setPWAInstallPromptShown])

  const isInstalled = typeof window !== 'undefined' && 
    window.matchMedia('(display-mode: standalone)').matches

  return {
    isInstalled,
    canInstall: pwaCanInstall,
    promptInstall,
    promptShown: pwaInstallPromptShown,
    setPromptShown: setPWAInstallPromptShown,
  }
}

/**
 * Hook to handle push notification permission
 * Requests permission and registers push subscription with backend
 */
export function useNotificationPermission() {
  // Use useSyncExternalStore for SSR-safe browser API access
  const isSupported = useSyncExternalStore(
    () => () => {}, // No subscription needed
    () => 'Notification' in window && 'serviceWorker' in navigator,
    () => false // Server-side default
  )

  // Subscribe to permission changes
  const subscribeToPermission = useCallback((callback: () => void) => {
    if (typeof window === 'undefined' || !('Permissions' in window)) {
      return () => {}
    }
    
    navigator.permissions.query({ name: 'notifications' }).then((status) => {
      status.addEventListener('change', callback)
    }).catch(() => {})
    
    return () => {}
  }, [])
  
  const permission = useSyncExternalStore(
    subscribeToPermission,
    () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return 'default'
      return Notification.permission
    },
    () => 'default' as NotificationPermission
  )

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      return result === 'granted'
    } catch (error) {
      console.error('Notification permission error:', error)
      return false
    }
  }, [isSupported])

  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return null

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Get VAPID public key from server
      const response = await fetch('/api/v1/notifications/push/vapid-public-key')
      const { data: vapidKey } = await response.json()

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })

      // Send subscription to server
      await fetch('/api/v1/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      return subscription
    } catch (error) {
      console.error('Push subscription error:', error)
      return null
    }
  }, [isSupported, permission])

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    requestPermission,
    subscribeToPush,
  }
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const { isOffline, setOffline } = useUIStore()

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)

    // Set initial state
    setOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOffline])

  return {
    isOnline: !isOffline,
    isOffline,
  }
}

/**
 * Hook for service worker update detection
 */
export function useServiceWorkerUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setHasUpdate(true)
              }
            })
          }
        })
      })
    }
  }, [])

  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [registration])

  return {
    hasUpdate,
    update,
  }
}
