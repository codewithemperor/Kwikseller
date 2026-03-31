'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button, Card } from '@heroui/react'

interface InstallBannerProps {
  variant?: 'banner' | 'card'
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner({ variant = 'card' }: InstallBannerProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener)
    }
  }, [])

  // Don't show if can't install, already dismissed, or already installed
  if (!canInstall || dismissed || isInstalled) {
    return null
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    
    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        setInstallPrompt(null)
        setCanInstall(false)
      }
    } catch (error) {
      console.error('Install error:', error)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  if (variant === 'card') {
    return (
      <Card className="border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Install KWIKSELLER</h3>
            <p className="text-sm text-default-500 mt-1">
              Add to your home screen for the best shopping experience with offline access.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="primary" onPress={handleInstall}>
                Install Now
              </Button>
              <Button size="sm" variant="ghost" onPress={handleDismiss}>
                Maybe Later
              </Button>
            </div>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Install KWIKSELLER for quick access and offline shopping
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={handleInstall}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              Install
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={handleDismiss}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
