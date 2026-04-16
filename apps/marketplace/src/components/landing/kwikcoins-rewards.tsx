"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Coins,
  Gift,
  Trophy,
  Zap,
  Star,
  ArrowRight,
  Crown,
  Sparkles,
  Check,
  ShoppingBag,
  UserPlus,
  Target,
} from "lucide-react";
import { Button, Card, Chip } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Tier Data ─────────────────────────────────────────────────

interface RewardTier {
  name: string;
  coinRange: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  borderGradient: string;
  progressColor: string;
  perks: string[];
  progressPercent: number;
}

const tiers: RewardTier[] = [
  {
    name: "Bronze",
    coinRange: "1–100 coins",
    subtitle: "Getting Started",
    description:
      "Begin your rewards journey. Every sale earns you coins to unlock better perks.",
    icon: Coins,
    color: "text-amber-700 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    borderGradient: "from-amber-500 to-orange-500",
    progressColor: "bg-amber-500",
    perks: ["Earn 1 coin per sale", "Basic analytics", "Standard support"],
    progressPercent: 65,
  },
  {
    name: "Silver",
    coinRange: "101–500 coins",
    subtitle: "Growing Fast",
    description:
      "Scale your business with enhanced tools and priority access to support.",
    icon: Star,
    color: "text-slate-600 dark:text-slate-300",
    iconBg: "bg-slate-100 dark:bg-slate-800/60",
    borderGradient: "from-slate-400 to-gray-500",
    progressColor: "bg-slate-400",
    perks: [
      "Earn 2 coins per sale",
      "Advanced analytics",
      "Priority support",
      "5% ad discount",
    ],
    progressPercent: 40,
  },
  {
    name: "Gold",
    coinRange: "501–2,000 coins",
    subtitle: "Top Seller",
    description:
      "Unlock premium features and get your products featured on the marketplace.",
    icon: Trophy,
    color: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-50 dark:bg-yellow-900/30",
    borderGradient: "from-yellow-400 to-amber-500",
    progressColor: "bg-yellow-500",
    perks: [
      "Earn 3 coins per sale",
      "Full analytics suite",
      "24/7 support",
      "15% ad discount",
      "Featured placement",
    ],
    progressPercent: 75,
  },
  {
    name: "Platinum",
    coinRange: "2,000+ coins",
    subtitle: "Elite Vendor",
    description:
      "The ultimate seller tier with maximum visibility and dedicated account management.",
    icon: Crown,
    color: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    borderGradient: "from-purple-500 to-violet-600",
    progressColor: "bg-purple-500",
    perks: [
      "Earn 5 coins per sale",
      "Premium dashboard",
      "Dedicated manager",
      "25% ad discount",
      "Homepage feature",
    ],
    progressPercent: 30,
  },
];

// ─── Earning Methods Data ──────────────────────────────────────

interface EarningMethod {
  icon: React.ElementType;
  title: string;
  coins: string;
  description: string;
  color: string;
  bg: string;
}

const earningMethods: EarningMethod[] = [
  {
    icon: ShoppingBag,
    title: "Make a Sale",
    coins: "+1–5 coins",
    description:
      "Earn coins for every successful transaction based on your tier",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    icon: UserPlus,
    title: "Refer a Friend",
    coins: "+50 coins",
    description:
      "Get rewarded when new vendors sign up using your referral link",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    icon: Target,
    title: "Complete Milestone",
    coins: "+100 coins",
    description:
      "Hit sales targets and achieve marketplace goals for bonus rewards",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/40",
  },
];

// ─── Animation Variants ────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ─── Tier Card ─────────────────────────────────────────────────

