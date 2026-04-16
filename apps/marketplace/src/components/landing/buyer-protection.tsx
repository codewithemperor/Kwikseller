"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Wallet,
  CircleDollarSign,
  UserCheck,
  Lock,
  LifeBuoy,
  Gem,
} from "lucide-react";
import { Card, Chip } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Protection Features Data ─────────────────────────────────

const protectionFeatures = [
  {
    icon: Wallet,
    title: "Escrow Payment Protection",
    description:
      "Your money is held safely in escrow until you confirm delivery. Sellers only get paid when you are satisfied.",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    border: "border-accent/10",
  },
  {
    icon: CircleDollarSign,
    title: "Money-Back Guarantee",
    description:
      "Get a full refund if your item does not match the description. No questions asked — your satisfaction comes first.",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    border: "border-success/10",
  },
  {
    icon: UserCheck,
    title: "Verified Sellers",
    description:
      "Every vendor is verified with government-issued ID and business documents so you can shop with confidence.",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    border: "border-warning/10",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description:
      "All transactions are encrypted with industry-standard SSL technology. Your card details are never stored on our servers.",
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    border: "border-danger/10",
  },
  {
    icon: LifeBuoy,
    title: "Dispute Resolution",
    description:
      "Our dedicated support team is available 24/7 to mediate and resolve any issues between buyers and sellers quickly.",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    border: "border-accent/10",
  },
  {
    icon: Gem,
    title: "Product Authenticity",
    description:
      "We guarantee that every product listed is authentic. If you receive a counterfeit item, you get your money back.",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    border: "border-success/10",
  },
];

// ─── Animation Variants ───────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

// ─── Main Export ──────────────────────────────────────────────

export function BuyerProtection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-success/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <Chip variant="soft" className="mb-4">
            <Shield className="w-4 h-4 mr-1" />
            Buyer Protection
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Your Purchase is <span className="text-accent">Protected</span>
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Every transaction on KWIKSELLER is backed by our comprehensive buyer
            protection programme. Shop with complete peace of mind.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {protectionFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card
                  className={cn(
                    "p-5 md:p-6 h-full",
                    "border border-border/60 bg-background",
                    "hover:-translate-y-1 hover:shadow-xl",
                    "transition-all duration-300",
                    feature.border,
                  )}
                >
                  <div className="flex flex-col gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        feature.iconBg,
                      )}
                    >
                      <Icon className={cn("w-6 h-6", feature.iconColor)} />
                    </div>
                    <h3 className="font-semibold text-base leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-default-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={
            isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }
          }
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <div className="h-px w-full max-w-xl mx-auto bg-accent/40" />
          <p className="text-center text-xs text-default-400 mt-5">
            Protected by KWIKSELLER&apos;s buyer guarantee across all African
            markets
          </p>
        </motion.div>
      </div>
    </section>
  );
}
