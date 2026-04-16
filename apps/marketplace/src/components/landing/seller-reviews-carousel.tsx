"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { BadgeCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Chip, Button } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Vendor Data ─────────────────────────────────────────────

interface Vendor {
  name: string;
  initials: string;
  color: string;
  city: string;
  country: string;
  category: string;
  rating: number;
  reviewCount: number;
  quote: string;
}

const vendors: Vendor[] = [
  {
    name: "Adire Luxe",
    initials: "AL",
    color: "bg-rose-500",
    city: "Lagos",
    country: "Nigeria",
    category: "Fashion",
    rating: 4.9,
    reviewCount: 1247,
    quote:
      "Beautiful handcrafted Adire fabric. Colors are even more vibrant in person!",
  },
  {
    name: "Savanna Leather",
    initials: "SL",
    color: "bg-amber-600",
    city: "Nairobi",
    country: "Kenya",
    category: "Accessories",
    rating: 5.0,
    reviewCount: 892,
    quote:
      "The leather quality is exceptional. My wallet has lasted over two years now.",
  },
  {
    name: "Gold Coast Kente",
    initials: "GK",
    color: "bg-emerald-600",
    city: "Accra",
    country: "Ghana",
    category: "Textiles",
    rating: 4.8,
    reviewCount: 2103,
    quote:
      "Authentic Kente cloth delivered on time. Will definitely order again for events.",
  },
  {
    name: "Kigali Crafts Co.",
    initials: "KC",
    color: "bg-violet-500",
    city: "Kigali",
    country: "Rwanda",
    category: "Handicrafts",
    rating: 4.9,
    reviewCount: 634,
    quote:
      "Intricate woven baskets that make perfect gifts. Excellent packaging too.",
  },
  {
    name: "Cape Wine & Goods",
    initials: "CW",
    color: "bg-orange-500",
    city: "Cape Town",
    country: "South Africa",
    category: "Specialty",
    rating: 4.7,
    reviewCount: 1568,
    quote:
      "Premium curated goods from local artisans. Every item tells a story.",
  },
  {
    name: "Teranga Jewelry",
    initials: "TJ",
    color: "bg-cyan-600",
    city: "Dakar",
    country: "Senegal",
    category: "Jewelry",
    rating: 5.0,
    reviewCount: 445,
    quote: "Stunning handcrafted pieces. The attention to detail is unmatched.",
  },
];

// ─── Star Rating Display ─────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <Star
            key={i}
            className={cn(
              "w-3.5 h-3.5",
              filled || partial
                ? "fill-warning text-warning"
                : "text-default-200",
            )}
          />
        );
      })}
      <span className="text-xs font-semibold text-foreground ml-1">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Vendor Card ─────────────────────────────────────────────

function VendorCard({ vendor, index }: { vendor: Vendor; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        ease: "easeOut" as const,
        delay: index * 0.08,
      }}
      className="shrink-0 w-[280px] sm:w-[300px]"
    >
      <div className="h-full p-5 rounded-2xl bg-background border border-divider hover-lift transition-shadow duration-300">
        {/* Top: Avatar + Info */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
              vendor.color,
            )}
          >
            {vendor.initials}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {vendor.name}
            </h4>
            <p className="text-xs text-muted truncate">
              {vendor.city}, {vendor.country}
            </p>
          </div>
        </div>

        {/* Category Tag + Verified Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Chip
            variant="soft"
            size="sm"
            className="bg-default-100 text-foreground/70 text-xs"
          >
            {vendor.category}
          </Chip>
          <Chip
            variant="soft"
            size="sm"
            className="bg-success/10 text-success text-xs"
          >
            <BadgeCheck className="w-3 h-3 mr-0.5" />
            Verified
          </Chip>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 mb-3">
          <StarRating rating={vendor.rating} />
          <span className="text-xs text-muted">
            ({vendor.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Quote */}
        <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
          &ldquo;{vendor.quote}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────

export function SellerReviewsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-60px" });
  const isPausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeDot, setActiveDot] = useState(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);

    // Update dot based on scroll position
    const cardWidth =
      el.querySelector('[class*="shrink-0"]')?.clientWidth ?? 300;
    const gap = 24; // gap-6 = 24px
    const scrollIndex = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveDot(Math.min(scrollIndex, vendors.length - 1));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  const scrollBy = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth =
      el.querySelector('[class*="shrink-0"]')?.clientWidth ?? 300;
    const scrollAmount = cardWidth + 24; // card + gap
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        const el = scrollRef.current;
        if (!el) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollBy("right");
        }
      }
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scrollBy]);

  return (
    <section className="py-16 md:py-24 bg-default-50/30 dark:bg-default-50/50 relative overflow-hidden">
      <div className="container mx-auto px-0 md:px-4 ">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 28 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
          }
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-12"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-success/10 text-success border border-success/20"
          >
            <BadgeCheck className="w-3.5 h-3.5 mr-1" />
            Verified
          </Chip>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Top Rated Sellers
          </h2>

          <p className="text-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Discover trusted vendors across Africa with verified reviews and
            outstanding track records.
          </p>
        </motion.div>

        {/* ─── Carousel ─── */}
        <div
          className="relative"
          onMouseEnter={() => (isPausedRef.current = true)}
          onMouseLeave={() => (isPausedRef.current = false)}
        >
          {/* Left Arrow (desktop) */}
          {canScrollLeft && (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-10 h-10 bg-background/90 dark:bg-default-100/90 border border-divider shadow-md hidden md:flex"
              onPress={() => scrollBy("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {/* Scroll Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {vendors.map((vendor, index) => (
              <VendorCard key={vendor.name} vendor={vendor} index={index} />
            ))}
          </div>

          {/* Right Arrow (desktop) */}
          {canScrollRight && (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-10 h-10 bg-background/90 dark:bg-default-100/90 border border-divider shadow-md hidden md:flex"
              onPress={() => scrollBy("right")}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* ─── Dot Indicators ─── */}
        <div
          className="flex items-center justify-center gap-2 mt-8"
          role="tablist"
          aria-label="Seller cards navigation"
        >
          {vendors.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const cardWidth =
                  el.querySelector('[class*="shrink-0"]')?.clientWidth ?? 300;
                el.scrollTo({
                  left: index * (cardWidth + 24),
                  behavior: "smooth",
                });
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === activeDot
                  ? "bg-accent w-8"
                  : "bg-default-200 dark:bg-default-300 w-2 hover:bg-default-300 dark:hover:bg-default-400",
              )}
              role="tab"
              aria-selected={index === activeDot}
              aria-label={`Go to vendor ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
