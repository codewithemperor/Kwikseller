import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const MAX_VISIBLE = 3

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    set((state) => {
      const newNotifications = [...state.notifications, { ...notification, id }]
      // Keep only the last MAX_VISIBLE notifications
      return { notifications: newNotifications.slice(-MAX_VISIBLE) }
    })

    // Auto-dismiss after duration
    const duration = notification.duration ?? 3000
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, duration)
    }
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  clearAll: () => set({ notifications: [] }),
}))

// Convenience helpers
export const notify = {
  success: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'success', title, message }),

  error: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'error', title, message, duration: 5000 }),

  info: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'info', title, message }),

  warning: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'warning', title, message, duration: 4000 }),
}
