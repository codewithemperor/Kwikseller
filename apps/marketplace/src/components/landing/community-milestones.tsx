"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Rocket,
  Users,
  Package,
  Coins,
  ShoppingCart,
  Globe,
  Store,
  TrendingUp,
  Milestone,
  ArrowRight,
} from "lucide-react";
import { Chip, Button } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Milestone Data ──────────────────────────────────────────

interface MilestoneItem {
  date: string;
  title: string;
  description: string;
  icon: React.ElementType;
  stat: string;
  isLatest?: boolean;
}

const milestones: MilestoneItem[] = [
  {
    date: "Jan 2023",
    title: "Platform Launch",
    description:
      "KWIKSELLER was founded with a vision to empower African entrepreneurs",
    icon: Rocket,
    stat: "Day 1",
  },
  {
    date: "Jun 2023",
    title: "1,000 Vendors",
    description:
      "Reached our first major milestone with vendors across 5 African countries",
    icon: Users,
    stat: "5 Countries",
  },
  {
    date: "Nov 2023",
    title: "100K Products",
    description:
      "Product catalog crossed the 100,000 mark with diverse categories",
    icon: Package,
    stat: "100K+ Items",
  },
  {
    date: "Mar 2024",
    title: "KwikCoins Launch",
    description: "Introduced our rewards program to incentivize vendor growth",
    icon: Coins,
    stat: "Loyalty Rewards",
  },
  {
    date: "Jul 2024",
    title: "500K Orders",
    description:
      "Half a million orders processed through our escrow-protected system",
    icon: ShoppingCart,
    stat: "₦2B+ GMV",
  },
  {
    date: "Oct 2024",
    title: "15 Countries",
    description:
      "Expanded operations to 15 African countries with local delivery networks",
    icon: Globe,
    stat: "Pan-African",
  },
  {
    date: "Jan 2025",
    title: "10K Vendors",
    description:
      "Community of 10,000+ active vendors building businesses on KWIKSELLER",
    icon: Store,
    stat: "10K+ Stores",
  },
  {
    date: "Apr 2025",
    title: "2M+ Orders",
    description: "Over 2 million orders delivered with 99.9% satisfaction rate",
    icon: TrendingUp,
    stat: "2M+ Delivered",
    isLatest: true,
  },
];

// ─── Animation Variants ──────────────────────────────────────

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

const cardVariantsLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const cardVariantsRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const mobileCardVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ─── Milestone Card Content ──────────────────────────────────

