"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Store,
  BarChart3,
  CreditCard,
  Layers,
  Bike,
  Megaphone,
  ArrowRight,
  Hand,
} from "lucide-react";
import { Chip, Button } from "@heroui/react";
import { cn } from "@kwikseller/ui";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Feature Data ──────────────────────────────────────────────

interface FeatureCard {
  title: string;
  icon: React.ElementType;
  shortDescription: string;
  backTitle: string;
  backDescription: string;
  stats: string[];
  iconBg: string;
  iconColor: string;
}

const features: FeatureCard[] = [
  {
    title: "Store Builder",
    icon: Store,
    shortDescription:
      "Create your dream store in minutes with drag & drop tools.",
    backTitle: "Build Your Dream Store",
    backDescription:
      "Launch a professional online store with our intuitive drag & drop builder. No coding skills needed.",
    stats: ["50+ Templates", "5min Setup", "100% Custom"],
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Smart Analytics",
    icon: BarChart3,
    shortDescription: "Data-driven insights to grow your business smarter.",
    backTitle: "Data-Driven Decisions",
    backDescription:
      "Track sales in real-time, understand customer behavior, and export detailed revenue reports.",
    stats: ["Real-time", "20+ Metrics", "AI Insights"],
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "KwikPay Checkout",
    icon: CreditCard,
    shortDescription:
      "Accept payments with escrow protection & instant settlements.",
    backTitle: "Seamless Payments",
    backDescription:
      "Multiple payment methods with built-in escrow protection and automatic receipts for every order.",
    stats: ["5+ Methods", "Escrow", "Instant"],
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    title: "Pool Marketplace",
    icon: Layers,
    shortDescription: "Sell products without inventory — zero stock risk.",
    backTitle: "Sell Without Inventory",
    backDescription:
      "Access 50K+ shared products with auto-fulfillment and commission tracking built in.",
    stats: ["50K+ Products", "Zero Stock", "Auto-Ship"],
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    title: "Rider Network",
    icon: Bike,
    shortDescription: "Fast delivery with live GPS tracking across Africa.",
    backTitle: "Fast Delivery Everywhere",
    backDescription:
      "10K+ verified riders deliver your packages with live GPS tracking and same-day delivery options.",
    stats: ["10K+ Riders", "Live GPS", "Same-Day"],
    iconBg: "bg-rose-100 dark:bg-rose-900/50",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    title: "Marketing Hub",
    icon: Megaphone,
    shortDescription:
      "Grow your audience with ads, social tools & email campaigns.",
    backTitle: "Grow Your Audience",
    backDescription:
      "Run KwikCoins ads, schedule social media posts, send email campaigns, and create promo codes.",
    stats: ["Ad Manager", "Social", "Email"],
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
];

// ─── Animation Variants ────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ─── Single Flip Card ──────────────────────────────────────────

function FeatureFlipCard({
  feature,
  index,
}: {
  feature: FeatureCard;
  index: number;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isMobile = useIsMobile();
  const Icon = feature.icon;

  const handleFlip = () => {
    if (isMobile) {
      setIsFlipped((prev) => !prev);
    }
  };

  return (
    <motion.div variants={itemVariants} className="perspective-[1000px]">
      <div
        className={cn(
          "relative min-h-[280px] cursor-pointer transition-transform duration-600 ease-[ease-in-out]",
          "[transform-style:preserve-3d]",
          isFlipped && "[transform:rotateY(180deg)]",
        )}
        onMouseEnter={() => {
          if (!isMobile) setIsFlipped(true);
        }}
        onMouseLeave={() => {
          if (!isMobile) setIsFlipped(false);
        }}
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`${feature.title} — ${isFlipped ? "tap to flip back" : "tap to explore"}`}
      >
        {/* ── Front Face ── */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl p-6 flex flex-col justify-between",
            "bg-background border border-default-200 dark:border-default-200/30",
            "shadow-sm hover:shadow-lg transition-shadow duration-300",
            "[backface-visibility:hidden]",
          )}
        >
          {/* Subtle color overlay */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl opacity-[0.04] dark:opacity-[0.07]",
              feature.iconBg,
            )}
          />

          {/* Top: Icon */}
          <div className="relative z-10">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
                feature.iconBg,
              )}
            >
              <Icon className={cn("w-7 h-7", feature.iconColor)} />
            </div>
            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
            <p className="text-default-500 text-sm leading-relaxed line-clamp-2">
              {feature.shortDescription}
            </p>
          </div>

          {/* Bottom: hint (mobile only) */}
          <div className="relative z-10 flex items-center justify-center gap-1.5 text-default-400 sm:hidden mt-auto pt-4">
            <Hand className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Tap to explore</span>
          </div>
        </div>

        {/* ── Back Face ── */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl p-6 flex flex-col justify-between text-white",
            "kwik-gradient shadow-xl",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
          )}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

          {/* Top content */}
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">{feature.backTitle}</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              {feature.backDescription}
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10 flex items-center justify-center gap-3 mt-auto">
            {feature.stats.map((stat) => (
              <div
                key={stat}
                className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center"
              >
                <span className="text-xs font-semibold">{stat}</span>
              </div>
            ))}
          </div>

          {/* Learn More button */}
          <Button
            variant="ghost"
            size="sm"
            className="relative z-10 mt-4 bg-white/20 backdrop-blur-sm text-white font-semibold hover:bg-white/30 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Learn More
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ───────────────────────────────────────────────

export function InteractiveFeatures() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" });
  const isGridInView = useInView(gridRef, { once: true, margin: "-40px" });

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl translate-y-1/3 pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14 md:mb-16"
        >
          <Chip variant="soft" className="mb-4">
            Interactive Platform
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Experience{" "}
            <span className="kwik-gradient-text">Powerful Features</span>
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Explore our platform&apos;s capabilities with an interactive
            experience. Hover or tap on each card to discover what makes
            Kwikseller the leading African marketplace.
          </p>
        </motion.div>

        {/* ─── Flip Cards Grid ─── */}
        <motion.div
          ref={gridRef}
          variants={containerVariants}
          initial="hidden"
          animate={isGridInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <FeatureFlipCard
              key={feature.title}
              feature={feature}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
