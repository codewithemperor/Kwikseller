import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WishlistItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  category: string
}

interface WishlistState {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
  clearAll: () => void
  toggleItem: (item: WishlistItem) => void
  itemCount: number
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,

      addItem: (item) => {
        const { items } = get()
        const exists = items.some((i) => i.id === item.id)
        if (exists) return // dedupe — don't add duplicate
        const updated = [...items, item]
        set({ items: updated, itemCount: updated.length })
      },

      removeItem: (id) => {
        const updated = get().items.filter((i) => i.id !== id)
        set({ items: updated, itemCount: updated.length })
      },

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id)
      },

      clearAll: () => {
        set({ items: [], itemCount: 0 })
      },

      toggleItem: (item) => {
        const { items } = get()
        const exists = items.some((i) => i.id === item.id)
        let updated
        if (exists) {
          updated = items.filter((i) => i.id !== item.id)
        } else {
          updated = [...items, item]
        }
        set({ items: updated, itemCount: updated.length })
      },
    }),
    {
      name: 'kwikseller-wishlist',
    }
  )
)
