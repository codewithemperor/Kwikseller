"use client"

// Re-export sonner toast functions for backward compatibility
// The app now uses sonner for toasts
export { toast, Toaster } from 'sonner'

// Type exports for compatibility
export type { ExternalToast as ToastProps } from 'sonner'

// useToast hook that wraps sonner's toast
import { toast as sonnerToast } from 'sonner'

interface UseToastReturn {
  toast: typeof sonnerToast
  dismiss: (toastId?: string) => void
}

export function useToast(): UseToastReturn {
  return {
    toast: sonnerToast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId)
      } else {
        sonnerToast.dismiss()
      }
    },
  }
}
