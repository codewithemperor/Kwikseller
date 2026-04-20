// KWIKSELLER - Pool Selling Page
// Rich, professional content showcasing pool selling with all sections

"use client";

import React, { useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Droplets,
  ArrowRight,
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp,
  CheckCircle,
  X,
  Flame,
  BarChart3,
  Truck,
  Shield,
  Clock,
  Sparkles,
  Calculator,
  HandCoins,
  Users,
  Search,
  ListPlus,
  Tag,
  Zap,
  Star,
  Award,
  ArrowUpRight,
  Layers,
  BadgeDollarSign,
  PieChart,
  Globe,
  Smartphone,
  Shirt,
  Home as HomeIcon,
  Utensils,
} from "lucide-react";
import { Button, Card, Chip, Separator } from "@heroui/react";
import { motion, useInView } from "framer-motion";
import { cn } from "@kwikseller/ui";

// ─── Animation helpers ─────────────────────────────────────────────

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

function StaggerChild({
  children,
  className = "",
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ──────────────────────────────────────────────────────

const howItWorksSteps = [
  {
    number: 1,
    icon: ListPlus,
    title: "List Your Products",
    description:
      "Add products to the pool without buying stock upfront. Browse our curated catalog of trending items and add them to your virtual storefront with one click — zero inventory required.",
    color: "bg-amber-500",
    miniItems: ["One-Click Add", "No Inventory", "Instant Setup"],
  },
  {
    number: 2,
    icon: ShoppingCart,
    title: "Customers Order",
    description:
      "Buyers purchase from the combined pool at competitive prices. Your store gets exposure to thousands of shoppers looking for exactly the products you've listed.",
    color: "bg-emerald-500",
    miniItems: ["Combined Reach", "Competitive Prices", "More Sales"],
  },
  {
    number: 3,
    icon: Layers,
    title: "Orders are Pooled",
    description:
      "The system groups similar orders for bulk purchasing, driving down costs and increasing margins. The platform automatically consolidates and routes orders for maximum efficiency.",
    color: "bg-rose-500",
    miniItems: ["Auto-Grouping", "Bulk Pricing", "Smart Routing"],
  },
  {
    number: 4,
    icon: BadgeDollarSign,
    title: "Fulfill & Earn",
    description:
      "Purchase in bulk, fulfill individual orders, and keep the profit. You earn commissions on every sale without ever touching the inventory — pure profit with zero risk.",
    color: "bg-violet-500",
    miniItems: ["Bulk Savings", "Auto Fulfillment", "Keep Profits"],
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Zero Inventory Risk",
    description:
      "No upfront cost means no financial risk. You never buy stock you can't sell — if a product doesn't move, you lose nothing.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  {
    icon: TrendingUp,
    title: "Bulk Purchase Power",
    description:
      "When orders are pooled together, you get wholesale pricing and dramatically better margins than buying individually.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  {
    icon: Truck,
    title: "Combined Logistics",
    description:
      "Shared delivery costs across pooled orders means lower shipping fees for your customers and higher satisfaction ratings.",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/30",
  },
  {
    icon: Package,
    title: "Wider Product Range",
    description:
      "Offer hundreds of products across multiple categories without needing capital. More products mean more opportunities to earn.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/30",
  },
  {
    icon: Users,
    title: "Community-Driven",
    description:
      "Strength in numbers — a growing network of vendors pooling resources creates a powerful collective that benefits everyone.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30",
  },
  {
    icon: PieChart,
    title: "Data-Driven Insights",
    description:
      "Know what sells before you invest. Access real-time analytics on trending products, demand forecasts, and optimal pricing.",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/30",
  },
];

const comparisonData = [
  {
    feature: "Startup Cost",
    traditional: "₦100K – ₦1M+",
    poolSelling: "₦0",
    traditionalGood: false,
  },
  {
    feature: "Product Range",
    traditional: "Limited by capital",
    poolSelling: "Unlimited pool access",
    traditionalGood: false,
  },
  {
    feature: "Logistics",
    traditional: "Individual shipping costs",
    poolSelling: "Shared delivery network",
    traditionalGood: false,
  },
  {
    feature: "Risk Level",
    traditional: "High — unsold stock",
    poolSelling: "Low — no inventory held",
    traditionalGood: false,
  },
  {
    feature: "Storage Needed",
    traditional: "Warehouse / storeroom",
    poolSelling: "No storage required",
    traditionalGood: false,
  },
  {
    feature: "Time to Launch",
    traditional: "2–4 weeks setup",
    poolSelling: "Start in minutes",
    traditionalGood: false,
  },
  {
    feature: "Scalability",
    traditional: "Limited by stock capacity",
    poolSelling: "Unlimited — add more products",
    traditionalGood: false,
  },
  {
    feature: "Testing Products",
    traditional: "Expensive experiments",
    poolSelling: "Test risk-free",
    traditionalGood: false,
  },
];

const successStories = [
  {
    name: "Aisha Bello",
    location: "Lagos, Nigeria",
    avatar: "AB",
    avatarColor: "bg-amber-500",
    category: "Fashion & Accessories",
    monthlyRevenue: "₦850,000",
    productsSold: "2,400+",
    growth: "+340%",
    quote:
      "Pool selling transformed my business. I went from selling 10 items to over 2,400 monthly — without buying a single piece of inventory upfront.",
  },
  {
    name: "Emmanuel Okonkwo",
    location: "Abuja, Nigeria",
    avatar: "EO",
    avatarColor: "bg-emerald-500",
    category: "Electronics",
    monthlyRevenue: "₦1.2M",
    productsSold: "1,800+",
    growth: "+520%",
    quote:
      "The bulk purchasing power is incredible. My profit margins jumped from 12% to 35% because the platform pools orders for wholesale pricing.",
  },
  {
    name: "Fatima Ibrahim",
    location: "Kano, Nigeria",
    avatar: "FI",
    avatarColor: "bg-rose-500",
    category: "Beauty & Skincare",
    monthlyRevenue: "₦620,000",
    productsSold: "3,100+",
    growth: "+280%",
    quote:
      "I was skeptical at first, but the data insights told me exactly which products to list. Now I earn more than my full-time job — from home.",
  },
];

const poolCategories = [
  {
    name: "Fashion",
    icon: Shirt,
    productCount: "12,400+",
    color: "bg-rose-500",
  },
  {
    name: "Electronics",
    icon: Smartphone,
    productCount: "8,200+",
    color: "bg-amber-500",
  },
  {
    name: "Beauty",
    icon: Sparkles,
    productCount: "9,800+",
    color: "bg-violet-500",
  },
  {
    name: "Home & Living",
    icon: HomeIcon,
    productCount: "6,500+",
    color: "bg-emerald-500",
  },
  {
    name: "Phones",
    icon: Smartphone,
    productCount: "5,300+",
    color: "bg-sky-500",
  },
  {
    name: "Food & Drinks",
    icon: Utensils,
    productCount: "4,100+",
    color: "bg-orange-500",
  },
];

// ─── Step Image Placeholder ──────────────────────────────────────

function StepImage({
  step,
  isInView,
}: {
  step: (typeof howItWorksSteps)[number];
  isInView: boolean;
}) {
  const Icon = step.icon;
  const isOdd = step.number % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: isOdd ? -30 : 30 }}
      animate={
        isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isOdd ? -30 : 30 }
      }
      transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden"
    >
      <div className={cn("absolute inset-0 opacity-90", step.color)} />

      {/* Floating icon */}
      <motion.div
        animate={isInView ? { y: [0, -8, 0] } : { y: 0 }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: step.number * 0.3,
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </div>
      </motion.div>

      {/* Mini tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2"
      >
        {step.miniItems.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium"
          >
            {item}
          </span>
        ))}
      </motion.div>

      {/* Decorative circles */}
      <motion.div
        animate={isInView ? { y: [0, -6, 0] } : { y: 0 }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none",
        )}
      />
      <motion.div
        animate={isInView ? { y: [0, 5, 0] } : { y: 0 }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className={cn(
          "absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10 pointer-events-none",
        )}
      />

      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/10" />
    </motion.div>
  );
}

