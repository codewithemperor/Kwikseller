"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@kwikseller/ui";
import {
  TrendingUp,
  Sparkles,
  Smartphone,
  Heart,
  Home,
  Flower2,
  Car,
  Flame,
  ArrowRight,
} from "lucide-react";
import { Card, Chip, Button } from "@heroui/react";

// ─── Data ────────────────────────────────────────────────────

const categories = [
  {
    icon: Sparkles,
    name: "Fashion",
    productCount: 12500,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-900/30",
    subs: ["Ankara", "Native Wear", "Jewelry"],
  },
  {
    icon: Smartphone,
    name: "Electronics",
    productCount: 8200,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    subs: ["Phones", "Laptops", "Accessories"],
  },
  {
    icon: Heart,
    name: "Beauty & Health",
    productCount: 6100,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    subs: ["Skincare", "Hair", "Makeup"],
  },
  {
    icon: Home,
    name: "Home & Living",
    productCount: 9300,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    subs: ["Furniture", "Kitchen", "Decor"],
  },
  {
    icon: Flower2,
    name: "Food & Groceries",
    productCount: 15000,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    subs: ["Organic", "Snacks", "Beverages"],
  },
  {
    icon: Car,
    name: "Automobiles",
    productCount: 4700,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    subs: ["Cars", "Parts", "Accessories"],
  },
];

// ─── Count-Up Hook ───────────────────────────────────────────

function useCountUp(target: number, inView: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return count;
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const val = n / 1000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return n.toString();
}

// ─── Animation Helpers ──────────────────────────────────────

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Category Card ───────────────────────────────────────────

function CategoryCard({
  category,
  index,
}: {
  category: (typeof categories)[0];
  index: number;
}) {
  const Icon = category.icon;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const animatedCount = useCountUp(category.productCount, isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 20, scale: 0.95 }
      }
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: "easeOut" as const,
      }}
    >
      <Card
        className="group border border-default-200 dark:border-default-100 bg-background cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/20 h-full press-scale"
        onClick={() => {
          const el = document.getElementById("categories");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <div className="p-5 text-center">
          {/* Icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110",
              category.bg,
            )}
          >
            <Icon className={cn("w-7 h-7", category.color)} />
          </div>

          {/* Name */}
          <h3 className="font-semibold text-sm mb-1">{category.name}</h3>

          {/* Animated Count */}
          <p className="text-xs text-default-400 tabular-nums mb-3">
            {formatCount(animatedCount)} Products
          </p>

          {/* Subcategory Pills */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {category.subs.map((sub) => (
              <span
                key={sub}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-default-100 dark:bg-default-200/50 text-default-500 transition-colors group-hover:bg-accent/10 group-hover:text-accent"
              >
                {sub}
              </span>
            ))}
          </div>

          {/* Trending Indicator */}
          <div className="mt-3 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Flame className="w-3 h-3 text-warning" />
            <span className="text-[10px] font-medium text-warning">
              Trending
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function TrendingCategories() {
  return (
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-0 md:px-4 ">
        {/* Section Header */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Chip variant="soft" color="warning" size="sm">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                Hot
              </Chip>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Trending Categories
            </h2>
            <p className="text-sm text-default-500 max-w-md mx-auto">
              Discover what&apos;s popular right now on Kwikseller
            </p>
          </div>
        </AnimatedSection>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.name} category={cat} index={i} />
          ))}
        </div>

        {/* View All CTA */}
        <AnimatedSection delay={0.5}>
          <div className="text-center">
            <Button
              className="kwik-gradient text-accent-foreground font-semibold kwik-shadow press-scale"
              onPress={() => {
                const el = document.getElementById("categories");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View All Categories
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
