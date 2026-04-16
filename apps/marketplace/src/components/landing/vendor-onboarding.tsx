"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Store,
  Package,
  ShoppingCart,
  Wallet,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@heroui/react";

// ─── Step Data ─────────────────────────────────────────────────

interface OnboardingStep {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  decorElements: {
    shape: string;
    position: string;
    size: string;
    color: string;
  }[];
}

const steps: OnboardingStep[] = [
  {
    number: 1,
    title: "Create Your Store",
    description:
      "Sign up in under 2 minutes. Choose from beautiful store templates, add your brand logo, customize colors, and go live instantly. No coding required.",
    icon: Store,
    decorElements: [
      {
        shape: "circle",
        position: "-top-4 -right-4",
        size: "w-20 h-20",
        color: "bg-blue-400/20",
      },
      {
        shape: "circle",
        position: "-bottom-3 -left-3",
        size: "w-14 h-14",
        color: "bg-cyan-400/20",
      },
      {
        shape: "rounded-xl",
        position: "top-1/2 right-6",
        size: "w-10 h-10 rotate-12",
        color: "bg-blue-500/10",
      },
      {
        shape: "circle",
        position: "top-8 left-4",
        size: "w-6 h-6",
        color: "bg-cyan-300/30",
      },
    ],
  },
  {
    number: 2,
    title: "Add Your Products",
    description:
      "Upload product photos, set prices in Naira or any African currency, write descriptions, and organize into categories. Bulk upload supported for large catalogs.",
    icon: Package,
    decorElements: [
      {
        shape: "circle",
        position: "-top-4 -left-4",
        size: "w-20 h-20",
        color: "bg-amber-400/20",
      },
      {
        shape: "circle",
        position: "-bottom-3 -right-3",
        size: "w-14 h-14",
        color: "bg-orange-400/20",
      },
      {
        shape: "rounded-xl",
        position: "top-1/2 left-6",
        size: "w-10 h-10 -rotate-12",
        color: "bg-amber-500/10",
      },
      {
        shape: "circle",
        position: "top-8 right-4",
        size: "w-6 h-6",
        color: "bg-orange-300/30",
      },
    ],
  },
  {
    number: 3,
    title: "Start Selling",
    description:
      "List on the marketplace, share on social media, and reach millions of buyers across Africa. Our SEO tools help customers find your products organically.",
    icon: ShoppingCart,
    decorElements: [
      {
        shape: "circle",
        position: "-top-4 -right-4",
        size: "w-20 h-20",
        color: "bg-emerald-400/20",
      },
      {
        shape: "circle",
        position: "-bottom-3 -left-3",
        size: "w-14 h-14",
        color: "bg-green-400/20",
      },
      {
        shape: "rounded-xl",
        position: "top-1/2 right-6",
        size: "w-10 h-10 rotate-12",
        color: "bg-emerald-500/10",
      },
      {
        shape: "circle",
        position: "top-8 left-4",
        size: "w-6 h-6",
        color: "bg-green-300/30",
      },
    ],
  },
  {
    number: 4,
    title: "Get Paid Securely",
    description:
      "Receive payments directly to your bank account via Paystack or Flutterwave. Escrow protection ensures you get paid for every successful delivery.",
    icon: Wallet,
    decorElements: [
      {
        shape: "circle",
        position: "-top-4 -left-4",
        size: "w-20 h-20",
        color: "bg-rose-400/20",
      },
      {
        shape: "circle",
        position: "-bottom-3 -right-3",
        size: "w-14 h-14",
        color: "bg-pink-400/20",
      },
      {
        shape: "rounded-xl",
        position: "top-1/2 left-6",
        size: "w-10 h-10 -rotate-12",
        color: "bg-rose-500/10",
      },
      {
        shape: "circle",
        position: "top-8 right-4",
        size: "w-6 h-6",
        color: "bg-pink-300/30",
      },
    ],
  },
];

