// KWIKSELLER - Enhanced Pricing Page
// Hero, Toggle, 3 Tiers, Feature Comparison, FAQ, Money-Back Guarantee, CTA

"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  X,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Headphones,
  Star,
  Zap,
  Crown,
  Rocket,
  Gift,
  Lock,
  TrendingUp,
  BarChart3,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Palette,
  Globe,
  Code2,
  FileSpreadsheet,
  Package,
  BadgePercent,
  Clock,
  Layers,
  ChevronDown,
} from "lucide-react";
import { Button, Card, Chip, Separator } from "@heroui/react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@kwikseller/ui";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";

// ─── Animation Helpers ─────────────────────────────────────────

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
      transition={{
        duration: 0.5,
        delay: index * 0.12,
        ease: "easeOut" as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Plan Data ─────────────────────────────────────────────────

type PlanKey = "free" | "growth" | "enterprise";

interface PlanTier {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  icon: React.ElementType;
  popular: boolean;
  features: string[];
  ctaLabel: string;
}

const plans: PlanTier[] = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for new sellers exploring the marketplace",
    icon: Rocket,
    popular: false,
    features: [
      "Up to 50 product listings",
      "Basic analytics dashboard",
      "Email support (48h response)",
      "Standard delivery integration",
      "5% transaction fee",
      "Kwikseller community access",
    ],
    ctaLabel: "Start Free",
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 5000,
    yearlyPrice: 48000,
    description: "For serious sellers ready to scale their business",
    icon: TrendingUp,
    popular: true,
    features: [
      "Unlimited product listings",
      "Advanced analytics & insights",
      "Priority support (4h response)",
      "Fast delivery integration",
      "3% transaction fee",
      "Pool selling access",
      "Custom store theme",
      "Featured placement in marketplace",
      "KwikCoins bonus: 100/month",
      "Marketing tools & promotions",
    ],
    ctaLabel: "Get Growth",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 15000,
    yearlyPrice: 144000,
    description: "Maximum power for established businesses & brands",
    icon: Crown,
    popular: false,
    features: [
      "Everything in Growth, plus:",
      "Dedicated account manager",
      "Full API access & webhooks",
      "Bulk listing tools (CSV/Excel)",
      "White-label options",
      "Custom integrations",
      "1% transaction fee",
      "SLA guarantee (99.9% uptime)",
      "Custom domain support",
      "KwikCoins bonus: 500/month",
      "Multi-store management",
      "Priority feature requests",
    ],
    ctaLabel: "Go Enterprise",
  },
];

// ─── Feature Comparison Data (15+ features) ────────────────────

const comparisonFeatures: {
  label: string;
  icon?: React.ElementType;
  free: string | boolean;
  growth: string | boolean;
  enterprise: string | boolean;
}[] = [
  {
    label: "Product Listings",
    icon: Package,
    free: "Up to 50",
    growth: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    free: "Basic",
    growth: "Advanced",
    enterprise: "Full Suite + API",
  },
  {
    label: "Support",
    icon: Headphones,
    free: "Email (48h)",
    growth: "Priority (4h)",
    enterprise: "Dedicated Manager",
  },
  {
    label: "Transaction Fee",
    icon: BadgePercent,
    free: "5%",
    growth: "3%",
    enterprise: "1%",
  },
  {
    label: "Delivery Speed",
    icon: Clock,
    free: "Standard",
    growth: "Fast",
    enterprise: "Priority",
  },
  { label: "Pool Selling", free: false, growth: true, enterprise: true },
  {
    label: "Custom Store Theme",
    icon: Palette,
    free: false,
    growth: true,
    enterprise: true,
  },
  {
    label: "Featured Placement",
    icon: Star,
    free: false,
    growth: true,
    enterprise: true,
  },
  { label: "Marketing Tools", free: false, growth: true, enterprise: true },
  {
    label: "KwikCoins Bonus",
    icon: Gift,
    free: "—",
    growth: "100/mo",
    enterprise: "500/mo",
  },
  {
    label: "API Access",
    icon: Code2,
    free: false,
    growth: false,
    enterprise: true,
  },
  {
    label: "Bulk Listing Tools",
    icon: FileSpreadsheet,
    free: false,
    growth: false,
    enterprise: true,
  },
  {
    label: "White-Label Options",
    icon: Layers,
    free: false,
    growth: false,
    enterprise: true,
  },
  {
    label: "Custom Integrations",
    icon: Globe,
    free: false,
    growth: false,
    enterprise: true,
  },
  {
    label: "Multi-Store Support",
    icon: Users,
    free: false,
    growth: false,
    enterprise: true,
  },
  { label: "Custom Domain", free: false, growth: false, enterprise: true },
  {
    label: "SLA Guarantee",
    icon: ShieldCheck,
    free: false,
    growth: false,
    enterprise: "99.9%",
  },
];

