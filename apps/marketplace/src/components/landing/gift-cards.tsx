"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Gift,
  Heart,
  PartyPopper,
  Star,
  Send,
  ShoppingBag,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Card, Chip, Button } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Gift Card Data ──────────────────────────────────────────

interface GiftCardItem {
  amount: string;
  label: string;
  description: string;
  badge?: string;
  borderColor: string;
  bgAccent: string;
  iconColor: string;
  patternColor: string;
  amountColor: string;
}

const giftCards: GiftCardItem[] = [
  {
    amount: "₦1,000",
    label: "Small",
    description: "A little something special",
    borderColor: "border-accent/30",
    bgAccent: "bg-accent/5",
    iconColor: "text-accent",
    patternColor: "text-accent/10",
    amountColor: "text-accent",
  },
  {
    amount: "₦2,500",
    label: "Medium",
    description: "The perfect treat",
    borderColor: "border-success/30",
    bgAccent: "bg-success/5",
    iconColor: "text-success",
    patternColor: "text-success/10",
    amountColor: "text-success",
  },
  {
    amount: "₦5,000",
    label: "Popular",
    description: "Fan-favourite amount",
    badge: "Most Popular",
    borderColor: "border-warning/30",
    bgAccent: "bg-warning/5",
    iconColor: "text-warning",
    patternColor: "text-warning/10",
    amountColor: "text-warning",
  },
  {
    amount: "₦10,000",
    label: "Premium",
    description: "Luxury gifting made easy",
    badge: "Premium",
    borderColor: "border-foreground/20",
    bgAccent: "bg-foreground/5",
    iconColor: "text-foreground",
    patternColor: "text-foreground/10",
    amountColor: "text-foreground",
  },
];

// ─── Occasions Data ──────────────────────────────────────────

const occasions = [
  {
    label: "Birthday",
    icon: PartyPopper,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    label: "Wedding",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    label: "Anniversary",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    label: "Thank You",
    icon: Gift,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Congratulations",
    icon: PartyPopper,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
];

// ─── How It Works Steps ──────────────────────────────────────

const howItWorksSteps = [
  {
    step: 1,
    icon: CreditCard,
    title: "Choose Amount",
    description: "Pick from ₦1,000 to ₦10,000 or enter a custom amount.",
  },
  {
    step: 2,
    icon: Send,
    title: "Send to Recipient",
    description: "Send via email, SMS, or share the link directly.",
  },
  {
    step: 3,
    icon: ShoppingBag,
    title: "They Shop!",
    description:
      "Your recipient picks what they love from thousands of products.",
  },
];

// ─── Animation Variants ──────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ─── Decorative Pattern Component ────────────────────────────

function CardPattern({ color, label }: { color: string; label: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none select-none">
      {/* Top-right corner circles */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full border-2 border-dashed opacity-30"
        style={{ borderColor: "currentColor" }}
      />
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-dashed opacity-15"
        style={{ borderColor: "currentColor" }}
      />
      {/* Bottom-left circles */}
      <div
        className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full border-2 border-dashed opacity-20"
        style={{ borderColor: "currentColor" }}
      />
      {/* Label watermark */}
      <span
        className={cn(
          "absolute bottom-3 right-4 text-6xl font-black opacity-[0.04]",
          color,
        )}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Gift Card Component ─────────────────────────────────────

function GiftCard({ card }: { card: GiftCardItem }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 h-full shadow-clean hover-lift",
        "bg-background border",
        card.borderColor,
        "transition-all duration-300",
      )}
    >
      <div className={cn("absolute inset-0", card.bgAccent)} />
      <CardPattern color={card.patternColor} label="K" />

      {/* Badge */}
      {card.badge && (
        <div className="relative z-10 mb-3">
          <Chip
            color={card.label === "Popular" ? "warning" : "default"}
            size="sm"
            variant="soft"
            className="font-medium"
          >
            {card.badge}
          </Chip>
        </div>
      )}

      {/* Label */}
      <div className="relative z-10 mb-1">
        <span className="text-xs font-medium text-default-400 uppercase tracking-wider">
          {card.label} Card
        </span>
      </div>

      {/* Amount */}
      <div className="relative z-10 mb-4">
        <p
          className={cn(
            "text-3xl md:text-4xl font-bold tracking-tight",
            card.amountColor,
          )}
        >
          {card.amount}
        </p>
      </div>

      {/* Description */}
      <div className="relative z-10 mb-5">
        <p className="text-sm text-default-500">{card.description}</p>
      </div>

      {/* Buy Now Button */}
      <div className="relative z-10">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full font-semibold",
            card.label === "Popular"
              ? "bg-warning text-warning-foreground hover:bg-warning/90"
              : card.label === "Premium"
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-accent text-accent-foreground hover:bg-accent/90",
          )}
        >
          Buy Now
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

// ─── Occasion Pill ───────────────────────────────────────────

function OccasionPill({ occasion }: { occasion: (typeof occasions)[0] }) {
  const Icon = occasion.icon;
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full bg-background border border-border/60",
        "shadow-clean hover-lift transition-all duration-300 cursor-pointer",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          occasion.bg,
        )}
      >
        <Icon className={cn("w-4 h-4", occasion.color)} />
      </div>
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {occasion.label}
      </span>
    </div>
  );
}

// ─── How It Works Step ───────────────────────────────────────

function HowStep({ step }: { step: (typeof howItWorksSteps)[0] }) {
  const Icon = step.icon;
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <div className="relative">
        <span className="absolute -top-5 -right-5 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
          {step.step}
        </span>
      </div>
      <h4 className="font-semibold text-sm md:text-base">{step.title}</h4>
      <p className="text-default-500 text-xs md:text-sm max-w-[200px] leading-relaxed">
        {step.description}
      </p>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────

export function GiftCardsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section className="py-16 md:py-24 bg-default-50 relative overflow-hidden">
      {/* Subtle decorative blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-56 h-56 bg-warning/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ── Section Header ───────────────────────────────── */}
        <motion.div
          ref={sectionRef}
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-12 md:mb-16"
        >
          <Chip variant="soft" className="mb-4">
            <Gift className="w-4 h-4 mr-1" />
            Perfect Gift
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            Gift Cards
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Give the gift of choice with Kwikseller gift cards
          </p>
        </motion.div>

        {/* ── Gift Cards Grid ──────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16"
        >
          {giftCards.map((card) => (
            <motion.div key={card.amount} variants={itemVariants}>
              <GiftCard card={card} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Popular Occasions ────────────────────────────── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-12 md:mb-16"
        >
          <h3 className="text-lg md:text-xl font-semibold text-center mb-6">
            Popular Occasions
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {occasions.map((occasion) => (
              <OccasionPill key={occasion.label} occasion={occasion} />
            ))}
          </div>
        </motion.div>

        {/* ── How Gift Cards Work ──────────────────────────── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-12 md:mb-16"
        >
          <h3 className="text-lg md:text-xl font-semibold text-center mb-8">
            How Gift Cards Work
          </h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {howItWorksSteps.map((step) => (
              <motion.div key={step.step} variants={itemVariants}>
                <HowStep step={step} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── CTA Button ───────────────────────────────────── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          <Button
            variant="ghost"
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 py-3 rounded-full"
          >
            <Send className="w-5 h-5 mr-2" />
            Send a Gift Card
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
