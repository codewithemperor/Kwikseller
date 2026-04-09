import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentlyViewedItem {
  id: string
  name: string
  price: number
  comparePrice?: number
  image: string
  store: string
  viewedAt: number
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[]

  // Actions
  addItem: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void
  clearAll: () => void
}

const MAX_ITEMS = 12

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Remove duplicate if it already exists
          const filtered = state.items.filter((i) => i.id !== item.id)

          // Add to front with current timestamp
          const newItem: RecentlyViewedItem = {
            ...item,
            viewedAt: Date.now(),
          }

          // Keep only MAX_ITEMS
          const updated = [newItem, ...filtered].slice(0, MAX_ITEMS)

          return { items: updated }
        })
      },

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'kwikseller-recently-viewed',
    }
  )
)
