"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  X,
  MapPin,
  Bell,
  Tag,
  ChevronRight,
  Package,
} from "lucide-react";
import { Button } from "@heroui/react";

const DISMISS_KEY = "kwikseller-app-banner-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Package,
    title: "Order on the go",
    description:
      "Browse and buy from thousands of African vendors anywhere, anytime.",
  },
  {
    icon: MapPin,
    title: "Real-time tracking",
    description:
      "Track your deliveries live with real-time updates and notifications.",
  },
  {
    icon: Tag,
    title: "Exclusive app deals",
    description:
      "Get access to special discounts and flash sales only on the app.",
  },
];

function PhoneMockup() {
  return (
    <div className="relative w-[220px] h-[440px] md:w-[260px] md:h-[520px] mx-auto">
      {/* Phone frame */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-foreground/90 shadow-2xl overflow-hidden border-4 border-foreground/80">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-6 bg-foreground rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[2.2rem] bg-background overflow-hidden">
          {/* Status bar */}
          <div className="h-10 bg-background flex items-end justify-center pb-1">
            <div className="w-20 h-1 rounded-full bg-default-200" />
          </div>

          {/* App content mockup */}
          <div className="px-3 pt-2 space-y-3">
            {/* Search bar */}
            <div className="h-8 rounded-xl bg-default-100 flex items-center px-3 gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-default-300" />
              <div className="flex-1 h-2 rounded-full bg-default-200" />
            </div>

            {/* Banner */}
            <div className="h-20 rounded-xl kwik-gradient flex items-center justify-center overflow-hidden">
              <div className="relative text-center">
                <p className="text-white/60 text-[9px] font-medium uppercase tracking-wider">
                  KWIKSELLER
                </p>
                <p className="text-white text-xs font-bold mt-0.5">
                  Shop Smarter
                </p>
                <p className="text-white/70 text-[8px] mt-0.5">Up to 50% off</p>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                  <span className="text-white text-[8px] font-medium">
                    Shop Now
                  </span>
                  <ChevronRight className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />
              <div className="absolute -left-2 -bottom-2 w-12 h-12 rounded-full bg-white/5" />
            </div>

            {/* Category circles */}
            <div className="flex justify-around px-1">
              {["Fashion", "Tech", "Beauty"].map((cat) => (
                <div key={cat} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center">
                    <div className="w-5 h-5 rounded bg-default-200" />
                  </div>
                  <span className="text-[8px] text-default-500">{cat}</span>
                </div>
              ))}
            </div>

            {/* Product cards */}
            <div className="flex gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex-1 bg-default-50 rounded-xl overflow-hidden"
                >
                  <div className="h-16 bg-default-100" />
                  <div className="p-1.5 space-y-1">
                    <div className="h-1.5 w-3/4 rounded-full bg-default-200" />
                    <div className="h-1.5 w-1/2 rounded-full bg-default-200" />
                    <div className="flex gap-1 items-center mt-1">
                      <div className="h-2 w-10 rounded-full bg-accent/20" />
                      <div className="h-2 w-6 rounded-full bg-default-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav mockup */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-background border-t border-default-100 flex items-center justify-around px-3">
            {[
              { active: true },
              { active: false },
              { active: false },
              { active: false },
            ].map((tab, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  tab.active ? "bg-accent" : "bg-default-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Phone glow effect */}
      <div className="absolute -inset-4 rounded-[3rem] bg-accent/5 blur-2xl -z-10" />
    </div>
  );
}

function AppStoreButton({
  store,
  href,
}: {
  store: "apple" | "google";
  href: string;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-3 bg-white text-foreground rounded-xl px-5 py-3 shadow-md hover:shadow-lg transition-shadow"
    >
      {/* Store icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0"
      >
        {store === "apple" ? (
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        ) : (
          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
        )}
      </svg>

      <div className="flex flex-col leading-none">
        <span className="text-[10px] text-default-500 font-medium">
          {store === "apple" ? "Download on the" : "GET IT ON"}
        </span>
        <span className="text-sm font-semibold -mt-0.5">
          {store === "apple" ? "App Store" : "Google Play"}
        </span>
      </div>
    </motion.a>
  );
}

export function AppPromoBanner() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [isVisible, setIsVisible] = useState(() => {
    // Check if dismissed within the last 7 days
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        return elapsed >= DISMISS_DURATION;
      }
    } catch {
      // localStorage not available
    }
    return true;
  });

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // localStorage not available
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.section
        ref={sectionRef}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        <div className="kwik-gradient py-16 md:py-20">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/[0.03]" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/[0.05]" />
            <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-white/[0.02]" />
          </div>

          <div className="container mx-auto px-0 md:px-4  relative">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              {/* Left content */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={
                  isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }
                }
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 text-center md:text-left"
              >
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                  <Smartphone className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">
                    KWIKSELLER App
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  Shop Smarter
                  <br />
                  with Our Mobile App
                </h2>

                <p className="text-white/70 text-lg mb-8 max-w-lg">
                  Get the best marketplace experience on your phone. Faster
                  browsing, instant notifications, and exclusive deals.
                </p>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={
                          isInView
                            ? { opacity: 1, x: 0 }
                            : { opacity: 0, x: -20 }
                        }
                        transition={{
                          duration: 0.4,
                          delay: 0.4 + index * 0.15,
                        }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white/90" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-sm">
                            {feature.title}
                          </h4>
                          <p className="text-white/60 text-sm">
                            {feature.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* App store buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <AppStoreButton store="apple" href="#" />
                  <AppStoreButton store="google" href="#" />
                </div>
              </motion.div>

              {/* Right - Phone mockup */}
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={
                  isInView
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 40, scale: 0.95 }
                }
                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                className="flex-shrink-0"
              >
                <PhoneMockup />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
