"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { Cookie, Shield, Settings, X, Check } from "lucide-react";

const CONSENT_KEY = "kwikseller-cookie-consent";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: true,
  marketing: false,
};

const cookieDescriptions: {
  key: keyof CookiePreferences;
  label: string;
  description: string;
  required: boolean;
}[] = [
  {
    key: "essential",
    label: "Essential",
    description:
      "Required for the site to function properly. These cannot be disabled.",
    required: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    description:
      "Help us understand how visitors interact with the site to improve your experience.",
    required: false,
  },
  {
    key: "marketing",
    label: "Marketing",
    description:
      "Used to track visitors across websites to display relevant advertisements.",
    required: false,
  },
];

function CustomizeModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prefs: CookiePreferences) => void;
}) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    ...defaultPreferences,
  });
  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Reset preferences when modal opens (using non-effect pattern)
  if (isOpen && !prevOpen) {
    setPreferences({ ...defaultPreferences });
  }
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
  }

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === "essential") return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(preferences);
    onClose();
  };

  const handleAcceptAll = () => {
    onSave({ essential: true, analytics: true, marketing: true });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-divider z-[81] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 p-6 pb-4">
              <Settings className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-bold">Cookie Preferences</h3>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={onClose}
                className="ml-auto"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="px-6 pb-2">
              <p className="text-sm text-default-500 mb-4">
                Manage your cookie preferences below. You can change these
                settings at any time.
              </p>
              <div className="flex flex-col gap-3">
                {cookieDescriptions.map((cookie) => (
                  <div
                    key={cookie.key}
                    className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors ${
                      cookie.required
                        ? "bg-accent-soft/30 border-accent/20"
                        : "bg-default-50 border-divider"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          {cookie.label}
                        </span>
                        {cookie.required && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-default-400 leading-relaxed">
                        {cookie.description}
                      </p>
                    </div>
                    {/* Toggle switch */}
                    <button
                      role="switch"
                      aria-checked={preferences[cookie.key]}
                      disabled={cookie.required}
                      onClick={() => handleToggle(cookie.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-1 ${
                        preferences[cookie.key] ? "bg-accent" : "bg-default-200"
                      } ${cookie.required ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          preferences[cookie.key]
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-6 pt-4">
              <Button variant="outline" onPress={onClose}>
                Cancel
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onPress={handleSave}>
                Save Preferences
              </Button>
              <Button
                className="kwik-gradient text-white"
                onPress={handleAcceptAll}
              >
                Accept All
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

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

      <CustomizeModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        onSave={handleCustomizeSave}
      />
    </>
  );
}
