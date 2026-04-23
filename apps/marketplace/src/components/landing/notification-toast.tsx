'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useNotificationStore, type NotificationType } from '@/stores/notification-store'

// Icon map for notification types
const ICON_MAP: Record<NotificationType, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  success: {
    icon: CheckCircle2,
    colorClass: 'text-kwik-green',
    bgClass: 'bg-kwik-green/10 border-kwik-green/20',
  },
  error: {
    icon: XCircle,
    colorClass: 'text-kwik-red',
    bgClass: 'bg-kwik-red/10 border-kwik-red/20',
  },
  info: {
    icon: Info,
    colorClass: 'text-kwik-blue',
    bgClass: 'bg-kwik-blue/10 border-kwik-blue/20',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-kwik-amber',
    bgClass: 'bg-kwik-amber/10 border-kwik-amber/20',
  },
}

// Slide-in variants
const toastVariants = {
  initial: { opacity: 0, x: 80, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 120, scale: 0.85 },
}

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: { id: string; type: NotificationType; title: string; message?: string }
  onDismiss: () => void
}) {
  const { icon: Icon, colorClass, bgClass } = ICON_MAP[notification.type]

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`relative flex items-start gap-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border p-4 shadow-xl backdrop-blur-xl ${bgClass} bg-background/90`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kwik-bg-surface ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kwik-dark leading-tight">
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 text-xs text-kwik-gray-light leading-relaxed">
            {notification.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-kwik-muted hover:text-kwik-dark hover:bg-kwik-bg-surface transition-colors duration-200"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--kwik-border)' }}
      >
        <motion.div
          className={`h-full rounded-full ${notification.type === 'success' ? 'bg-kwik-green' : notification.type === 'error' ? 'bg-kwik-red' : notification.type === 'warning' ? 'bg-kwik-amber' : 'bg-kwik-blue'}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 3, ease: 'linear' }}
        />
      </motion.div>
    </motion.div>
  )
}

export function NotificationToastStack() {
  const { notifications, removeNotification } = useNotificationStore()
  const [mounted, setMounted] = React.useState(false)

  React.useLayoutEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || notifications.length === 0) return null

  return (
    <div
      className="fixed top-20 right-4 z-[110] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className="pointer-events-auto"
          >
            <NotificationToast
              notification={notification}
              onDismiss={() => removeNotification(notification.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