// ─── FAQ Data ──────────────────────────────────────────────────

const faqs = [
  {
    question: "Can I switch between plans at any time?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time from your dashboard. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the start of your next billing cycle, and you'll be credited the prorated difference.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept payments via Paystack and Flutterwave, which means you can pay with debit cards, bank transfers, USSD, and mobile money. All transactions are securely processed with bank-grade encryption.",
  },
  {
    question: "What happens to my data if I cancel my subscription?",
    answer:
      "Your data remains safe for 90 days after cancellation. During this period, you can reactivate your plan and pick up right where you left off. After 90 days, your store data will be permanently deleted in accordance with our privacy policy.",
  },
  {
    question: "How does the transaction fee work?",
    answer:
      "The transaction fee is a small percentage taken from each successful sale on the platform. Free plan sellers pay 5%, Growth sellers pay 3%, and Enterprise sellers enjoy the lowest rate at just 1%. This fee covers payment processing, platform maintenance, and buyer protection.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "Yes! Both Growth and Enterprise plans come with a 14-day free trial. You get full access to all plan features during the trial period — no credit card required. If you decide not to continue, your account simply reverts to the Free plan.",
  },
  {
    question:
      "Do you offer discounts for non-profits or educational institutions?",
    answer:
      "Absolutely! We offer special pricing for registered non-profits, educational institutions, and student entrepreneurs. Contact our sales team at sales@kwikseller.com with your organization details, and we'll create a custom plan for you.",
  },
];

// ─── Comparison Cell Helper ────────────────────────────────────

function ComparisonCell({
  value,
  isHighlighted,
}: {
  value: string | boolean;
  isHighlighted: boolean;
}) {
  if (typeof value === "boolean") {
    return value ? (
      <CheckCircle
        className={cn(
          "w-5 h-5 mx-auto",
          isHighlighted ? "text-accent" : "text-success",
        )}
      />
    ) : (
      <X className="w-5 h-5 text-default-300 dark:text-default-600 mx-auto" />
    );
  }
  return (
    <span
      className={cn(
        "text-sm",
        isHighlighted
          ? "font-semibold text-accent"
          : "text-default-600 dark:text-default-400",
      )}
    >
      {value}
    </span>
  );
}

// ─── FAQ Accordion Item ────────────────────────────────────────

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-default-200 dark:border-default-200/50 rounded-xl overflow-hidden transition-colors hover:border-default-300 dark:hover:border-default-200">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-6 py-5 text-left hover:bg-default-50 dark:hover:bg-default-50/50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-sm sm:text-base pr-4">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-default-400 flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-sm text-default-500 leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Format Naira ──────────────────────────────────────────────

function formatNaira(amount: number): string {
  if (amount === 0) return "₦0";
  return `₦${amount.toLocaleString()}`;
}

// ─── Page Component ────────────────────────────────────────────

