"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { Cookie, Shield, Settings, X, Check } from "lucide-react";
import { CookiePreferencesModal, type CookiePreferences } from "@/components/modals/cookie-preferences-modal";

const CONSENT_KEY = "kwikseller-cookie-consent";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  useEffect(() => {
    let shouldShow = false;
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        shouldShow = true;
      }
    } catch {
      shouldShow = true;
    }

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: true,
          acceptedAt: Date.now(),
        }),
      );
    } catch {
      // Silently fail
    }
    setIsVisible(false);
  }, []);

  const handleCustomizeSave = useCallback((prefs: CookiePreferences) => {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ ...prefs, acceptedAt: Date.now() }),
      );
    } catch {
      // Silently fail
    }
    setIsVisible(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40"
            role="dialog"
            aria-label="Cookie consent"
          >
            <div className="bg-background/95 backdrop-blur-lg border-t border-divider shadow-2xl">
              <div className="container mx-auto px-0 md:px-4  py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Cookie icon + message */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <motion.div
                      initial={{ rotate: -20, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: 0.3,
                      }}
                      className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"
                    >
                      <Cookie className="w-5 h-5 text-accent" />
                    </motion.div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold">
                          We value your privacy
                        </h3>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.5, duration: 0.3 }}
                        >
                          <Shield className="w-3.5 h-3.5 text-success" />
                        </motion.div>
                      </div>
                      <p className="text-xs text-default-500 leading-relaxed">
                        We use cookies to enhance your browsing experience,
                        serve personalized content, and analyze our traffic. By
                        clicking &quot;Accept All&quot;, you consent to our use
                        of cookies.{" "}
                        <a href="#" className="text-accent hover:underline">
                          Learn more
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setIsCustomizeOpen(true)}
                      className="flex-1 sm:flex-none"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Customize
                    </Button>
                    <Button
                      size="sm"
                      onPress={handleAcceptAll}
                      className="flex-1 sm:flex-none kwik-gradient text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept All
                    </Button>
                    <Button
                      isIconOnly
                      variant="tertiary"
                      size="sm"
                      onPress={handleAcceptAll}
                      className="hidden sm:flex text-default-400 hover:text-foreground"
                      aria-label="Dismiss cookie banner"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookiePreferencesModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        onSave={handleCustomizeSave}
      />
    </>
  );
}
