"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import {
  Trophy,
  ShieldCheck,
  Package,
  Star,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Chip, Card } from "@heroui/react";
import { cn } from "@kwikseller/ui";
import Link from "next/link";
import {
  VENDOR_SPOTLIGHT as vendors,
  type VendorSpotlightItem as VendorData,
} from "@/constants/landing";

// ─── Animated Stat Number ─────────────────────────────────────────

function AnimatedNumber({
  value,
  decimals = 1,
}: {
  value: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, {
        duration: 1.2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, motionVal, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// ─── Vendor Card ──────────────────────────────────────────────────

function VendorCard({ vendor, index }: { vendor: VendorData; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const vendorSlug = vendor.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: "easeOut" }}
      className="min-w-[300px] md:min-w-0 snap-center shrink-0"
    >
      <Card className="overflow-hidden border border-divider rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
        {/* Cover Area */}
        <div className={cn("relative h-28 overflow-hidden")}>
          <div className={cn("absolute inset-0", vendor.coverColor)} />

          {/* Decorative geometric shapes */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute top-3 right-16 w-16 h-[2px] bg-white/20 rotate-12" />
          <div className="absolute bottom-6 left-10 w-12 h-[2px] bg-white/15 -rotate-6" />
          <div className="absolute top-10 left-20 w-4 h-4 rounded-full bg-white/15" />

          {/* Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-lg",
                vendor.badgeColor,
              )}
            >
              {vendor.badge === "Featured" && "⭐ "}
              {vendor.badge === "Top Rated" && "🏆 "}
              {vendor.badge === "Rising Star" && "🚀 "}
              {vendor.badge}
            </span>
          </div>
        </div>

        {/* Vendor Info - overlapping cover */}
        <div className="relative px-5 pb-5">
          {/* Avatar */}
          <div className="flex items-end gap-3 -mt-8 mb-3">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-[3px] border-background shrink-0 bg-accent",
              )}
            >
              {vendor.initials}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h3 className="font-semibold text-lg truncate leading-tight">
                {vendor.storeName}
              </h3>
              <p className="text-sm text-default-500 truncate">
                {vendor.category} · {vendor.location}
              </p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-1.5 mb-4">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">
              Verified Vendor
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between py-3 mb-4 border-y border-divider">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 text-sm">
                <Package className="w-3.5 h-3.5 text-default-400" />
                <span className="font-semibold">{vendor.products}</span>
              </div>
              <span className="text-[10px] text-default-400 uppercase tracking-wider">
                Products
              </span>
            </div>
            <div className="w-px h-8 bg-divider" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 text-sm">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                <span className="font-semibold text-warning">
                  <AnimatedNumber value={vendor.rating} /> ★
                </span>
              </div>
              <span className="text-[10px] text-default-400 uppercase tracking-wider">
                Rating
              </span>
            </div>
            <div className="w-px h-8 bg-divider" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-default-400" />
                <span className="font-semibold">{vendor.sold}</span>
              </div>
              <span className="text-[10px] text-default-400 uppercase tracking-wider">
                Sales
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-default-500 leading-relaxed line-clamp-2 mb-4">
            {vendor.description}
          </p>

          {/* Tags Row */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {vendor.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-default-100 px-2.5 py-0.5 text-xs text-default-600 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Visit Store Button */}
          <Link
            href={`/vendor/${vendorSlug}`}
            className="group/btn inline-flex h-10 w-full items-center justify-center gap-2 border border-divider px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Visit Store
            <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────

export function VendorSpotlight() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [updateScrollButtons]);

  const scrollCards = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 340;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 bg-default-50 relative">
      {/* Subtle diagonal pattern overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="vendor-diagonal"
              patternUnits="userSpaceOnUse"
              width="40"
              height="40"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="40"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vendor-diagonal)" />
        </svg>
      </div>

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Chip variant="soft" className="mb-4">
            <Trophy className="w-4 h-4 mr-1" />
            Top Performers
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vendor Spotlight
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto">
            Discover our highest-performing sellers delivering exceptional
            quality, service, and value to millions of customers across Africa.
          </p>
        </motion.div>

        {/* Cards Container */}
        <div className="relative">
          {/* Scroll Arrows — Desktop Only */}
          {canScrollLeft && (
            <button
              onClick={() => scrollCards("left")}
              className="hidden md:flex absolute -left-4 top-1/3 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background border border-divider items-center justify-center text-default-600 hover:bg-default-100 hover:border-default-300 transition-colors shadow-lg"
              aria-label="Scroll vendors left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollCards("right")}
              className="hidden md:flex absolute -right-4 top-1/3 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background border border-divider items-center justify-center text-default-600 hover:bg-default-100 hover:border-default-300 transition-colors shadow-lg"
              aria-label="Scroll vendors right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Mobile: horizontal scroll. Desktop: grid */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-thin pb-4 px-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:snap-none md:px-0"
          >
            {vendors.map((vendor, index) => (
              <VendorCard key={vendor.id} vendor={vendor} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
