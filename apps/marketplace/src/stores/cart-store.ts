import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  poolOfferId?: string
  name: string
  price: number
  comparePrice?: number
  image: string
  quantity: number
  store?: string
  storeId?: string
  storeSlug?: string
  storeName?: string
  productType?: 'PHYSICAL' | 'DIGITAL'
  productSource?: 'VENDOR_STOCK' | 'POOL_RESALE' | 'GROUP_BUY'
  requiresShipping?: boolean
}

interface CartState {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void
  removeItem: (productId: string, storeSlug?: string) => void
  updateQuantity: (productId: string, quantity: number, storeSlug?: string) => void
  clearCart: () => void
  clearStoreCart: (storeSlug: string) => void
  toggleCart: () => void
  setCartOpen: (open: boolean) => void

  // Computed
  getItemsByStore: (storeSlug: string) => CartItem[]
  getStoreItemCount: (storeSlug: string) => number
  getStoreTotal: (storeSlug: string) => number
  itemCount: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const { items } = get()
        const existing = items.find(
          (i) => i.productId === item.productId && i.poolOfferId === item.poolOfferId
        )

        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId && i.poolOfferId === item.poolOfferId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({
            items: [...items, { ...item, id: `cart-${Date.now()}`, quantity: 1 }],
          })
        }
      },

      removeItem: (productId, storeSlug) => {
        set({
          items: get().items.filter((i) =>
            storeSlug
              ? !(i.productId === productId && i.storeSlug === storeSlug)
              : i.productId !== productId
          ),
        })
      },

      updateQuantity: (productId, quantity, storeSlug) => {
        if (quantity <= 0) {
          get().removeItem(productId, storeSlug)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && (!storeSlug || i.storeSlug === storeSlug) ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
      clearStoreCart: (storeSlug) =>
        set({ items: get().items.filter((item) => item.storeSlug !== storeSlug) }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      setCartOpen: (open) => set({ isOpen: open }),

      getItemsByStore: (storeSlug) =>
        get().items.filter((item) => item.storeSlug === storeSlug),
      getStoreItemCount: (storeSlug) =>
        get().items.filter((item) => item.storeSlug === storeSlug).length,
      getStoreTotal: (storeSlug) =>
        get()
          .items.filter((item) => item.storeSlug === storeSlug)
          .reduce((sum, item) => sum + item.price * item.quantity, 0),

      itemCount: () => get().items.length,

      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: 'kwikseller-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
