"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
} from "lucide-react";
import { Button, Chip, Card } from "@heroui/react";
import { useRecentlyViewedStore } from "@/stores";
import { useCartStore } from "@/stores";
import { kwikToast } from "@kwikseller/utils";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RecentlyViewed() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const items = useRecentlyViewedStore((s) => s.items);
  const clearAll = useRecentlyViewedStore((s) => s.clearAll);
  const addItem = useCartStore((s) => s.addItem);

  // Don't render if no items
  if (items.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleAddToCart = (item: (typeof items)[0]) => {
    addItem({
      productId: item.id,
      name: item.name,
      price: item.price,
      comparePrice: item.comparePrice,
      image: item.image,
      store: item.store,
    });
    kwikToast.success(`${item.name} added to cart!`);
  };

  const handleClearAll = () => {
    clearAll();
    kwikToast.info("Recently viewed history cleared");
  };

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5 }}
      className="py-12 bg-default-50"
    >
      <div className="container mx-auto px-0 md:px-4 ">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Chip variant="soft" size="sm">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Your History
            </Chip>
            <h2 className="text-xl md:text-2xl font-bold">Recently Viewed</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-default-400 hover:text-danger"
              onPress={handleClearAll}
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>

            {/* Scroll arrows (desktop only) */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                className="w-8 h-8 min-w-8"
                onPress={() => handleScroll("left")}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                className="w-8 h-8 min-w-8"
                onPress={() => handleScroll("right")}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-thin pb-2 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((item, index) => {
            const discount = item.comparePrice
              ? Math.round(
                  ((item.comparePrice - item.price) / item.comparePrice) * 100,
                )
              : 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={
                  isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
                }
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="snap-start flex-shrink-0 w-[160px] md:w-[200px]"
              >
                <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                  {/* Image */}
                  <div className="relative w-full aspect-square overflow-hidden bg-default-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {discount > 0 && (
                      <Chip
                        size="sm"
                        color="danger"
                        className="absolute top-2 left-2 shadow-sm"
                      >
                        -{discount}%
                      </Chip>
                    )}

                    {/* Quick add to cart on hover */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddToCart(item)}
                        className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1">
                    <p className="text-[11px] text-default-400 font-medium truncate">
                      {item.store}
                    </p>
                    <h4 className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
                      {item.name}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-bold text-accent">
                        {formatCurrency(item.price)}
                      </span>
                      {item.comparePrice && (
                        <span className="text-[11px] text-default-400 line-through">
                          {formatCurrency(item.comparePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
