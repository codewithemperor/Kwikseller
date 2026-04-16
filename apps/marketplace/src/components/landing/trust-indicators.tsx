"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Truck,
  Headphones,
  RotateCcw,
  Lock,
  CreditCard,
  Smartphone,
  Building,
} from "lucide-react";
import { Card, Chip } from "@heroui/react";

// Trust features data
const trustFeatures = [
  {
    icon: Shield,
    title: "Escrow Protection",
    description: "Your money is held safely until you confirm delivery",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Reliable delivery across 15+ African countries",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support team ready to help anytime",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Hassle-free returns within 7 days of delivery",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

// Payment / security badges
const paymentBadges = [
  { icon: CreditCard, label: "Visa" },
  { icon: CreditCard, label: "Mastercard" },
  { icon: Lock, label: "Paystack" },
  { icon: Smartphone, label: "MoMo" },
  { icon: Smartphone, label: "Flutterwave" },
  { icon: Building, label: "Bank Transfer" },
];

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
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

export function TrustIndicators() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section className="py-16 md:py-20 bg-default-50 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-success/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Chip variant="soft" className="mb-4">
            <Shield className="w-4 h-4 mr-1" />
            Trusted & Secure
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Why Choose <span className="kwik-gradient-text">KWIKSELLER</span>?
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base">
            We&apos;re committed to making your shopping experience safe, fast,
            and enjoyable across Africa.
          </p>
        </motion.div>

        {/* Trust Features Grid — Top Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10"
        >
          {trustFeatures.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="p-5 md:p-6 h-full border border-border/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-background">
                <div className="flex flex-col items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  {/* Text */}
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-default-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Gradient Line Separator */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={
            isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }
          }
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-10"
        >
          <div className="h-px w-full max-w-xl mx-auto bg-accent/40" />
        </motion.div>

        {/* Payment / Security Badges — Bottom Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-default-400" />
              <span className="text-sm font-medium text-default-500">
                Secure Payment Methods
              </span>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {paymentBadges.map((badge) => (
              <motion.div key={badge.label} variants={itemVariants}>
                <Chip
                  variant="soft"
                  className="px-3 py-2 bg-default-100 text-default-600 border border-border/60 hover:bg-accent-soft hover:text-accent-soft-foreground transition-colors cursor-default"
                >
                  <badge.icon className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs md:text-sm font-medium">
                    {badge.label}
                  </span>
                </Chip>
              </motion.div>
            ))}
          </motion.div>

          {/* Extra trust text */}
          <p className="text-center text-xs text-default-400 mt-5">
            All transactions are encrypted with 256-bit SSL security
          </p>
        </motion.div>
      </div>
    </section>
  );
}