function MilestoneCardContent({
  milestone,
  align,
}: {
  milestone: MilestoneItem;
  align: "left" | "right";
}) {
  const Icon = milestone.icon;

  return (
    <div
      className={cn(
        "p-5 rounded-2xl",
        "bg-white/10 backdrop-blur-sm border border-white/10",
        "hover:bg-white/15 hover:border-white/20 hover:scale-[1.02]",
        "transition-all duration-300",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-4",
          align === "right" && "flex-row-reverse",
        )}
      >
        <div className="w-12 h-12 rounded-full kwik-gradient flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">
            {milestone.date}
          </p>
          <h4 className="font-semibold text-white text-lg leading-tight mb-1">
            {milestone.title}
          </h4>
          <p className="text-sm text-white/70 leading-relaxed mb-2">
            {milestone.description}
          </p>
          <span className="inline-block text-xs bg-white/10 text-white/80 rounded-full px-3 py-1 font-medium">
            {milestone.stat}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Node ───────────────────────────────────────────

function TimelineNode({ isLatest }: { isLatest: boolean }) {
  return (
    <div className="relative z-10 flex items-center justify-center w-8 flex-shrink-0">
      <div
        className={cn(
          "w-4 h-4 rounded-full kwik-gradient",
          isLatest && "animate-pulse-glow",
        )}
      />
      {isLatest && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full kwik-gradient animate-ping opacity-30" />
        </div>
      )}
    </div>
  );
}

// ─── Desktop Milestone Row ───────────────────────────────────

function DesktopMilestone({
  milestone,
  index,
  isInView,
}: {
  milestone: MilestoneItem;
  index: number;
  isInView: boolean;
}) {
  const isOdd = index % 2 === 0;

  return (
    <div className="hidden md:flex md:w-full md:items-center">
      {isOdd ? (
        <>
          {/* Left: Card */}
          <motion.div
            variants={cardVariantsLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="w-[calc(50%-2rem)] pr-8 text-right"
          >
            <MilestoneCardContent milestone={milestone} align="right" />
          </motion.div>
          {/* Center: Node */}
          <TimelineNode isLatest={!!milestone.isLatest} />
          {/* Right: Spacer */}
          <div className="w-[calc(50%-2rem)]" />
        </>
      ) : (
        <>
          {/* Left: Spacer */}
          <div className="w-[calc(50%-2rem)]" />
          {/* Center: Node */}
          <TimelineNode isLatest={!!milestone.isLatest} />
          {/* Right: Card */}
          <motion.div
            variants={cardVariantsRight}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="w-[calc(50%-2rem)] pl-8"
          >
            <MilestoneCardContent milestone={milestone} align="left" />
          </motion.div>
        </>
      )}
    </div>
  );
}

// ─── Mobile Milestone Row ────────────────────────────────────

function MobileMilestone({
  milestone,
  isInView,
}: {
  milestone: MilestoneItem;
  isInView: boolean;
}) {
  const Icon = milestone.icon;
  const isLatest = !!milestone.isLatest;

  return (
    <div className="md:hidden flex items-start gap-4 pl-10">
      {/* Node circle */}
      <div className="absolute left-[18px] top-1 z-10">
        <div
          className={cn(
            "w-4 h-4 rounded-full kwik-gradient",
            isLatest && "animate-pulse-glow",
          )}
        />
        {isLatest && (
          <div className="absolute inset-0 w-4 h-4 rounded-full kwik-gradient animate-ping opacity-30" />
        )}
      </div>

      {/* Card */}
      <motion.div
        variants={mobileCardVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="flex-1"
      >
        <div
          className={cn(
            "p-4 rounded-2xl",
            "bg-white/10 backdrop-blur-sm border border-white/10",
            "hover:bg-white/15 hover:border-white/20 hover:scale-[1.02]",
            "transition-all duration-300",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full kwik-gradient flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">
                {milestone.date}
              </p>
              <h4 className="font-semibold text-white text-lg leading-tight mb-1">
                {milestone.title}
              </h4>
              <p className="text-sm text-white/70 leading-relaxed mb-2">
                {milestone.description}
              </p>
              <span className="inline-block text-xs bg-white/10 text-white/80 rounded-full px-3 py-1 font-medium">
                {milestone.stat}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Single Milestone Card (combines mobile + desktop) ───────

function MilestoneCard({
  milestone,
  index,
}: {
  milestone: MilestoneItem;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="relative flex items-start md:items-center md:min-h-[120px]"
    >
      <MobileMilestone milestone={milestone} isInView={isInView} />
      <DesktopMilestone
        milestone={milestone}
        index={index}
        isInView={isInView}
      />
    </div>
  );
}

// ─── Animated Timeline Line ──────────────────────────────────

function TimelineLine({ className }: { className?: string }) {
  const lineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(lineRef, { once: true, margin: "-100px" });

  return (
    <div ref={lineRef} className={className}>
      <div className="relative w-full h-full">
        {/* Static background line */}
        <div className="absolute inset-0 bg-white/10" />
        {/* Animated foreground line */}
        <motion.div
          initial={{ height: 0 }}
          animate={isInView ? { height: "100%" } : { height: 0 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute top-0 left-0 w-full bg-white/20"
        />
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────

export function CommunityMilestones() {
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <section className="py-20 kwik-gradient relative overflow-hidden">
      {/* Pattern grid overlay */}
      <div className="pattern-grid opacity-10 absolute inset-0 pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-white/10 text-white border border-white/20"
          >
            <Milestone className="w-4 h-4 mr-1" />
            Our Journey
          </Chip>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white text-shadow-sm">
            Growing Together With Africa
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            From a bold idea to a Pan-African marketplace — every milestone
            represents trust built with our vendors, buyers, and communities
            across the continent.
          </p>
        </motion.div>

        {/* ─── Timeline ─── */}
        <motion.div
          ref={timelineRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative max-w-4xl mx-auto"
        >
          {/* Desktop center line */}
          <TimelineLine className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 hidden md:block" />

          {/* Mobile left line */}
          <TimelineLine className="absolute top-0 bottom-0 left-[20px] w-0.5 md:hidden" />

          {/* Milestone items */}
          <div className="relative space-y-10 md:space-y-12">
            {milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.date}
                milestone={milestone}
                index={index}
              />
            ))}
          </div>
        </motion.div>

        {/* ─── Bottom CTA ─── */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mt-16 md:mt-20"
        >
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
            Be part of the next chapter
          </h3>
          <p className="text-white/70 text-sm md:text-base max-w-md mx-auto mb-8">
            Join thousands of vendors and millions of buyers shaping the future
            of African e-commerce.
          </p>
          <Button
            size="lg"
            className="bg-white text-accent font-semibold hover:bg-white/90 transition-colors shadow-lg"
          >
            Join Our Journey
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
