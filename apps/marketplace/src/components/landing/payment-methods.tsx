"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@kwikseller/ui";
import {
  CreditCard,
  Shield,
  Lock,
  CheckCircle,
  Smartphone,
  Building,
  QrCode,
  Globe,
  Zap,
  Wallet,
} from "lucide-react";
import { Card, Chip } from "@heroui/react";

// ─── Data ────────────────────────────────────────────────────

const mobileWallets = [
  {
    name: "Paystack",
    desc: "Cards & bank transfers",
    icon: Zap,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    name: "Flutterwave",
    desc: "All payment methods",
    icon: Globe,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    name: "Mobile Money",
    desc: "M-Pesa, MTN, Airtel",
    icon: Smartphone,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/30",
  },
  {
    name: "M-Pesa",
    desc: "Instant transfers",
    icon: Wallet,
    color: "text-green-700 dark:text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    name: "PalmPay",
    desc: "Quick mobile payments",
    icon: Smartphone,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    name: "OPay",
    desc: "Seamless transactions",
    icon: Wallet,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
];

const bankingCards = [
  {
    name: "Visa",
    desc: "Credit & debit cards",
    icon: CreditCard,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    name: "Mastercard",
    desc: "Worldwide accepted",
    icon: CreditCard,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    name: "Bank Transfer",
    desc: "Direct account transfers",
    icon: Building,
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-900/30",
  },
  {
    name: "USSD",
    desc: "Dial to pay",
    icon: Smartphone,
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/20",
  },
  {
    name: "Verve",
    desc: "African debit cards",
    icon: CreditCard,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    name: "Visa QR",
    desc: "Scan and pay",
    icon: QrCode,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
];

const trustItems = [
  {
    icon: Lock,
    label: "256-bit SSL Encryption",
    desc: "All data is encrypted",
  },
  { icon: Shield, label: "Buyer Protection", desc: "Full refund guarantee" },
  {
    icon: CheckCircle,
    label: "Instant Refunds",
    desc: "Money back in minutes",
  },
];

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
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: "easeOut" as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Payment Card ────────────────────────────────────────────

function PaymentCard({
  item,
  index,
}: {
  item: {
    name: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  };
  index: number;
}) {
  const Icon = item.icon;
  return (
    <StaggerChild index={index}>
      <Card className="border border-default-200 dark:border-default-100 bg-background p-4 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-accent/20">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
              item.bg,
            )}
          >
            <Icon className={cn("w-5 h-5", item.color)} />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm">{item.name}</h4>
            <p className="text-xs text-default-400 mt-0.5">{item.desc}</p>
          </div>
        </div>
      </Card>
    </StaggerChild>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function PaymentMethodsShowcase() {
  return (
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-0 md:px-4 ">
        {/* Section Header */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Chip variant="soft" color="primary" size="sm">
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                Multiple Methods
              </Chip>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Flexible Payment Options
            </h2>
            <p className="text-sm text-default-500 max-w-lg mx-auto">
              Pay your way — we support every major payment method across Africa
            </p>
          </div>
        </AnimatedSection>

        {/* Mobile Money & Wallets */}
        <AnimatedSection delay={0.1}>
          <div className="mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-accent" />
            <h3 className="text-base font-semibold">
              Mobile Money &amp; Wallets
            </h3>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {mobileWallets.map((item, i) => (
            <PaymentCard key={item.name} item={item} index={i} />
          ))}
        </div>

        {/* Banking & Cards */}
        <AnimatedSection delay={0.2}>
          <div className="mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-accent" />
            <h3 className="text-base font-semibold">Banking &amp; Cards</h3>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {bankingCards.map((item, i) => (
            <PaymentCard key={item.name} item={item} index={i + 6} />
          ))}
        </div>

        {/* Trust Bar */}
        <AnimatedSection delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/10"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-[11px] text-default-400">
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>

        {/* Bottom Note */}
        <AnimatedSection delay={0.4}>
          <p className="text-center text-xs text-default-400 max-w-lg mx-auto">
            All transactions are processed securely through our PCI-DSS
            compliant payment partners
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
