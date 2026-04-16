"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, ShoppingCart, ShieldCheck, Truck } from "lucide-react";
import { Card, Chip } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Step Data ───────────────────────────────────────────────

interface StepItem {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
}

const steps: StepItem[] = [
  {
    number: 1,
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse thousands of products from verified sellers across Africa. Filter by category, price, and location.",
  },
  {
    number: 2,
    icon: ShoppingCart,
    title: "Add to Cart",
    description:
      "Select your items, compare prices, and add them to your cart. Save favorites for later.",
  },
  {
    number: 3,
    icon: ShieldCheck,
    title: "Secure Payment",
    description:
      "Pay safely with Paystack, MoMo, bank transfer, or card. All payments are escrow-protected.",
  },
  {
    number: 4,
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Track your order in real time and receive fast, reliable delivery right to your doorstep.",
  },
];

// ─── Animation Helpers ───────────────────────────────────────

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ─── Single Step Card ────────────────────────────────────────

function StepCard({ step }: { step: StepItem }) {
  const Icon = step.icon;

  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-sm">
          <Icon className="w-7 h-7 text-accent" />
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-md">
          <span className="text-xs font-bold text-white">{step.number}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="font-semibold text-base md:text-lg">{step.title}</h3>
        <p className="text-default-500 text-sm leading-relaxed max-w-[240px] mx-auto">
          {step.description}
        </p>
      </div>
    </div>
  );
}

// ─── Mobile Vertical Connector ───────────────────────────────

function MobileConnector() {
  return (
    <div className="lg:hidden flex justify-center py-1">
      <div className="w-px h-8 bg-accent/30 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
          <div className="w-0 h-0 border-t-[5px] border-t-accent/40 border-x-[3px] border-x-transparent" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section className="py-16 md:py-20 bg-default-50 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-64 h-64 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        <AnimatedSection>
          <div className="text-center mb-12 md:mb-16">
            <Chip variant="soft" className="mb-4">
              <Truck className="w-4 h-4 mr-1" />
              Simple &amp; Fast
            </Chip>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              How It Works
            </h2>
            <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base">
              Get started in minutes. Shop from thousands of verified sellers
              with secure payments and fast delivery across Africa.
            </p>
          </div>
        </AnimatedSection>

        {/* Desktop: Horizontal 4-step flow */}
        <motion.div
          ref={sectionRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="hidden lg:grid lg:grid-cols-7 lg:items-start lg:gap-0"
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <motion.div variants={stepVariants} className="lg:col-span-2">
                <Card className="p-6 h-full border border-border/60 bg-background hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <StepCard step={step} />
                </Card>
              </motion.div>
              {index < steps.length - 1 && (
                <motion.div
                  variants={stepVariants}
                  className="lg:col-span-1 flex items-center justify-center pt-12"
                >
                  <div className="w-full flex items-center relative">
                    <div className="w-full h-px bg-accent/30" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                      <div className="w-0 h-0 border-l-[5px] border-l-accent/40 border-y-[3px] border-y-transparent" />
                    </div>
                  </div>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Mobile/Tablet: Vertical step flow */}
        <div className="lg:hidden space-y-0">
          {steps.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.1}>
              <div>
                <Card className="p-5 border border-border/60 bg-background hover:shadow-lg transition-shadow duration-300">
                  <StepCard step={step} />
                </Card>
                {index < steps.length - 1 && <MobileConnector />}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
