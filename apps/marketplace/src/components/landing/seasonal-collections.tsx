"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Flame,
  Sun,
  Sparkles,
  Smartphone,
  Home,
  ArrowRight,
  Hash,
} from "lucide-react";
import { Chip, Button } from "@heroui/react";
import { cn } from "@kwikseller/ui";

const collections = [
  {
    id: "summer",
    name: "Summer Essentials",
    count: "120+",
    icon: Sun,
    color: "bg-warning/90",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
    tag: "#SummerVibes",
  },
  {
    id: "afro-fashion",
    name: "Afrocentric Fashion",
    count: "85+",
    icon: Sparkles,
    color: "bg-accent",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    tag: "#AfroFashion",
  },
  {
    id: "tech-gadgets",
    name: "Tech & Gadgets",
    count: "200+",
    icon: Smartphone,
    color: "bg-sky-600",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
    tag: "#TechDeals",
  },
  {
    id: "home-living",
    name: "Home & Living",
    count: "95+",
    icon: Home,
    color: "bg-success",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop",
    tag: "#HomeDecor",
  },
];

const quickTags = [
  "#SummerVibes",
  "#AfroFashion",
  "#TechDeals",
  "#HomeDecor",
  "#GiftIdeas",
  "#PoolSelling",
  "#AnkaraStyles",
  "#SmartHome",
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
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

export function SeasonalCollections() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section className="py-10 sm:py-16" ref={sectionRef}>
      <div className="container mx-auto px-0 md:px-4 ">
        {/* ─── Section Header ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.45, ease: "easeOut" as const }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Chip variant="soft" color="danger" size="sm">
              <Flame className="w-3.5 h-3.5 mr-1" />
              Trending
            </Chip>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Curated Collections
          </h2>
          <p className="text-sm text-default-500 max-w-lg mx-auto">
            Handpicked collections for every occasion and style
          </p>
        </motion.div>

        {/* ─── Collection Cards Grid ────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {collections.map((collection) => {
            const Icon = collection.icon;
            return (
              <motion.div
                key={collection.id}
                variants={itemVariants}
                className={cn(
                  "group relative rounded-2xl overflow-hidden shadow-clean",
                  "hover:shadow-clean-lg transition-all duration-300 cursor-pointer",
                )}
              >
                {/* Image Container */}
                <div className="relative h-48 sm:h-56 img-zoom">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

                  {/* Collection Info */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                    {/* Top: Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          "bg-white/90 group-hover:scale-110 transition-transform duration-200",
                        )}
                      >
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-bold text-default-700">
                        {collection.count} items
                      </span>
                    </div>

                    {/* Bottom: Name + CTA */}
                    <div>
                      <h3 className="text-white text-lg sm:text-xl font-bold mb-2">
                        {collection.name}
                      </h3>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <span className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-semibold text-default-700 flex items-center gap-1.5">
                          Explore
                          <ArrowRight className="w-3 h-3" />
                        </span>
                        <span className="text-white/70 text-xs">
                          {collection.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Quick Tags Row ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.45, delay: 0.5, ease: "easeOut" as const }}
          className="mt-8 sm:mt-10"
        >
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Hash className="w-4 h-4 text-default-300" />
            {quickTags.map((tag) => (
              <button
                key={tag}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium",
                  "bg-default-100 dark:bg-default-100/50 text-default-500",
                  "hover:bg-accent/10 hover:text-accent",
                  "transition-all duration-200 press-scale",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
