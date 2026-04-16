"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button, Card, Chip } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Data ───────────────────────────────────────────────────────

interface ReviewData {
  id: string;
  name: string;
  initials: string;
  location: string;
  date: string;
  rating: number;
  text: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  product: string;
}

interface RatingRow {
  stars: number;
  percentage: number;
}

const overallRating = 4.8;
const totalReviews = "2,500+";

const ratingBreakdown: RatingRow[] = [
  { stars: 5, percentage: 68 },
  { stars: 4, percentage: 22 },
  { stars: 3, percentage: 7 },
  { stars: 2, percentage: 2 },
  { stars: 1, percentage: 1 },
];

const reviews: ReviewData[] = [
  {
    id: "1",
    name: "Sarah K.",
    initials: "SK",
    location: "Lagos",
    date: "2 weeks ago",
    rating: 5,
    text: "The best marketplace I've used in Africa! Fast delivery and genuine products.",
    verified: true,
    helpful: 47,
    unhelpful: 2,
    product: "Ankara Print Dress",
  },
  {
    id: "2",
    name: "Emmanuel T.",
    initials: "ET",
    location: "Accra",
    date: "2 weeks ago",
    rating: 5,
    text: "As a seller, Kwikseller has transformed my business. Sales tripled in 3 months!",
    verified: false,
    helpful: 35,
    unhelpful: 1,
    product: "Electronics Store",
  },
  {
    id: "3",
    name: "Fatima D.",
    initials: "FD",
    location: "Nairobi",
    date: "2 weeks ago",
    rating: 4,
    text: "Great escrow system gives me confidence when buying from new sellers.",
    verified: false,
    helpful: 28,
    unhelpful: 3,
    product: "Wireless Headphones",
  },
];

// ─── Star Rating Display ────────────────────────────────────────

function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            star <= rating
              ? "fill-warning text-warning"
              : "fill-default-200 text-default-200",
          )}
        />
      ))}
    </div>
  );
}

// ─── Animated Progress Bar ──────────────────────────────────────

function AnimatedBar({
  percentage,
  delay,
}: {
  percentage: number;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setWidth(percentage), delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, percentage, delay]);

  return (
    <div
      ref={ref}
      className="h-2.5 rounded-full bg-default-100 overflow-hidden w-full"
    >
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, ease: "easeOut" as const }}
      />
    </div>
  );
}

// ─── Helpful Button ─────────────────────────────────────────────

function HelpfulButton({
  icon: Icon,
  count,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
        isActive
          ? "bg-accent/10 text-accent"
          : "bg-default-100 text-default-400 hover:bg-default-200 hover:text-default-600",
      )}
      aria-label={`${isActive ? "Remove" : "Add"} reaction`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{count}</span>
    </button>
  );
}

// ─── Review Card ────────────────────────────────────────────────

function ReviewCard({ review, index }: { review: ReviewData; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [helpfulState, setHelpfulState] = useState<"up" | "down" | null>(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpful);

  const handleHelpful = () => {
    if (helpfulState === "up") {
      setHelpfulState(null);
      setHelpfulCount((c) => c - 1);
    } else {
      if (helpfulState === "down") setUnhelpfulCount((c) => c - 1);
      setHelpfulState("up");
      setHelpfulCount((c) => c + 1);
    }
  };

  const handleUnhelpful = () => {
    if (helpfulState === "down") {
      setHelpfulState(null);
      setUnhelpfulCount((c) => c - 1);
    } else {
      if (helpfulState === "up") setHelpfulCount((c) => c - 1);
      setHelpfulState("down");
      setUnhelpfulCount((c) => c + 1);
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
    >
      <Card className="p-5 md:p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-accent/15">
        {/* Header: Avatar + Name + Date */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {review.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{review.name}</h4>
                {review.verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Purchase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-default-400 mt-0.5">
                <span>{review.location}</span>
                <span className="w-1 h-1 rounded-full bg-default-300" />
                <span className="flex items-center gap-0.5">
                  <Calendar className="w-3 h-3" />
                  {review.date}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stars */}
        <div className="mb-3">
          <StarRating rating={review.rating} size="sm" />
        </div>

        {/* Review Text */}
        <p className="text-sm text-default-600 dark:text-default-400 leading-relaxed mb-4">
          &ldquo;{review.text}&rdquo;
        </p>

        {/* Product Tag */}
        <div className="mb-4">
          <Chip size="sm" variant="soft" className="text-xs">
            Bought: {review.product}
          </Chip>
        </div>

        {/* Helpful Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-divider">
          <span className="text-[11px] text-default-400 mr-1">Helpful?</span>
          <HelpfulButton
            icon={ThumbsUp}
            count={helpfulCount}
            isActive={helpfulState === "up"}
            onClick={handleHelpful}
          />
          <HelpfulButton
            icon={ThumbsDown}
            count={unhelpfulCount}
            isActive={helpfulState === "down"}
            onClick={handleUnhelpful}
          />
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Export ────────────────────────────────────────────────

export function TestimonialsEnhanced() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const ratingRef = useRef<HTMLDivElement>(null);
  const isRatingInView = useInView(ratingRef, { once: true, margin: "-40px" });

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Pattern-dots background at low opacity */}
      <div className="absolute inset-0 pattern-dots opacity-[0.04] pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Chip variant="soft" className="mb-4">
            <MessageSquare className="w-4 h-4 mr-1" />
            Reviews
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by Thousands
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto">
            Hear what our community has to say about their experience on
            Africa&apos;s most trusted marketplace.
          </p>
        </motion.div>

        {/* Rating Summary + Breakdown */}
        <motion.div
          ref={ratingRef}
          initial={{ opacity: 0, y: 24 }}
          animate={
            isRatingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
          }
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mb-14"
        >
          <Card className="p-6 md:p-8 border border-transparent hover:border-accent/15 transition-colors">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Overall Rating */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-5xl font-bold text-foreground mb-2">
                  {overallRating}
                </div>
                <div className="text-sm text-default-400 mb-3">out of 5</div>
                <StarRating rating={5} />
                <p className="text-sm text-default-400 mt-2">
                  Based on {totalReviews} reviews
                </p>
              </div>

              {/* Right: Rating Breakdown Bars */}
              <div className="flex flex-col gap-2.5 justify-center">
                {ratingBreakdown.map((row, i) => (
                  <div key={row.stars} className="flex items-center gap-3">
                    <span className="text-xs text-default-500 font-medium w-12 text-right shrink-0">
                      {row.stars} star
                    </span>
                    <AnimatedBar percentage={row.percentage} delay={i * 0.08} />
                    <span className="text-xs font-semibold text-default-600 w-10 shrink-0">
                      {row.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Featured Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
