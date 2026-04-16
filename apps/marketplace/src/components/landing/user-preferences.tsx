'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Globe,
  DollarSign,
  Bell,
  Mail,
  Settings,
  Check,
} from 'lucide-react'
import { Button, Switch, Separator } from '@heroui/react'
import { cn } from '@kwikseller/ui'
import { useUserPreferencesStore, type CurrencyCode, type LanguageCode } from '@/stores'

// --- Config ---

const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', label: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
]

const languages: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili' },
]

// --- Component ---

export function UserPreferences() {
  const {
    currency,
    language,
    notificationsEnabled,
    newsletterEnabled,
    isOpen,
    setOpen,
    setCurrency,
    setLanguage,
    setNotificationsEnabled,
    setNewsletterEnabled,
  } = useUserPreferencesStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring' as const, damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] max-w-[92vw] bg-background border-l border-divider z-[60] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Preferences</h2>
                  <p className="text-xs text-default-400">Customize your experience</p>
                </div>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setOpen(false)}
                aria-label="Close preferences"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="px-6 py-5 space-y-6">
                {/* Currency Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-default-400" />
                    <h3 className="text-sm font-semibold">Currency</h3>
                  </div>
                  <p className="text-xs text-default-400 mb-3">
                    Select your preferred currency for prices
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {currencies.map((c) => (
                      <motion.button
                        key={c.code}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCurrency(c.code)}
                        className={cn(
                          'relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                          currency === c.code
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-divider hover:border-default-300 hover:bg-default-50'
                        )}
                      >
                        {currency === c.code && (
                          <motion.div
                            layoutId="currency-check"
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                            transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                        <span className="text-lg font-bold text-default-600">{c.symbol}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.code}</p>
                          <p className="text-[10px] text-default-400 truncate">{c.label}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <Separator />

                {/* Language Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-default-400" />
                    <h3 className="text-sm font-semibold">Language</h3>
                  </div>
                  <p className="text-xs text-default-400 mb-3">
                    Choose your preferred language
                  </p>
                  <div className="space-y-2">
                    {languages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                          'relative w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                          language === lang.code
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-divider hover:border-default-300 hover:bg-default-50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base font-medium">{lang.native}</span>
                          <span className="text-sm text-default-500">{lang.label}</span>
                        </div>
                        {language === lang.code && (
                          <motion.div
                            layoutId="language-check"
                            className="w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                            transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </section>

                <Separator />

                {/* Notification Toggles Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-default-400" />
                    <h3 className="text-sm font-semibold">Notifications</h3>
                  </div>
                  <p className="text-xs text-default-400 mb-3">
                    Manage your notification preferences
                  </p>

                  <div className="space-y-3">
                    {/* Push Notifications */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-divider bg-default-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Bell className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Push Notifications</p>
                          <p className="text-[11px] text-default-400">Order updates & promotions</p>
                        </div>
                      </div>
                      <Switch
                        isSelected={notificationsEnabled}
                        onChange={setNotificationsEnabled}
                        size="sm"
                      />
                    </div>

                    {/* Newsletter */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-divider bg-default-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Newsletter</p>
                          <p className="text-[11px] text-default-400">Weekly deals & tips</p>
                        </div>
                      </div>
                      <Switch
                        isSelected={newsletterEnabled}
                        onChange={setNewsletterEnabled}
                        size="sm"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-divider px-6 py-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full kwik-shadow"
                onPress={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
