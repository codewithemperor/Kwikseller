"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import {
  Users,
  Store,
  Package,
  Globe,
  CreditCard,
  Star,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Chip } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Stat Data ────────────────────────────────────────────────

interface StatItem {
  label: string;
  display: string;
  /** Numeric target for the counter (e.g. 500 for 500K) */
  target: number;
  /** Suffix appended to the counter value (e.g. "K+" or "M+") */
  suffix: string;
  /** Decimal places — only used by the rating stat (1) */
  decimals: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subLabel: string;
}

const stats: StatItem[] = [
  {
    label: "Active Buyers",
    display: "500K+",
    target: 500,
    suffix: "K+",
    decimals: 0,
    icon: Users,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    subLabel: "and growing daily",
  },
  {
    label: "Verified Sellers",
    display: "10K+",
    target: 10,
    suffix: "K+",
    decimals: 0,
    icon: Store,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    subLabel: "verified businesses",
  },
  {
    label: "Products Listed",
    display: "2M+",
    target: 2,
    suffix: "M+",
    decimals: 0,
    icon: Package,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    subLabel: "across all categories",
  },
  {
    label: "Countries Served",
    display: "15+",
    target: 15,
    suffix: "+",
    decimals: 0,
    icon: Globe,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    subLabel: "across Africa & beyond",
  },
  {
    label: "Monthly Transactions",
    display: "50K+",
    target: 50,
    suffix: "K+",
    decimals: 0,
    icon: CreditCard,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    subLabel: "secure payments processed",
  },
  {
    label: "Average Rating",
    display: "4.8/5",
    target: 48,
    suffix: "",
    decimals: 0,
    icon: Star,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    subLabel: "from verified reviews",
  },
];

// ─── Animated Counter Hook ────────────────────────────────────

function useCounter(
  target: number,
  suffix: string,
  decimals: number,
  inView: boolean,
  duration: number = 1600,
) {
  const [current, setCurrent] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return current;
}

// ─── Stat Card ────────────────────────────────────────────────

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = stat.icon;

  const counterValue = useCounter(
    stat.target,
    stat.suffix,
    stat.decimals,
    isInView,
  );

  /** Format the counter for display */
  const formattedValue = useCallback(() => {
    if (stat.target === 48) {
      // Special case: rating 4.8/5
      return `${(counterValue / 10).toFixed(1)}/5`;
    }
    return `${counterValue.toLocaleString()}${stat.suffix}`;
  }, [counterValue, stat.target, stat.suffix]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{
        duration: 0.55,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      className="group"
    >
      <div
        className={cn(
          "p-5 md:p-6 rounded-2xl",
          "bg-white dark:bg-default-100",
          "shadow-clean",
          "kwik-border-top",
          "hover-lift",
          "transition-colors duration-200",
        )}
      >
        {/* Icon container */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
            stat.iconBg,
          )}
        >
          <Icon className={cn("w-6 h-6", stat.iconColor)} />
        </div>

        {/* Number */}
        <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 tabular-nums">
          {formattedValue()}
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-foreground/80 mb-1">
          {stat.label}
        </p>

        {/* Sub-label */}
        <p className="text-xs text-muted">{stat.subLabel}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────

export function CommunityStats() {
  const headerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isHeaderInView = useInView(headerRef, { once: true, margin: "-60px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-40px" });

  return (
    <section className="py-16 md:py-24 bg-default-50/30 dark:bg-default-50/50 relative overflow-hidden">
      {/* Subtle dot pattern overlay */}
      <div className="pattern-dots absolute inset-0 opacity-40 pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 28 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
          }
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-center mb-12 md:mb-16"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-accent/10 text-accent border border-accent/20"
          >
            <Activity className="w-3.5 h-3.5 mr-1" />
            Live Stats
          </Chip>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Join Our Growing Community
          </h2>

          <p className="text-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Real-time numbers that reflect the trust and scale of the KWIKSELLER
            marketplace across Africa.
          </p>
        </motion.div>

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>

        {/* ─── Bottom CTA ─── */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.3 }}
          className="text-center mt-12 md:mt-16"
        >
          <a
            href="#"
            className={cn(
              "inline-flex items-center gap-2",
              "text-sm md:text-base font-semibold",
              "text-accent hover:text-foreground",
              "transition-colors duration-200",
              "group",
            )}
          >
            Be Part of Our Story
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