// ─── How It Works Step (separate component to use hooks) ────────

function HowItWorksStep({
  step,
  index,
  totalSteps,
}: {
  step: (typeof howItWorksSteps)[number];
  index: number;
  totalSteps: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isOdd = step.number % 2 === 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: "easeOut" }}
    >
      {/* Connecting line (except last) */}
      {index < totalSteps - 1 && (
        <div className="hidden md:flex justify-center">
          <div className="w-px border-l-2 border-dashed border-default-200 my-4" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-8 md:gap-12 lg:gap-16",
          isOdd ? "md:flex-row" : "md:flex-row-reverse",
        )}
      >
        {/* Image side */}
        <div className="w-full md:w-1/2 max-w-lg mx-auto">
          <StepImage step={step} isInView={isInView} />
        </div>

        {/* Text side */}
        <motion.div
          initial={{ opacity: 0, x: isOdd ? 30 : -30 }}
          animate={
            isInView
              ? { opacity: 1, x: 0 }
              : { opacity: 0, x: isOdd ? 30 : -30 }
          }
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="w-full md:w-1/2 flex flex-col justify-center"
        >
          {/* Step number */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md",
                step.color,
              )}
            >
              {step.number}
            </div>
            <div className={cn("flex-1 h-0.5 bg-accent/30 rounded-full")} />
          </div>

          <h3 className="text-2xl md:text-3xl font-bold mb-4">{step.title}</h3>
          <p className="text-default-500 text-base md:text-lg leading-relaxed max-w-md">
            {step.description}
          </p>

          {/* Step progress */}
          <div className="flex items-center gap-2 mt-6">
            {howItWorksSteps.map((s) => (
              <div
                key={s.number}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  s.number <= step.number
                    ? cn("bg-accent w-8")
                    : "bg-default-200 w-4",
                )}
              />
            ))}
            <span className="text-xs text-default-400 ml-2">
              Step {step.number} of {totalSteps}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Pool Earnings Calculator ─────────────────────────────────────

