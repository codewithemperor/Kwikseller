"use client";

import React, { useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import {
  Play,
  Star,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { Chip, Card } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Types ───────────────────────────────────────────────────

interface VideoTestimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  initials: string;
  color: string;
  duration: string;
  category: string;
}

// ─── Data ───────────────────────────────────────────────────

const testimonials: VideoTestimonial[] = [
  {
    id: "1",
    name: "Adaeze Okonkwo",
    role: "Fashion Designer, Lagos",
    rating: 5,
    quote:
      "KWIKSELLER transformed my small Ankara business into a brand serving customers across West Africa. The pool selling feature is genius!",
    initials: "AO",
    color: "bg-pink-500",
    duration: "2:34",
    category: "Fashion",
  },
  {
    id: "2",
    name: "Emmanuel Mensah",
    role: "Electronics Dealer, Accra",
    rating: 5,
    quote:
      "The delivery network is incredible. My customers in Kumasi get their orders same-day. Revenue tripled in 6 months.",
    initials: "EM",
    color: "bg-blue-500",
    duration: "1:58",
    category: "Electronics",
  },
  {
    id: "3",
    name: "Fatima Abubakar",
    role: "Beauty Entrepreneur, Kano",
    rating: 4,
    quote:
      "KwikCoins rewards keep me motivated. I've earned enough coins for free ads that brought in 200 new customers.",
    initials: "FA",
    color: "bg-purple-500",
    duration: "3:12",
    category: "Beauty",
  },
  {
    id: "4",
    name: "David Mwangi",
    role: "Phone Accessories, Nairobi",
    rating: 5,
    quote:
      "Starting with zero inventory was a game-changer. Pool selling let me test products risk-free before stocking them.",
    initials: "DM",
    color: "bg-green-500",
    duration: "2:07",
    category: "Phones",
  },
  {
    id: "5",
    name: "Aisha Diallo",
    role: "Food Vendor, Dakar",
    rating: 5,
    quote:
      "The escrow protection gives my customers confidence. My return rate dropped to near zero since joining KWIKSELLER.",
    initials: "AD",
    color: "bg-orange-500",
    duration: "1:45",
    category: "Food & Drinks",
  },
  {
    id: "6",
    name: "Chidi Nwosu",
    role: "Home Decor, Enugu",
    rating: 4,
    quote:
      "Analytics dashboard shows me exactly what's trending. I adjust my inventory weekly and profits keep growing.",
    initials: "CN",
    color: "bg-teal-500",
    duration: "2:51",
    category: "Home & Garden",
  },
];

// ─── Animation Variants ─────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ─── Play Button ────────────────────────────────────────────

function PlayButton() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse ring */}
      <motion.div
        className="absolute w-16 h-16 rounded-full bg-white/20"
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-16 h-16 rounded-full bg-white/15"
        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      {/* White circle with triangle */}
      <div className="relative w-14 h-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center backdrop-blur-sm">
        <Play className="w-6 h-6 text-default-900 ml-0.5" fill="currentColor" />
      </div>
    </div>
  );
}

// ─── Star Rating ────────────────────────────────────────────

function StarRating({
  rating,
  isInView,
}: {
  rating: number;
  isInView: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.div
          key={star}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }
          }
          transition={{
            duration: 0.3,
            delay: star * 0.08,
            ease: "backOut",
          }}
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              star <= rating ? "text-warning fill-warning" : "text-default-200",
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Video Testimonial Card ─────────────────────────────────

function VideoCard({
  testimonial,
  index,
  isInView,
}: {
  testimonial: VideoTestimonial;
  index: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: index * 0.08 }}
      className="shrink-0 w-[300px] sm:w-[340px] md:w-auto snap-center md:snap-none"
    >
      <Card className="max-w-[380px] w-full border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-background">
        {/* ── Video Thumbnail Area ── */}
        <div className="relative aspect-video overflow-hidden group cursor-pointer">
          {/* Solid color background */}
          <div className={cn("absolute inset-0", testimonial.color)} />

          {/* Large initials watermark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[120px] sm:text-[140px] font-black text-white/10 select-none leading-none tracking-tighter">
              {testimonial.initials}
            </span>
          </div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <PlayButton />
          </div>

          {/* Category badge — top-left */}
          <div className="absolute top-3 left-3 z-20">
            <Chip
              size="sm"
              variant="soft"
              className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-medium"
            >
              {testimonial.category}
            </Chip>
          </div>

          {/* Duration badge — bottom-right */}
          <div className="absolute bottom-3 right-3 z-20">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
              {testimonial.duration}
            </span>
          </div>

          {/* Hover scale effect on thumbnail */}
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
        </div>

        {/* ── Content Area ── */}
        <div className="p-4 space-y-3">
          {/* Name + Role */}
          <div>
            <h3 className="font-semibold text-sm leading-tight">
              {testimonial.name}
            </h3>
            <p className="text-xs text-default-400 mt-0.5">
              {testimonial.role}
            </p>
          </div>

          {/* Star rating */}
          <StarRating rating={testimonial.rating} isInView={isInView} />

          {/* Quote */}
          <p className="text-sm text-default-500 leading-relaxed italic line-clamp-3">
            &ldquo;{testimonial.quote}&rdquo;
          </p>

          {/* Bottom row: Verified badge + View Story link */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-success">
              <BadgeCheck className="w-4 h-4" />
              <span className="text-xs font-medium">Verified Seller</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors group/link"
            >
              View Story
              <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Export ────────────────────────────────────────────

export function VideoTestimonials() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isHeaderInView = useInView(headerRef, { once: true, margin: "-80px" });
  const isGridInView = useInView(gridRef, { once: true, margin: "-40px" });

  const scroll = useCallback((direction: "left" | "right") => {
    if (!gridRef.current) return;
    const scrollAmount = 340;
    gridRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="py-20 bg-default-50 relative overflow-hidden">
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 pattern-dots opacity-40 pointer-events-none" />

      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-48 h-48 bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-56 h-56 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <Chip variant="soft" className="mb-4">
            <Play className="w-4 h-4 mr-1" />
            Success Stories
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Hear From Our <span className="kwik-gradient-text">Community</span>
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Watch real stories from African entrepreneurs who are building
            thriving businesses on KWIKSELLER. Their success is our success.
          </p>
        </motion.div>

        {/* ─── Desktop scroll arrows ─── */}
        <div className="hidden md:flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full bg-background border border-divider flex items-center justify-center hover:bg-default-100 transition-colors shadow-sm"
            aria-label="Scroll testimonials left"
          >
            <ChevronLeft className="w-5 h-5 text-default-500" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full bg-background border border-divider flex items-center justify-center hover:bg-default-100 transition-colors shadow-sm"
            aria-label="Scroll testimonials right"
          >
            <ChevronRight className="w-5 h-5 text-default-500" />
          </button>
        </div>

        {/* ─── Testimonials Grid / Scroll ─── */}
        <div
          ref={gridRef}
          className="flex md:grid md:grid-cols-3 gap-5 overflow-x-auto scrollbar-hide md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 scroll-smooth"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isGridInView ? "visible" : "hidden"}
            className="contents"
          >
            {testimonials.map((testimonial, index) => (
              <VideoCard
                key={testimonial.id}
                testimonial={testimonial}
                index={index}
                isInView={isGridInView}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
