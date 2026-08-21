"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { Settings, X, Check } from "lucide-react";

export interface CookiePreferences {
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

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prefs: CookiePreferences) => void;
}

export function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave,
}: CookiePreferencesModalProps) {
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
