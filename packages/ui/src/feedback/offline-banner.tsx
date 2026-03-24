'use client';

import * as React from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { cn } from '../utils';

/**
 * OfflineBanner - Auto-shows when offline, auto-hides on reconnect
 */

export interface OfflineBannerProps {
  /** Additional class names */
  className?: string;
  /** Custom message */
  message?: string;
  /** Show reconnect button */
  showReconnect?: boolean;
  /** Reconnect callback */
  onReconnect?: () => void;
  /** Dismissible */
  dismissible?: boolean;
  /** Position */
  position?: 'top' | 'bottom';
}

export function OfflineBanner({
  className,
  message = 'You are offline. Some features may be unavailable.',
  showReconnect = true,
  onReconnect,
  dismissible = false,
  position = 'top',
}: OfflineBannerProps) {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [dismissed, setDismissed] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReconnect = async () => {
    setIsRetrying(true);
    try {
      // Try to fetch a small resource to check connectivity
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      onReconnect?.();
    } catch {
      // Still offline
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't render if online or dismissed
  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-amber-950 text-sm font-medium',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      role="alert"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-center">{message}</span>
      {showReconnect && (
        <button
          onClick={handleReconnect}
          disabled={isRetrying}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
          <span className="hidden sm:inline">Retry</span>
        </button>
      )}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-amber-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

OfflineBanner.displayName = 'OfflineBanner';

// Connection status indicator
export function ConnectionStatus({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        isOnline ? 'text-green-600' : 'text-amber-500',
        className
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
