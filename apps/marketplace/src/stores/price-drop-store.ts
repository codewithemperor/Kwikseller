import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PriceRecord {
  id: string
  name: string
  image: string
  lastSeenPrice: number
  currentPrice: number
  detectedAt: number
  dismissed: boolean
}

interface PriceDropState {
  // Map of productId -> last seen price
  trackedProducts: Record<string, { name: string; image: string; price: number; viewedAt: number }>

  // Detected alerts
  alerts: PriceRecord[]

  // Record product view
  recordView: (id: string, name: string, image: string, price: number) => void

  // Check for price drops (returns new alerts)
  checkPriceDrop: (id: string, name: string, image: string, currentPrice: number) => PriceRecord | null

  // Dismiss an alert
  dismissAlert: (id: string) => void

  // Clear all alerts
  clearAlerts: () => void

  // Get active (non-dismissed) alerts
  getActiveAlerts: () => PriceRecord[]
}

const MAX_TRACKED = 50

export const usePriceDropStore = create<PriceDropState>()(
  persist(
    (set, get) => ({
      trackedProducts: {},
      alerts: [],

      recordView: (id, name, image, price) => {
        set((state) => {
          // Keep at most MAX_TRACKED entries
          const tracked = { ...state.trackedProducts }
          if (!(id in tracked)) {
            const keys = Object.keys(tracked)
            if (keys.length >= MAX_TRACKED) {
              // Remove oldest
              const sorted = keys.sort(
                (a, b) => tracked[a].viewedAt - tracked[b].viewedAt,
              )
              for (let i = 0; i <= keys.length - MAX_TRACKED; i++) {
                delete tracked[sorted[i]]
              }
            }
          }
          tracked[id] = { name, image, price, viewedAt: Date.now() }
          return { trackedProducts: tracked }
        })
      },

      checkPriceDrop: (id, name, image, currentPrice) => {
        const state = get()
        const tracked = state.trackedProducts[id]

        if (!tracked) {
          // First time seeing this product — just record it
          state.recordView(id, name, image, currentPrice)
          return null
        }

        if (currentPrice < tracked.price) {
          // Price dropped! Create an alert
          const alert: PriceRecord = {
            id,
            name,
            image,
            lastSeenPrice: tracked.price,
            currentPrice,
            detectedAt: Date.now(),
            dismissed: false,
          }

          // Update the tracked price to the new lower price
          const updatedTracked = { ...state.trackedProducts }
          updatedTracked[id] = { name, image, price: currentPrice, viewedAt: Date.now() }

          set({
            trackedProducts: updatedTracked,
            alerts: [alert, ...state.alerts].slice(0, 20),
          })

          return alert
        } else {
          // Same or higher price — update the tracked price
          const updatedTracked = { ...state.trackedProducts }
          updatedTracked[id] = { name, image, price: currentPrice, viewedAt: Date.now() }
          set({ trackedProducts: updatedTracked })
          return null
        }
      },

      dismissAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, dismissed: true } : a,
          ),
        }))
      },

      clearAlerts: () => set({ alerts: [] }),

      getActiveAlerts: () => {
        return get().alerts.filter((a) => !a.dismissed)
      },
    }),
    {
      name: 'kwikseller-price-drop',
      partialize: (state) => ({
        trackedProducts: state.trackedProducts,
        alerts: state.alerts,
      }),
    },
  ),
)
