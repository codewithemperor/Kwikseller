import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CompareProduct {
  id: string
  name: string
  price: number
  comparePrice?: number
  image: string
  category: string
  rating: number
  reviews: number
  store: string
  specs: Record<string, string>
}

interface CompareState {
  products: CompareProduct[]
  isOpen: boolean
  maxProducts: number
  addProduct: (product: CompareProduct) => boolean
  removeProduct: (id: string) => void
  clearAll: () => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  isInCompare: (id: string) => boolean
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      products: [],
      isOpen: false,
      maxProducts: 4,

      addProduct: (product) => {
        const { products, maxProducts } = get()
        const exists = products.some((p) => p.id === product.id)
        if (exists) return true // already in compare, allow
        if (products.length >= maxProducts) return false // max reached
        const updated = [...products, product]
        set({ products: updated })
        return true
      },

      removeProduct: (id) => {
        const updated = get().products.filter((p) => p.id !== id)
        set({ products: updated })
      },

      clearAll: () => {
        set({ products: [], isOpen: false })
      },

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set({ isOpen: !get().isOpen }),

      isInCompare: (id) => {
        return get().products.some((p) => p.id === id)
      },
    }),
    {
      name: 'kwikseller-compare',
      partialize: (state) => ({ products: state.products }),
    }
  )
)
