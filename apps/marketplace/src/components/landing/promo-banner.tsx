"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Truck, Gift } from "lucide-react";

const promos = [
  {
    icon: Zap,
    text: "Flash Sale! Up to 50% off on Electronics this weekend",
    color: "text-warning",
  },
  {
    icon: Truck,
    text: "Free delivery on orders over ₦10,000 across Nigeria",
    color: "text-success",
  },
  {
    icon: Gift,
    text: "New vendors get 100 KwikCoins free — Start selling today!",
    color: "text-accent",
  },
];

export function PromoBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (isDismissed) return null;

  const promo = promos[currentIndex];
  if (!promo) return null;
  const Icon = promo.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-accent/5 border-b border-accent/10 overflow-hidden"
      >
        <div className="container mx-auto px-0 md:px-4 ">
          <div className="flex items-center justify-center py-2.5 gap-3 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 text-sm"
              >
                <Icon className={`w-4 h-4 ${promo.color}`} />
                <span className="text-default-600 font-medium">
                  {promo.text}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="absolute right-10 hidden sm:flex items-center gap-1">
              {promos.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentIndex ? "bg-accent" : "bg-default-300"
                  }`}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-accent/10 flex items-center justify-center transition-colors"
              aria-label="Dismiss promotion banner"
            >
              <X className="w-3.5 h-3.5 text-default-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
