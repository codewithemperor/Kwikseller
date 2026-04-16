import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CurrencyCode = 'NGN' | 'KES' | 'GHS' | 'USD'
export type LanguageCode = 'en' | 'fr' | 'sw'

export interface UserPreferences {
  currency: CurrencyCode
  language: LanguageCode
  notificationsEnabled: boolean
  newsletterEnabled: boolean
}

interface UserPreferencesState extends UserPreferences {
  setCurrency: (currency: CurrencyCode) => void
  setLanguage: (language: LanguageCode) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setNewsletterEnabled: (enabled: boolean) => void
  isOpen: boolean
  setOpen: (open: boolean) => void
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      currency: 'NGN',
      language: 'en',
      notificationsEnabled: true,
      newsletterEnabled: false,
      isOpen: false,
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNewsletterEnabled: (newsletterEnabled) => set({ newsletterEnabled }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'kwikseller-user-preferences',
      partialize: (state) => ({
        currency: state.currency,
        language: state.language,
        notificationsEnabled: state.notificationsEnabled,
        newsletterEnabled: state.newsletterEnabled,
      }),
    }
  )
)
