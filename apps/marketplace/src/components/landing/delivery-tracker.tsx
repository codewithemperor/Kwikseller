"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  Truck,
  MapPin,
  Package,
  CheckCircle,
  Clock,
  Phone,
  Navigation,
  Shield,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button, Chip, Card } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Timeline Step Data ─────────────────────────────────────────

interface TimelineStep {
  id: number;
  label: string;
  time: string;
  status: "completed" | "current" | "upcoming";
}

const timelineSteps: TimelineStep[] = [
  { id: 1, label: "Order Confirmed", time: "10:30 AM", status: "completed" },
  { id: 2, label: "Picked Up by Rider", time: "11:15 AM", status: "completed" },
  { id: 3, label: "In Transit", time: "Est. 12:45 PM", status: "current" },
  { id: 4, label: "Out for Delivery", time: "", status: "upcoming" },
  { id: 5, label: "Delivered", time: "", status: "upcoming" },
];

// ─── Feature Data ───────────────────────────────────────────────

const features = [
  {
    id: 1,
    emoji: "🚀",
    title: "Fast Pickup",
    description: "Riders arrive within 30 minutes of order confirmation",
    icon: Zap,
  },
  {
    id: 2,
    emoji: "📍",
    title: "Live GPS Tracking",
    description: "Track your rider in real-time on an interactive map",
    icon: Navigation,
  },
  {
    id: 3,
    emoji: "🛡️",
    title: "Delivery Protection",
    description: "All deliveries are insured up to ₦500,000",
    icon: Shield,
  },
  {
    id: 4,
    emoji: "📞",
    title: "Direct Communication",
    description: "Call or chat with your rider directly",
    icon: Phone,
  },
];

// ─── Timeline Step Component ────────────────────────────────────

function TimelineStepItem({
  step,
  index,
  isInView,
  isLast,
}: {
  step: TimelineStep;
  index: number;
  isInView: boolean;
  isLast: boolean;
}) {
  const isCompleted = step.status === "completed";
  const isCurrent = step.status === "current";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.12, ease: "easeOut" }}
      className="relative flex gap-4"
    >
      {/* Timeline track */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div className="relative flex-shrink-0">
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : { scale: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.3 + index * 0.12,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-400/30"
            >
              <CheckCircle className="w-5 h-5 text-white" />
            </motion.div>
          )}
          {isCurrent && (
            <div className="relative">
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-accent/40"
                animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-accent/30"
                animate={{ scale: [1, 1.4, 1.4], opacity: [0.4, 0, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.4,
                }}
              />
              <div className="relative w-8 h-8 rounded-full kwik-gradient flex items-center justify-center shadow-lg shadow-accent/40">
                <Truck className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
          {step.status === "upcoming" && (
            <div className="w-8 h-8 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white/40" />
            </div>
          )}
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[40px] my-1">
            <div
              className={cn(
                "w-full h-full rounded-full transition-colors",
                isCompleted ? "bg-emerald-400/60" : "bg-white/10",
              )}
            />
            {/* Animated progress fill for current step line */}
            {isCurrent && (
              <motion.div
                className="w-full bg-accent/60 rounded-full"
                style={{ height: "100%" }}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.12 }}
              />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("pb-8", isLast && "pb-0")}>
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              "text-sm font-semibold",
              isCompleted && "text-white",
              isCurrent && "text-white",
              step.status === "upcoming" && "text-white/40",
            )}
          >
            {step.label}
          </span>
          {isCurrent && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
              }
              transition={{ duration: 0.3, delay: 0.5 + index * 0.12 }}
              className="text-[10px] font-medium bg-accent/20 text-accent px-2 py-0.5 rounded-full"
            >
              LIVE
            </motion.span>
          )}
        </div>
        {step.time && (
          <span
            className={cn(
              "text-xs",
              isCompleted && "text-white/60",
              isCurrent && "text-white/70",
              step.status === "upcoming" && "text-white/30",
            )}
          >
            {step.time}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Feature Card Component ─────────────────────────────────────

function FeatureCard({
  feature,
  index,
  isInView,
}: {
  feature: (typeof features)[0];
  index: number;
  isInView: boolean;
}) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
      transition={{ duration: 0.5, delay: 0.4 + index * 0.1, ease: "easeOut" }}
      className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors duration-300 group"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">
            {feature.emoji} {feature.title}
          </h4>
          <p className="text-xs text-white/60 leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function DeliveryTracker() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  // Progress bar percentage based on current step (step 3 of 5 = 60%)
  const [progress, setProgress] = useState(0);
  const targetProgress = 60;

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - fraction, 3);
      setProgress(eased * targetProgress);

      if (fraction < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView]);

  return (
    <section className="py-16 md:py-20 kwik-gradient relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-white/[0.03] rounded-full blur-2xl pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-white/15 text-white border-white/20 backdrop-blur-sm"
          >
            <Truck className="w-4 h-4 mr-1" />
            Delivery Network
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            Real-Time Delivery Tracking
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-sm md:text-base">
            Track every delivery from checkout to doorstep. Stay informed with
            live updates, rider details, and estimated arrival times.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column — Interactive Tracking Demo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden shadow-2xl">
              {/* Order Header */}
              <div className="p-4 md:p-5 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg kwik-gradient flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50 font-medium">
                        Order Number
                      </p>
                      <p className="text-sm font-bold text-white font-mono">
                        #KWS-2024-7854
                      </p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      isInView
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.8 }
                    }
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex items-center gap-1.5 bg-accent/20 text-accent px-2.5 py-1 rounded-full"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs font-semibold">In Transit</span>
                  </motion.div>
                </div>

                {/* Pickup location */}
                <div className="flex items-center gap-1.5 text-white/60">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs">From: Lagos Main Market</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
                      Delivery Progress
                    </span>
                    <motion.span
                      className="text-xs font-bold text-white"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      {Math.round(progress)}%
                    </motion.span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full kwik-gradient rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 md:p-5">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">
                  Tracking Details
                </h3>
                <div className="relative">
                  {timelineSteps.map((step, index) => (
                    <TimelineStepItem
                      key={step.id}
                      step={step}
                      index={index}
                      isInView={isInView}
                      isLast={index === timelineSteps.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Rider Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
                className="p-4 md:p-5 border-t border-white/10"
              >
                <div className="flex items-center gap-3">
                  {/* Rider avatar */}
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                    EO
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">
                      Rider: Emeka O.
                    </p>
                    <p className="text-xs text-white/50">Honda CG 125 - Red</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="text-xs text-amber-400">★</span>
                      <span className="text-xs text-white/70 font-medium">
                        Rating: 4.8
                      </span>
                    </div>
                  </div>

                  {/* Phone button */}
                  <button
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
                    aria-label="Call rider"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </Card>
          </motion.div>

          {/* Right Column — Delivery Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Feature cards */}
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                index={index}
                isInView={isInView}
              />
            ))}

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
              className="mt-2"
            >
              <Button
                size="lg"
                className="w-full bg-white text-accent font-semibold hover:bg-white/90 shadow-lg transition-all duration-200"
              >
                Learn More About Delivery
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
