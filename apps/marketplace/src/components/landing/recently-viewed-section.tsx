"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { Button } from "@heroui/react";
import { useRecentlyViewedStore } from "@/stores";
import { kwikToast } from "@kwikseller/utils";
import { AppImage } from "@/components/ui/app-image";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─────────────────────────────────────────────
   Recently Viewed Section
   Shows a horizontal scrollable row of product cards
   from the zustand recently-viewed store.
───────────────────────────────────────────── */
export function RecentlyViewedSection() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const items = useRecentlyViewedStore((s) => s.items);
  const clearAll = useRecentlyViewedStore((s) => s.clearAll);

  // Only show up to 8 items
  const displayItems = items.slice(0, 8);

  // Don't render if no items
  if (displayItems.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleClearAll = () => {
    clearAll();
    kwikToast.info("Recently viewed history cleared");
  };

  const handleCardClick = (id: string) => {
    router.push(`/products/${id}`);
  };

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="bg-kwik-bg-page py-6 sm:py-8"
    >
      <div className="container mx-auto px-0 md:px-4">
        <div className="rounded-[28px] bg-background p-5 shadow-sm sm:p-6">
          {/* Section Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-kwik-orange-tint text-kwik-orange">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-kwik-dark sm:text-xl">
                  Recently Viewed
                </h2>
                <p className="text-xs text-kwik-muted">
                  {displayItems.length} product{displayItems.length !== 1 ? "s" : ""} viewed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs font-medium text-kwik-gray-light hover:text-danger"
                onPress={handleClearAll}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>

              {/* Scroll arrows (desktop only) */}
              <div className="hidden items-center gap-1 md:flex">
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 min-w-8 rounded-full border border-kwik-border"
                  onPress={() => handleScroll("left")}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 min-w-8 rounded-full border border-kwik-border"
                  onPress={() => handleScroll("right")}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Horizontal scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {displayItems.map((item, index) => {
              const discount = item.comparePrice
                ? Math.round(
                    ((item.comparePrice - item.price) / item.comparePrice) * 100,
                  )
                : 0;

              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={
                    isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
                  }
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleCardClick(String(item.id))}
                  className="snap-start w-[152px] flex-shrink-0 cursor-pointer sm:w-[180px]"
                >
                  <div className="overflow-hidden rounded-[18px] bg-background shadow-sm ring-1 ring-border transition-shadow hover:shadow-md">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-kwik-bg-light">
                      <AppImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {discount > 0 && (
                        <span className="absolute left-2 top-2 rounded-lg bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-1 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-kwik-muted truncate">
                        {item.store}
                      </p>
                      <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-kwik-dark min-h-[2rem]">
                        {item.name}
                      </h4>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-kwik-dark">
                          {formatCurrency(item.price)}
                        </span>
                        {item.comparePrice && (
                          <span className="text-[10px] text-kwik-muted line-through">
                            {formatCurrency(item.comparePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