function TierCard({ tier, index }: { tier: RewardTier; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = tier.icon;

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: index * 0.08 }}
    >
      <Card className="relative overflow-hidden p-5 md:p-6 h-full border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-background">
        {/* Top color accent border */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            tier.progressColor,
          )}
        />

        {/* Tier header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center",
                tier.iconBg,
              )}
            >
              <Icon className={cn("w-5 h-5", tier.color)} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{tier.name}</h3>
              <p className="text-xs text-default-400 font-medium">
                {tier.coinRange}
              </p>
            </div>
          </div>
          <Chip
            variant="soft"
            size="sm"
            className={cn(
              "text-xs font-semibold border border-default-200",
              tier.iconBg,
              tier.color,
            )}
          >
            {tier.subtitle}
          </Chip>
        </div>

        {/* Description */}
        <p className="text-default-500 text-sm leading-relaxed mb-4">
          {tier.description}
        </p>

        {/* Perks list */}
        <ul className="space-y-2 mb-5">
          {tier.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2">
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0",
                  tier.iconBg,
                )}
              >
                <Check className={cn("w-2.5 h-2.5", tier.color)} />
              </div>
              <span className="text-sm text-default-600 dark:text-default-400">
                {perk}
              </span>
            </li>
          ))}
        </ul>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-default-400 font-medium">
              Tier Progress
            </span>
            <span className="text-xs font-semibold text-default-500">
              {tier.progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-default-100 dark:bg-default-200/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={
                isInView ? { width: `${tier.progressPercent}%` } : { width: 0 }
              }
              transition={{
                duration: 1,
                delay: 0.3 + index * 0.1,
                ease: "easeOut",
              }}
              className={cn("h-full rounded-full", tier.progressColor)}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Earning Method Card ───────────────────────────────────────

function EarningMethodCard({ method }: { method: EarningMethod }) {
  const Icon = method.icon;

  return (
    <Card className="p-5 md:p-6 border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-background">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            method.bg,
          )}
        >
          <Icon className={cn("w-6 h-6", method.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{method.title}</h4>
          <div className="flex items-center gap-1.5 mb-2">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {method.coins}
            </span>
          </div>
          <p className="text-default-500 text-xs leading-relaxed">
            {method.description}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Export ───────────────────────────────────────────────

export function KwikCoinsRewards() {
  const headerRef = useRef<HTMLDivElement>(null);
  const tiersRef = useRef<HTMLDivElement>(null);
  const methodsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" });
  const isTiersInView = useInView(tiersRef, { once: true, margin: "-40px" });
  const isMethodsInView = useInView(methodsRef, {
    once: true,
    margin: "-40px",
  });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <section className="py-16 md:py-20 bg-default-50 relative overflow-hidden">
      {/* Subtle decorative background elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12 md:mb-16"
        >
          <Chip variant="soft" className="mb-4">
            <Coins className="w-4 h-4 mr-1" />
            KwikCoins Rewards
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Earn While You <span className="kwik-gradient-text">Sell</span>
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Our loyalty rewards program lets you earn KwikCoins on every sale.
            Unlock exclusive perks, discounts, and premium features as you climb
            through the tiers.
          </p>
        </motion.div>

        {/* ─── Reward Tier Cards Grid ─── */}
        <motion.div
          ref={tiersRef}
          variants={containerVariants}
          initial="hidden"
          animate={isTiersInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 mb-14 md:mb-18"
        >
          {tiers.map((tier, index) => (
            <TierCard key={tier.name} tier={tier} index={index} />
          ))}
        </motion.div>

        {/* ─── Earning Methods Subsection ─── */}
        <motion.div
          ref={methodsRef}
          initial={{ opacity: 0, y: 30 }}
          animate={
            isMethodsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12 md:mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px flex-1 max-w-[120px] bg-default-200 dark:bg-default-700" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-lg md:text-xl font-bold">Earning Methods</h3>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="h-px flex-1 max-w-[120px] bg-default-200 dark:bg-default-700" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            {earningMethods.map((method) => (
              <EarningMethodCard key={method.title} method={method} />
            ))}
          </div>
        </motion.div>

        {/* ─── CTA ─── */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Gift className="w-5 h-5 text-purple-500" />
            <Zap className="w-5 h-5 text-amber-500" />
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-3">
            Start earning KwikCoins today
          </h3>
          <p className="text-default-500 text-sm md:text-base max-w-md mx-auto mb-8">
            Join thousands of vendors already earning rewards on every sale. The
            more you sell, the more you earn.
          </p>
          <Button
            size="lg"
            className="kwik-gradient text-white font-semibold kwik-shadow-lg hover:opacity-90 transition-opacity"
          >
            Start Earning KwikCoins
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