// ─── Decorative Image Placeholder ──────────────────────────────

function StepImagePlaceholder({
  step,
  isInView,
}: {
  step: OnboardingStep;
  isInView: boolean;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: step.number % 2 === 1 ? -30 : 30 }}
      animate={
        isInView
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: step.number % 2 === 1 ? -30 : 30 }
      }
      transition={{
        duration: 0.7,
        delay: 0.15,
        ease: "easeOut",
      }}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-accent opacity-90" />

      {/* Parallax floating layer */}
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

      {/* Decorative floating elements */}
      {step.decorElements.map((deco, i) => (
        <motion.div
          key={i}
          animate={
            isInView
              ? { y: [0, -6, 0], rotate: [0, 5, 0] }
              : { y: 0, rotate: 0 }
          }
          transition={{
            duration: 4 + i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: step.number * 0.2 + i * 0.4,
          }}
          className={`absolute ${deco.position} ${deco.size} ${deco.shape} ${deco.color} pointer-events-none`}
        />
      ))}

      {/* Bottom overlay for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/10" />
    </motion.div>
  );
}

// ─── Single Step ───────────────────────────────────────────────

function OnboardingStepCard({
  step,
  index,
}: {
  step: OnboardingStep;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = step.icon;
  const isOdd = step.number % 2 === 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: "easeOut" }}
      className={`py-12 md:py-16 ${index % 2 === 0 ? "bg-default" : "bg-default-50"}`}
    >
      <div className="container mx-auto px-0 md:px-4 ">
        <div
          className={`flex flex-col ${
            isOdd ? "md:flex-row" : "md:flex-row-reverse"
          } items-center gap-8 md:gap-12 lg:gap-16`}
        >
          {/* Image Placeholder */}
          <div className="w-full md:w-1/2 max-w-lg">
            <StepImagePlaceholder step={step} isInView={isInView} />
          </div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: isOdd ? 30 : -30 }}
            animate={
              isInView
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: isOdd ? 30 : -30 }
            }
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            className="w-full md:w-1/2"
          >
            {/* Step number badge + icon */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className={`w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg shadow-md`}
              >
                {step.number}
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-md`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-default-500 text-base md:text-lg leading-relaxed max-w-md">
              {step.description}
            </p>

            {/* Subtle step indicator */}
            <div className="flex items-center gap-2 mt-6">
              {steps.map((s) => (
                <div
                  key={s.number}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    s.number <= step.number
                      ? "bg-accent w-8"
                      : "bg-default-200 w-4"
                  }`}
                />
              ))}
              <span className="text-xs text-default-400 ml-2">
                Step {step.number} of {steps.length}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ───────────────────────────────────────────────

export function VendorOnboarding() {
  const headerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <section className="relative overflow-hidden">
      {/* Section Header */}
      <div className="bg-default-50 py-16 md:py-20">
        <div className="container mx-auto px-0 md:px-4 ">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 30 }}
            animate={
              isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 mb-5">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">For Vendors</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Start Selling in{" "}
              <span className="kwik-gradient-text">4 Simple Steps</span>
            </h2>
            <p className="text-default-500 text-base md:text-lg">
              Join 10,000+ vendors already growing on KWIKSELLER
            </p>
          </motion.div>
        </div>
      </div>

      {/* Steps */}
      <div>
        {steps.map((step, index) => (
          <OnboardingStepCard key={step.number} step={step} index={index} />
        ))}
      </div>

      {/* CTA */}
      <div className="bg-default-50 py-16 md:py-20">
        <div className="container mx-auto px-0 md:px-4 ">
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 30 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to start selling?
            </h3>
            <p className="text-default-500 mb-8 max-w-md mx-auto">
              Create your free store today and reach millions of buyers across
              Africa.
            </p>
            <Button
              size="lg"
              className="kwik-gradient text-white font-semibold kwik-shadow-lg hover:opacity-90 transition-opacity"
            >
              Create Your Free Store
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
