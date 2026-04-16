"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Coins,
  Wallet,
  Gift,
  Trophy,
  Link,
  MessageCircle,
  Twitter,
  Mail,
  Copy,
  Check,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button, Card, Chip } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Earnings Breakdown Data ──────────────────────────────────

interface EarningCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const earningsCards: EarningCard[] = [
  {
    title: "Referral Reward",
    value: "₦500",
    subtitle: "+ 5% commission on their first 5 orders",
    icon: Wallet,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    title: "Friend Bonus",
    value: "₦200",
    subtitle: "Welcome credit for your friend",
    icon: Gift,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    title: "Monthly Bonus",
    value: "₦2,000",
    subtitle: "For 10+ referrals in a month",
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/40",
  },
];

// ─── Share Button Data ────────────────────────────────────────

interface ShareButton {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  hoverBg: string;
}

const shareButtons: ShareButton[] = [
  {
    label: "Copy Link",
    icon: Link,
    color: "text-default-600 dark:text-default-300",
    bg: "bg-default-100 dark:bg-default-200/30",
    hoverBg: "hover:bg-default-200 dark:hover:bg-default-200/50",
  },
  {
    label: "WhatsApp",
    icon: MessageCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    hoverBg: "hover:bg-emerald-200 dark:hover:bg-emerald-900/60",
  },
  {
    label: "Twitter/X",
    icon: Twitter,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-900/40",
    hoverBg: "hover:bg-sky-200 dark:hover:bg-sky-900/60",
  },
  {
    label: "Email",
    icon: Mail,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/40",
    hoverBg: "hover:bg-rose-200 dark:hover:bg-rose-900/60",
  },
];

// ─── How It Works Steps ───────────────────────────────────────

interface HowStep {
  number: number;
  title: string;
  description: string;
}

const howSteps: HowStep[] = [
  {
    number: 1,
    title: "Share Your Link",
    description: "Send your unique referral code to friends and family",
  },
  {
    number: 2,
    title: "Friend Signs Up",
    description: "They register on Kwikseller using your referral code",
  },
  {
    number: 3,
    title: "Both Earn Rewards",
    description: "You earn ₦500 and your friend gets ₦200 welcome credit",
  },
];

// ─── Referral Stats ───────────────────────────────────────────

const referralStats = [
  { label: "24 Referrals", icon: Users },
  { label: "₦12,000 Earned", icon: Wallet },
  { label: "8 Active", icon: Check },
];

// ─── Animation Variants ───────────────────────────────────────

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

// ─── Animated Section Wrapper ─────────────────────────────────

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

// ─── Main Export ──────────────────────────────────────────────

export function ReferralProgram() {
  const [codeCopied, setCodeCopied] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const earningsRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" });
  const isCodeInView = useInView(codeRef, { once: true, margin: "-40px" });
  const isEarningsInView = useInView(earningsRef, {
    once: true,
    margin: "-40px",
  });
  const isShareInView = useInView(shareRef, { once: true, margin: "-40px" });
  const isStatsInView = useInView(statsRef, { once: true, margin: "-40px" });
  const isStepsInView = useInView(stepsRef, { once: true, margin: "-40px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  const handleCopyCode = () => {
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <section className="py-16 md:py-20 bg-default-50/50 dark:bg-default-50/30 relative overflow-hidden">
      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center mb-12 md:mb-16"
        >
          <Chip variant="soft" className="mb-4">
            <Coins className="w-4 h-4 mr-1" />
            Rewards
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Refer &amp; Earn
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Share Kwikseller with friends and earn rewards for every successful
            referral
          </p>
        </motion.div>

        {/* ─── Referral Code Display ─── */}
        <motion.div
          ref={codeRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isCodeInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="max-w-lg mx-auto mb-12"
        >
          <Card className="p-6 shadow-clean rounded-2xl border border-border">
            <p className="text-sm text-default-500 mb-3 font-medium">
              Your Referral Code
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-default-100 dark:bg-default-200/30 rounded-xl px-5 py-3.5 font-mono text-lg md:text-xl font-bold tracking-wider text-default-800 dark:text-default-200 select-all">
                KWIK-EMMA-2024
              </div>
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "rounded-xl px-4 font-semibold min-w-[120px] transition-colors",
                  codeCopied
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    : "kwik-flat-subtle text-accent",
                )}
                onPress={handleCopyCode}
              >
                {codeCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* ─── Earnings Breakdown ─── */}
        <motion.div
          ref={earningsRef}
          variants={containerVariants}
          initial="hidden"
          animate={isEarningsInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 mb-12 md:mb-16"
        >
          {earningsCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={itemVariants}>
                <Card className="p-5 md:p-6 h-full shadow-clean rounded-2xl border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        card.bg,
                      )}
                    >
                      <Icon className={cn("w-6 h-6", card.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-default-400 font-medium mb-1">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold mb-1">{card.value}</p>
                      <p className="text-sm text-default-500">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Share Buttons Row ─── */}
        <motion.div
          ref={shareRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isShareInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="max-w-xl mx-auto mb-12"
        >
          <p className="text-sm text-default-500 font-medium text-center mb-4">
            Share via
          </p>
          <div className="flex items-center justify-center gap-3">
            {shareButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.label}
                  type="button"
                  title={btn.label}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
                    btn.bg,
                    btn.color,
                    btn.hoverBg,
                    "hover:scale-105 active:scale-95",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Referral Stats ─── */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="flex items-center justify-center gap-3 md:gap-4 mb-12 md:mb-16 flex-wrap"
        >
          {referralStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-default-100 dark:bg-default-200/30 border border-border shadow-clean"
              >
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-default-700 dark:text-default-300">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* ─── How It Works ─── */}
        <motion.div
          ref={stepsRef}
          variants={containerVariants}
          initial="hidden"
          animate={isStepsInView ? "visible" : "hidden"}
          className="max-w-3xl mx-auto mb-12 md:mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px flex-1 max-w-[120px] bg-default-200 dark:bg-default-700" />
            <h3 className="text-lg md:text-xl font-bold">How It Works</h3>
            <div className="h-px flex-1 max-w-[120px] bg-default-200 dark:bg-default-700" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
            {howSteps.map((step) => (
              <motion.div key={step.number} variants={itemVariants}>
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl kwik-flat-subtle flex items-center justify-center">
                      <span className="text-xl font-bold text-accent">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm md:text-base">
                      {step.title}
                    </h4>
                    <p className="text-default-500 text-xs md:text-sm leading-relaxed max-w-[220px] mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── CTA ─── */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center"
        >
          <h3 className="text-xl md:text-2xl font-bold mb-3">
            Ready to start earning?
          </h3>
          <p className="text-default-500 text-sm md:text-base max-w-md mx-auto mb-8">
            Share your referral code with friends and start earning rewards on
            Kwikseller today.
          </p>
          <Button
            size="lg"
            className="kwik-gradient text-white font-semibold kwik-shadow-lg hover:opacity-90 transition-opacity"
          >
            Start Referring
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
