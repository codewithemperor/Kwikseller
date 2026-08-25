'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useNotificationStore, type NotificationType } from '@/stores/notification-store'

// Icon map for notification types
const ICON_MAP: Record<NotificationType, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  success: {
    icon: CheckCircle2,
    colorClass: 'text-success-foreground',
    bgClass: 'bg-success border-success text-success-foreground',
  },
  error: {
    icon: XCircle,
    colorClass: 'text-danger-foreground',
    bgClass: 'bg-danger border-danger text-danger-foreground',
  },
  info: {
    icon: Info,
    colorClass: 'text-white',
    bgClass: 'bg-kwik-blue border-kwik-blue text-white',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-warning-foreground',
    bgClass: 'bg-warning border-warning text-warning-foreground',
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
      className={`relative flex items-start gap-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border p-4 shadow-none ${bgClass}`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 text-xs leading-relaxed opacity-80">
            {notification.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-current/70 transition-colors duration-200 hover:bg-white/15 hover:text-current"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgb(255 255 255 / 0.18)' }}
      >
        <motion.div
          className="h-full rounded-full bg-white/80"
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