function PoolEarningsCalculator() {
  const [productsListed, setProductsListed] = useState(100);
  const [avgOrderValue, setAvgOrderValue] = useState(5000);
  const [monthlyOrders, setMonthlyOrders] = useState(200);

  const earnings = useMemo(() => {
    const avgCommissionRate = 0.18; // 18% average commission
    const monthlyRevenue = monthlyOrders * avgOrderValue;
    const monthlyProfit = monthlyRevenue * avgCommissionRate;
    // Pool savings from bulk purchasing: ~15% discount on orders
    const poolSavings = monthlyRevenue * 0.15;
    const yearlyProfit = monthlyProfit * 12;
    return { monthlyRevenue, monthlyProfit, poolSavings, yearlyProfit };
  }, [productsListed, avgOrderValue, monthlyOrders]);

  return (
    <Card className="border-none shadow-xl p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Earnings Calculator</h3>
          <p className="text-sm text-default-500">
            Estimate your potential pool selling income
          </p>
        </div>
      </div>

      <div className="space-y-7">
        {/* Products Listed */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Products Listed</label>
            <span className="text-sm font-bold text-accent">
              {productsListed}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={productsListed}
            onChange={(e) => setProductsListed(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-default-200 accent-accent"
          />
          <div className="flex justify-between text-xs text-default-400 mt-1">
            <span>10</span>
            <span>500</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Average Order Value</label>
            <span className="text-sm font-bold text-accent">
              ₦{avgOrderValue.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={avgOrderValue}
            onChange={(e) => setAvgOrderValue(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-default-200 accent-accent"
          />
          <div className="flex justify-between text-xs text-default-400 mt-1">
            <span>₦1,000</span>
            <span>₦50,000</span>
          </div>
        </div>

        {/* Monthly Orders */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Monthly Orders</label>
            <span className="text-sm font-bold text-accent">
              {monthlyOrders.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={10000}
            step={50}
            value={monthlyOrders}
            onChange={(e) => setMonthlyOrders(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-default-200 accent-accent"
          />
          <div className="flex justify-between text-xs text-default-400 mt-1">
            <span>50</span>
            <span>10,000</span>
          </div>
        </div>
      </div>

      <Separator className="my-7" />

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-xl bg-accent/10 border border-accent/20">
          <p className="text-xs text-default-500 mb-1 font-medium">
            Monthly Revenue
          </p>
          <p className="text-xl sm:text-2xl font-bold text-accent">
            ₦{Math.round(earnings.monthlyRevenue).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
          <p className="text-xs text-default-500 mb-1 font-medium">
            Profit Margin
          </p>
          <p className="text-xl sm:text-2xl font-bold text-success">
            ₦{Math.round(earnings.monthlyProfit).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
          <p className="text-xs text-default-500 mb-1 font-medium">
            Pool Savings
          </p>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₦{Math.round(earnings.poolSavings).toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-xs text-default-400 text-center mt-4">
        * Based on 18% average commission rate and 15% bulk purchase savings.
        Actual results may vary.
      </p>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function PoolPage() {
  const router = useRouter();

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />

        {/* Decorative blur orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/10 blur-[60px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white/10 blur-[80px] pointer-events-none"
        />

        <div className="container mx-auto px-0 md:px-4  py-16 sm:py-20 md:py-24 relative">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              {/* Chip badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Chip
                  variant="soft"
                  className="mb-6 bg-white/20 text-white border-white/20 text-sm"
                >
                  <Droplets className="w-3.5 h-3.5 mr-1" />
                  Pool Selling by Kwikseller
                </Chip>
              </motion.div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Sell Without{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Inventory</span>
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute bottom-1 left-0 h-3 bg-white/25 rounded-full -z-0"
                  />
                </span>
              </h1>

              {/* Description */}
              <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                Pool selling is a unique Kwikseller feature where vendors list
                products without holding inventory. Multiple vendors pool
                together to fulfill orders at scale — meaning zero risk, zero
                upfront cost, and unlimited earning potential.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-accent-foreground font-bold kwik-shadow-lg hover:bg-white/90 transition-colors px-8"
                  onPress={() => router.push("/register")}
                >
                  Start Pool Selling Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white border-white/30 hover:bg-white/10 font-medium"
                  onPress={() => {
                    const el = document.getElementById("how-it-works");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  How It Works
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
                {[
                  { icon: Shield, label: "Zero Risk" },
                  { icon: Zap, label: "Instant Setup" },
                  { icon: HandCoins, label: "No Upfront Cost" },
                ].map((badge, i) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <motion.div
                      key={badge.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                      className="flex items-center gap-2 text-white/70"
                    >
                      <BadgeIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{badge.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 60V20C240 50 480 0 720 20C960 40 1200 10 1440 30V60H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. HOW POOL SELLING WORKS (4 steps, alternating layout)
      ═══════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-16 sm:py-20 relative overflow-hidden"
      >
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-32 w-64 h-64 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 -right-32 w-64 h-64 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Chip variant="soft" className="mb-4">
                <Sparkles className="w-4 h-4 mr-1" />
                Simple Process
              </Chip>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                How Pool Selling <span className="text-accent">Works</span>
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto text-base md:text-lg">
                Four simple steps to start earning from shared product
                inventory. No warehouse, no stock, no stress.
              </p>
            </div>
          </AnimatedSection>

          {/* Steps with alternating layout */}
          <div className="space-y-4">
            {howItWorksSteps.map((step, index) => (
              <HowItWorksStep
                key={step.number}
                step={step}
                index={index}
                totalSteps={howItWorksSteps.length}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. BENEFITS SECTION (6 cards, 2x3 grid)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-default-50 relative">
        <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Award className="w-4 h-4 mr-1" />
                Benefits
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Pool Selling?
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                Pool selling offers a smarter, risk-free way to build a
                profitable e-commerce business in Africa.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <StaggerChild key={benefit.title} index={index}>
                  <Card className="group border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 h-full relative overflow-hidden">
                    {/* Top gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                        benefit.bg,
                      )}
                    >
                      <Icon className={cn("w-6 h-6", benefit.color)} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-default-500 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </Card>
                </StaggerChild>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. POOL SELLING VS TRADITIONAL (Comparison Table)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-success/5 blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <BarChart3 className="w-4 h-4 mr-1" />
                Compare
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pool Selling vs Traditional
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                See why thousands of African vendors are switching to pool
                selling for a smarter, more profitable business model.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="max-w-3xl mx-auto">
              <Card className="border-none shadow-xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-3 p-4 sm:p-5 font-semibold text-sm">
                  <div className="text-default-500">Feature</div>
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-bold">
                      <X className="w-3 h-3" />
                      Traditional
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-xs font-bold">
                      <Droplets className="w-3 h-3" />
                      Pool Selling
                    </span>
                  </div>
                </div>

                {/* Table body */}
                <div className="divide-y divide-default-100 dark:divide-default-100/50">
                  {comparisonData.map((row, index) => (
                    <motion.div
                      key={row.feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={cn(
                        "grid grid-cols-3 p-4 text-sm",
                        index % 2 === 0
                          ? "bg-background"
                          : "bg-default-50/50 dark:bg-default-100/10",
                      )}
                    >
                      <div className="font-medium flex items-center">
                        {row.feature}
                      </div>
                      <div className="text-center text-default-400 flex items-center justify-center gap-1">
                        <X className="w-3.5 h-3.5 text-danger/50 flex-shrink-0 hidden sm:block" />
                        <span className="text-xs">{row.traditional}</span>
                      </div>
                      <div className="text-center font-medium text-success flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 hidden sm:block" />
                        <span className="text-xs">{row.poolSelling}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Table footer */}
                <div className="p-4 sm:p-5 bg-success/5 border-t border-success/20">
                  <div className="flex items-center justify-center gap-2 text-success font-semibold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Pool selling wins on every metric — start smarter today
                  </div>
                </div>
              </Card>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. SUCCESS STORIES (3 mini vendor stories)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-default-50 relative">
        <div className="absolute inset-0 pattern-diagonal opacity-20 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Star className="w-4 h-4 mr-1" />
                Success Stories
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Real Vendors, Real Results
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                Meet vendors who transformed their businesses using Kwikseller
                pool selling.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <StaggerChild key={story.name} index={index}>
                <Card className="group border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 h-full relative overflow-hidden">
                  {/* Top accent */}
                  <div
                    className={cn(
                      "absolute top-0 left-0 right-0 h-1 bg-accent",
                    )}
                  />

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md",
                        story.avatarColor,
                      )}
                    >
                      {story.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{story.name}</h4>
                      <p className="text-xs text-default-500">
                        {story.location}
                      </p>
                    </div>
                  </div>

                  {/* Category chip */}
                  <Chip size="sm" variant="soft" className="mb-3">
                    {story.category}
                  </Chip>

                  {/* Quote */}
                  <p className="text-sm text-default-600 dark:text-default-400 leading-relaxed mb-5 line-clamp-3">
                    &ldquo;{story.quote}&rdquo;
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-default-100">
                    <div className="text-center">
                      <p className="text-base font-bold text-accent">
                        {story.monthlyRevenue}
                      </p>
                      <p className="text-[10px] text-default-400 font-medium">
                        Monthly Revenue
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-success">
                        {story.productsSold}
                      </p>
                      <p className="text-[10px] text-default-400 font-medium">
                        Products Sold
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {story.growth}
                      </p>
                      <p className="text-[10px] text-default-400 font-medium">
                        Growth
                      </p>
                    </div>
                  </div>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. POOL CATEGORIES
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative">
        <div className="container mx-auto px-0 md:px-4 ">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Tag className="w-4 h-4 mr-1" />
                Categories
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Popular Pool Categories
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                Browse the most in-demand product categories available in the
                pool. Thousands of products ready for you to sell.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {poolCategories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <StaggerChild key={cat.name} index={index}>
                  <Card className="group border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 text-center cursor-pointer h-full">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform text-white",
                        cat.color,
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">{cat.name}</h3>
                    <p className="text-xs text-default-400">
                      {cat.productCount} products
                    </p>
                  </Card>
                </StaggerChild>
              );
            })}
          </div>

          {/* Total pool products banner */}
          <AnimatedSection delay={0.3}>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 border border-accent/20">
                <Globe className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold">
                  <span className="text-accent">46,300+</span> products
                  available across all pool categories
                </span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. EARNINGS CALCULATOR
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-accent relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-10">
              <Chip
                variant="soft"
                className="mb-4 bg-white/20 text-white border-white/20"
              >
                <HandCoins className="w-4 h-4 mr-1" />
                Calculator
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                How Much Could You Earn?
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Use our interactive calculator to estimate your potential pool
                selling income. Adjust the sliders and see your earnings in real
                time.
              </p>
            </div>
          </AnimatedSection>

          <PoolEarningsCalculator />
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 40V15C360 40 720 0 1080 20C1260 30 1380 15 1440 20V40H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. CTA SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-[120px] pointer-events-none deco-blob" />

        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <Card className="border-none p-8 sm:p-10 md:p-14 bg-accent text-white overflow-hidden relative">
              {/* Decorative circles */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none"
              />
              <motion.div
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.03, 0.08] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3,
                }}
                className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3 pointer-events-none"
              />

              <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 15,
                    stiffness: 200,
                    delay: 0.2,
                  }}
                  className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg"
                >
                  <Droplets className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  Start Pool Selling Today
                </h2>
                <p className="text-white/80 text-base sm:text-lg max-w-lg mb-8 leading-relaxed">
                  Join thousands of African vendors earning commissions without
                  holding inventory. Zero risk, zero upfront cost — just list,
                  sell, and profit.
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-6 sm:gap-10 mb-10 w-full max-w-md">
                  {[
                    { value: "10K+", label: "Active Vendors" },
                    { value: "46K+", label: "Pool Products" },
                    { value: "₦2B+", label: "Monthly Sales" },
                  ].map((stat, i) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-xl sm:text-2xl font-bold">
                        {stat.value}
                      </p>
                      <p className="text-white/60 text-xs sm:text-sm">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="bg-white text-accent-foreground font-bold kwik-shadow-lg hover:bg-white/90 transition-colors px-8 sm:px-10"
                    onPress={() => router.push("/register")}
                  >
                    Register Now — It&apos;s Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white border-white/30 hover:bg-white/10 font-medium"
                    onPress={() => router.push("/pricing")}
                  >
                    View Plans
                  </Button>
                </div>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}

// ─── Chevron Down Icon (used in hero CTA) ──────────────────────────

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
