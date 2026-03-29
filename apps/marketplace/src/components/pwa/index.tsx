'use client'

import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button, Card } from '@kwikseller/ui'

interface InstallBannerProps {
  variant?: 'banner' | 'card'
  showAfterVisits?: number
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

  // Check if already installed
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    return null
  }

  // Handle beforeinstallprompt event
  if (typeof window !== 'undefined' && !installPrompt) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    })
  }

  // Don't show if can't install, already dismissed
  if (!canInstall || dismissed) {
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
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Install KWIKSELLER</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add to your home screen for the best shopping experience with offline access.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall}>
                Install Now
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Maybe Later
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg">
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
              onClick={handleInstall}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              Install
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
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

export function OfflineBanner() {
  // Check if online
  const isOnline = typeof window !== 'undefined' ? navigator.onLine : true
  
  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-medium">You&apos;re offline</span>
          <span className="text-white/80">- Some features may be limited</span>
        </div>
      </div>
    </div>
  )
}