export default function PricingPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const getPrice = (plan: PlanTier) => {
    if (isYearly) return plan.yearlyPrice;
    return plan.monthlyPrice;
  };

  return (
    <MarketplaceLayout>
      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-accent relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  py-16 sm:py-20 md:py-24 relative">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <Chip
                variant="soft"
                className="mb-6 bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Simple Pricing
              </Chip>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 text-shadow-md leading-tight">
                Simple, Transparent Pricing
              </h1>
              <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                No hidden fees. No surprises. Start free and scale as your
                business grows. Every plan includes our core marketplace
                features.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
                  <Lock className="w-4 h-4" />
                  Secure Payments
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  Buyer Protection
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
                  <Headphones className="w-4 h-4" />
                  24/7 Support
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z"
              className="fill-background dark:fill-[#1a1a2e]"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 & 3: PRICING TOGGLE + 3 TIERS
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-warning/5 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-accent/[0.03] blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  relative">
          {/* ─── Toggle ──────────────────────────────────── */}
          <AnimatedSection>
            <div className="flex flex-col items-center gap-4 mb-14">
              {/* Toggle switch */}
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-sm font-semibold transition-all duration-300",
                    !isYearly ? "text-foreground" : "text-default-400",
                  )}
                >
                  Monthly
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={cn(
                    "relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2",
                    isYearly
                      ? "bg-accent"
                      : "bg-default-300 dark:bg-default-500",
                  )}
                  role="switch"
                  aria-checked={isYearly}
                  aria-label="Toggle yearly pricing"
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: isYearly ? 32 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <span
                  className={cn(
                    "text-sm font-semibold transition-all duration-300",
                    isYearly ? "text-foreground" : "text-default-400",
                  )}
                >
                  Yearly
                </span>
              </div>

              {/* Save badge */}
              <AnimatePresence mode="wait">
                {isYearly ? (
                  <motion.div
                    key="save-badge"
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Chip
                      color="success"
                      variant="soft"
                      size="sm"
                      className="font-semibold"
                    >
                      <Gift className="w-3.5 h-3.5 mr-1" />
                      Save 20% — Pay yearly &amp; save!
                    </Chip>
                  </motion.div>
                ) : (
                  <motion.span
                    key="monthly-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-default-400"
                  >
                    Switch to yearly to save 20%
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </AnimatedSection>

          {/* ─── Pricing Cards ────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const price = getPrice(plan);
              const isPopular = plan.popular;

              return (
                <StaggerChild key={plan.key} index={index}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="h-full"
                  >
                    <Card
                      className={cn(
                        "relative h-full p-6 sm:p-8 transition-all duration-300 overflow-hidden",
                        isPopular
                          ? "border-2 border-accent ring-4 ring-accent/10 shadow-xl kwik-shadow-lg scale-[1.02] md:scale-105"
                          : "border border-default-200 dark:border-default-200/50 hover:shadow-lg hover:border-default-300",
                      )}
                    >
                      {/* Popular badge */}
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
                      )}

                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <Chip
                            variant="primary"
                            size="sm"
                            className="font-bold shadow-md"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Most Popular
                          </Chip>
                        </div>
                      )}

                      {/* Plan header */}
                      <div className="flex flex-col items-center text-center pt-2 pb-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                            isPopular
                              ? "bg-accent text-white"
                              : "bg-default-100 dark:bg-default-100/50 text-accent",
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-default-500 mt-1.5 max-w-xs">
                          {plan.description}
                        </p>

                        {/* Price */}
                        <div className="mt-6 flex items-baseline gap-1">
                          {plan.monthlyPrice > 0 && isYearly && (
                            <motion.span
                              key={`strikethrough-${plan.key}`}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8 }}
                              className="text-base text-default-400 line-through mr-2"
                            >
                              {formatNaira(plan.monthlyPrice)}
                            </motion.span>
                          )}
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={`${plan.key}-${price}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.25 }}
                              className="text-4xl sm:text-5xl font-extrabold"
                            >
                              {formatNaira(price)}
                            </motion.span>
                          </AnimatePresence>
                          <span className="text-default-500 text-sm font-medium">
                            {price === 0 ? "" : isYearly ? "/year" : "/mo"}
                          </span>
                        </div>

                        {price === 0 && (
                          <span className="text-sm text-default-500 mt-1">
                            Free forever
                          </span>
                        )}
                      </div>

                      <Separator className="my-2" />

                      {/* Features */}
                      <ul className="space-y-3 py-5 flex-1">
                        {plan.features.map((feature, fIndex) => (
                          <li
                            key={fIndex}
                            className="flex items-start gap-2.5 text-sm"
                          >
                            <CheckCircle
                              className={cn(
                                "w-4.5 h-4.5 flex-shrink-0 mt-0.5",
                                isPopular ? "text-accent" : "text-success",
                              )}
                            />
                            <span
                              className={cn(
                                fIndex === 0 && plan.key === "enterprise"
                                  ? "font-medium text-default-700 dark:text-default-300"
                                  : "text-default-600 dark:text-default-400",
                              )}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        variant={isPopular ? "primary" : "ghost"}
                        size="lg"
                        className={cn(
                          "w-full mt-2 font-semibold",
                          isPopular && "kwik-shadow-lg",
                        )}
                        onPress={() => router.push("/register")}
                      >
                        {plan.ctaLabel}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Card>
                  </motion.div>
                </StaggerChild>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: FEATURE COMPARISON TABLE
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-default-50 dark:bg-default-50/20 relative">
        <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Zap className="w-4 h-4 mr-1" />
                Compare Plans
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Feature Comparison
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                See exactly what&apos;s included in every plan. Side-by-side
                comparison across {comparisonFeatures.length} features.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="max-w-5xl mx-auto">
              {/* Desktop table */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-default-200 dark:border-default-200/50 bg-background shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-4 bg-default-50 dark:bg-default-100/30">
                  <div className="p-4 sm:p-5 text-sm font-medium text-default-500">
                    Feature
                  </div>
                  <div className="p-4 sm:p-5 text-center text-sm font-semibold">
                    Free
                  </div>
                  <div className="p-4 sm:p-5 text-center relative">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-accent">
                        Growth
                      </span>
                      <Chip
                        size="sm"
                        color="accent"
                        variant="soft"
                        className="text-[10px] px-1.5"
                      >
                        POPULAR
                      </Chip>
                    </div>
                    <div className="absolute top-0 left-0 bottom-0 w-px bg-accent/20" />
                    <div className="absolute top-0 right-0 bottom-0 w-px bg-accent/20" />
                  </div>
                  <div className="p-4 sm:p-5 text-center text-sm font-semibold">
                    Enterprise
                  </div>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-default-100 dark:divide-default-200/30">
                  {comparisonFeatures.map((feature, fIndex) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div
                        key={fIndex}
                        className={cn(
                          "grid grid-cols-4 transition-colors hover:bg-default-50/50 dark:hover:bg-default-100/10",
                          fIndex % 2 === 0
                            ? "bg-background"
                            : "bg-default-50/30 dark:bg-default-100/5",
                        )}
                      >
                        {/* Feature label */}
                        <div className="p-3.5 sm:p-4 flex items-center gap-2.5 text-sm font-medium">
                          {FeatureIcon && (
                            <FeatureIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
                          )}
                          <span className="text-default-700 dark:text-default-300">
                            {feature.label}
                          </span>
                        </div>
                        {/* Free */}
                        <div className="p-3.5 sm:p-4 text-center">
                          <ComparisonCell
                            value={feature.free}
                            isHighlighted={false}
                          />
                        </div>
                        {/* Growth (highlighted column) */}
                        <div className="p-3.5 sm:p-4 text-center bg-accent/[0.04] relative">
                          <div className="absolute top-0 left-0 bottom-0 w-px bg-accent/10" />
                          <div className="absolute top-0 right-0 bottom-0 w-px bg-accent/10" />
                          <ComparisonCell
                            value={feature.growth}
                            isHighlighted
                          />
                        </div>
                        {/* Enterprise */}
                        <div className="p-3.5 sm:p-4 text-center">
                          <ComparisonCell
                            value={feature.enterprise}
                            isHighlighted={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile comparison (stacked cards) */}
              <div className="lg:hidden space-y-6">
                {plans.map((plan, planIndex) => (
                  <div key={plan.key}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          plan.popular
                            ? "bg-accent text-white"
                            : "bg-default-100 text-accent",
                        )}
                      >
                        <plan.icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold">{plan.name}</h3>
                      {plan.popular && (
                        <Chip size="sm" color="accent" variant="soft">
                          POPULAR
                        </Chip>
                      )}
                    </div>
                    <Card className="border border-default-200 dark:border-default-200/50 divide-y divide-default-100 dark:divide-default-200/30">
                      {comparisonFeatures.map((feature, fIndex) => {
                        const FeatureIcon = feature.icon;
                        const value = feature[plan.key];
                        return (
                          <div
                            key={fIndex}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <div className="flex items-center gap-2 text-sm text-default-600 dark:text-default-400">
                              {FeatureIcon && (
                                <FeatureIcon className="w-3.5 h-3.5 text-default-400 flex-shrink-0" />
                              )}
                              {feature.label}
                            </div>
                            <ComparisonCell
                              value={value}
                              isHighlighted={plan.popular}
                            />
                          </div>
                        );
                      })}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: FAQ
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <MessageSquare className="w-4 h-4 mr-1" />
                FAQ
              </Chip>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-default-500 max-w-lg mx-auto">
                Everything you need to know about our pricing plans and billing.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="max-w-3xl mx-auto space-y-3">
              {faqs.map((item, index) => (
                <StaggerChild key={index} index={index}>
                  <FAQItem
                    item={item}
                    isOpen={openFAQ === index}
                    onToggle={() =>
                      setOpenFAQ(openFAQ === index ? null : index)
                    }
                  />
                </StaggerChild>
              ))}
            </div>
          </AnimatedSection>

          {/* Contact support */}
          <AnimatedSection delay={0.3}>
            <div className="max-w-3xl mx-auto mt-8 text-center">
              <p className="text-sm text-default-500">
                Still have questions?{" "}
                <button
                  onClick={() => window.open("mailto:support@kwikseller.com")}
                  className="text-accent font-medium hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact our support team
                </button>
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: MONEY-BACK GUARANTEE
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-default-50 dark:bg-default-50/20 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-25 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <Card className="border-none p-8 sm:p-10 md:p-12 text-center relative overflow-hidden bg-background">
                {/* Decorative gradient orbs */}
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-accent/10 blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-success/10 blur-[60px] pointer-events-none" />

                <div className="relative">
                  {/* 30-day badge */}
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                      <ShieldCheck className="w-9 h-9 text-success" />
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                    30-Day Money-Back Guarantee
                  </h2>
                  <p className="text-default-500 leading-relaxed mb-8 max-w-2xl mx-auto text-sm sm:text-base">
                    We&apos;re confident you&apos;ll love Kwikseller. If
                    you&apos;re not completely satisfied within the first 30
                    days of any paid plan, we&apos;ll give you a full refund —
                    no questions asked. Your satisfaction is our top priority.
                  </p>

                  {/* Trust metrics */}
                  <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                    <div className="flex items-center gap-2 text-sm text-default-600 dark:text-default-400">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-success" />
                      </div>
                      Secure Payments
                    </div>
                    <div className="flex items-center gap-2 text-sm text-default-600 dark:text-default-400">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Headphones className="w-4 h-4 text-success" />
                      </div>
                      24/7 Support
                    </div>
                    <div className="flex items-center gap-2 text-sm text-default-600 dark:text-default-400">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-success" />
                      </div>
                      98% Satisfaction
                    </div>
                    <div className="flex items-center gap-2 text-sm text-default-600 dark:text-default-400">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Gift className="w-4 h-4 text-success" />
                      </div>
                      Cancel Anytime
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7: CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="container mx-auto px-0 md:px-4  py-16 sm:py-20 md:py-24 relative">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Image
                  src="/icon.png"
                  alt="KWIKSELLER"
                  width={48}
                  height={48}
                  className="rounded-xl"
                />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 text-shadow-md">
                Start Selling for Free
              </h2>
              <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
                Join thousands of sellers already growing their business on
                Kwikseller. Set up your store in minutes — no credit card
                required.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-accent font-bold kwik-shadow-lg hover:bg-white/90 min-w-[200px]"
                  onPress={() => router.push("/register")}
                >
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white border-white/30 hover:bg-white/10 font-medium min-w-[200px]"
                  onPress={() => router.push("/login")}
                >
                  Sign In
                </Button>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="flex -space-x-2">
                  {["bg-accent", "bg-success", "bg-warning", "bg-danger"].map(
                    (color, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white",
                          color,
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ),
                  )}
                </div>
                <p className="text-white/60 text-xs sm:text-sm">
                  Join 10,000+ sellers across Africa
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </MarketplaceLayout>
  );
}
