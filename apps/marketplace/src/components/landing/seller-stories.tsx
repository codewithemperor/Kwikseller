"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Quote,
  MapPin,
  Store,
  TrendingUp,
  ArrowRight,
  Star,
  ExternalLink,
} from "lucide-react";
import { Button, Card, Chip } from "@heroui/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  SELLER_STORIES as stories,
  SELLER_STORY_TABS as tabs,
  type SellerStoryCategory as StoryCategory,
  type SellerStory,
} from "@/constants/landing";

// ─── Star Rating ────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= Math.round(rating)
              ? "text-warning fill-warning"
              : "text-default-200",
          )}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-default-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Story Card ─────────────────────────────────────────────────

function StoryCard({ story, index }: { story: SellerStory; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const storySlug = story.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
    >
      <Card className="relative p-6 h-full bg-background border border-divider rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        {/* Decorative quote icon */}
        <div className="absolute top-4 right-4 text-default-100">
          <Quote className="w-8 h-8" />
        </div>

        {/* Avatar + Vendor Info */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0",
              story.avatarColor,
            )}
          >
            {story.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">{story.name}</h3>
            <div className="flex items-center gap-1 text-xs text-default-400 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{story.location}</span>
            </div>
          </div>
        </div>

        {/* Category badge */}
        <div className="mb-3">
          <Chip size="sm" variant="soft" className="text-xs">
            {story.category}
          </Chip>
        </div>

        {/* Star rating */}
        <div className="mb-4">
          <StarRating rating={story.rating} />
        </div>

        {/* Quote text */}
        <p className="text-sm text-default-500 leading-relaxed mb-5 min-h-[72px]">
          &ldquo;{story.quote}&rdquo;
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-5 text-sm">
          <div className="flex items-center gap-1 text-success">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">{story.revenueGrowth}</span>
          </div>
          <div className="text-default-400">
            <Store className="w-3.5 h-3.5 inline mr-0.5" />
            <span>{story.products} products</span>
          </div>
          <div className="text-default-400 text-xs">Since {story.started}</div>
        </div>

        {/* Visit Store button */}
        <Link
          href={`/vendor/${storySlug}`}
          className="group inline-flex h-9 w-full items-center justify-center gap-2 text-sm font-semibold transition-colors hover:bg-accent/10 hover:text-accent"
        >
          Visit Store
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </Card>
    </motion.div>
  );
}

// ─── Main Export ────────────────────────────────────────────────

export function SellerStories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [activeTab, setActiveTab] = useState<StoryCategory>("All");

  const filteredStories =
    activeTab === "All"
      ? stories
      : stories.filter((s) => s.category === activeTab);

  return (
    <section className="py-20 bg-default-50">
      <div className="container mx-auto px-0 md:px-4 ">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <Chip variant="soft" className="mb-4">
            <TrendingUp className="w-4 h-4 mr-1" />
            Success Stories
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vendors Thriving on KWIKSELLER
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto">
            Real stories from real entrepreneurs who transformed their
            businesses on Africa&apos;s fastest-growing marketplace.
          </p>
        </motion.div>

        {/* Tab / Filter Bar */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-default-100/60">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <motion.button
                  key={tab}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors select-none",
                    isActive
                      ? "text-white"
                      : "bg-default-100 text-default-500 hover:bg-default-200",
                  )}
                  aria-pressed={isActive}
                >
                  {/* Active indicator with animated layout */}
                  {isActive && (
                    <motion.div
                      layoutId="active-story-tab"
                      className="absolute inset-0 rounded-full kwik-gradient"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  <span className="relative z-10">{tab}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Story Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredStories.map((story, index) => (
              <StoryCard key={story.id} story={story} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            className="kwik-gradient text-white font-semibold kwik-shadow-lg hover:opacity-90 transition-opacity"
          >
            Join 10,000+ Successful Vendors
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
