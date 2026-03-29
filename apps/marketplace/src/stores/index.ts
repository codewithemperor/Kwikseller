// KWIKSELLER - UI Store
// Global UI state management using Zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // PWA state
  pwaCanInstall: boolean
  pwaInstallPromptShown: boolean
  setPWACanInstall: (value: boolean) => void
  setPWAInstallPromptShown: (value: boolean) => void

  // Offline state
  isOffline: boolean
  setOffline: (value: boolean) => void

  // Sidebar state
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  setSidebarOpen: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  toggleSidebar: () => void

  // Theme state
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Modal/Dialog state
  activeModal: string | null
  setActiveModal: (modal: string | null) => void

  // Toast notifications queue
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // PWA state
      pwaCanInstall: false,
      pwaInstallPromptShown: false,
      setPWACanInstall: (value) => set({ pwaCanInstall: value }),
      setPWAInstallPromptShown: (value) => set({ pwaInstallPromptShown: value }),

      // Offline state
      isOffline: false,
      setOffline: (value) => set({ isOffline: value }),

      // Sidebar state
      sidebarOpen: true,
      sidebarCollapsed: false,
      setSidebarOpen: (value) => set({ sidebarOpen: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),

      // Theme state
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Modal state
      activeModal: null,
      setActiveModal: (modal) => set({ activeModal: modal }),

      // Toast notifications
      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9)
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }))
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),
      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'kwikseller-ui-store',
      partialize: (state) => ({
        pwaInstallPromptShown: state.pwaInstallPromptShown,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)

// Export individual hooks for specific state slices
export const usePWAState = () => useUIStore((state) => ({
  pwaCanInstall: state.pwaCanInstall,
  pwaInstallPromptShown: state.pwaInstallPromptShown,
  setPWACanInstall: state.setPWACanInstall,
  setPWAInstallPromptShown: state.setPWAInstallPromptShown,
}))

export const useOfflineState = () => useUIStore((state) => ({
  isOffline: state.isOffline,
  setOffline: state.setOffline,
}))

export const useSidebarState = () => useUIStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  sidebarCollapsed: state.sidebarCollapsed,
  setSidebarOpen: state.setSidebarOpen,
  setSidebarCollapsed: state.setSidebarCollapsed,
  toggleSidebar: state.toggleSidebar,
}))

export const useThemeState = () => useUIStore((state) => ({
  theme: state.theme,
  setTheme: state.setTheme,
}))
