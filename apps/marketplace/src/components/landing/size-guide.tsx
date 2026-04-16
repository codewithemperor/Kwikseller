"use client";

import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Ruler,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Shirt,
  Footprints,
  Watch,
} from "lucide-react";
import { Chip, Button } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Data ────────────────────────────────────────────────────

type CategoryKey = "clothing" | "shoes" | "accessories";

const categories: {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "clothing", label: "Clothing", icon: Shirt },
  { key: "shoes", label: "Shoes", icon: Footprints },
  { key: "accessories", label: "Accessories", icon: Watch },
];

const clothingData = [
  {
    size: "XS",
    chest: "32–34",
    waist: "24–26",
    hips: "34–36",
    height: "5'0\"–5'3\"",
  },
  {
    size: "S",
    chest: "34–36",
    waist: "26–28",
    hips: "36–38",
    height: "5'3\"–5'6\"",
  },
  {
    size: "M",
    chest: "36–38",
    waist: "28–30",
    hips: "38–40",
    height: "5'6\"–5'8\"",
  },
  {
    size: "L",
    chest: "38–40",
    waist: "30–32",
    hips: "40–42",
    height: "5'8\"–5'10\"",
  },
  {
    size: "XL",
    chest: "40–42",
    waist: "32–34",
    hips: "42–44",
    height: "5'10\"–6'0\"",
  },
  {
    size: "XXL",
    chest: "42–44",
    waist: "34–36",
    hips: "44–46",
    height: "6'0\"–6'2\"",
  },
];

const shoesData = [
  { eu: "36", uk: "3", us: "5", cm: "23" },
  { eu: "37", uk: "4", us: "6", cm: "24" },
  { eu: "38", uk: "5", us: "7", cm: "25" },
  { eu: "39", uk: "6", us: "8", cm: "25.5" },
  { eu: "40", uk: "6.5", us: "9", cm: "26" },
  { eu: "41", uk: "7", us: "10", cm: "27" },
  { eu: "42", uk: "8", us: "11", cm: "28" },
  { eu: "43", uk: "9", us: "12", cm: "29" },
  { eu: "44", uk: "10", us: "13", cm: "29.5" },
  { eu: "45", uk: "11", us: "13.5", cm: "30" },
  { eu: "46", uk: "12", us: "14", cm: "30.5" },
];

const ringData = [
  { us: "5", mm: "15.7" },
  { us: "6", mm: "16.5" },
  { us: "7", mm: "17.3" },
  { us: "8", mm: "18.1" },
  { us: "9", mm: "19.0" },
  { us: "10", mm: "19.8" },
  { us: "11", mm: "20.6" },
  { us: "12", mm: "21.4" },
];

const beltData = [
  { size: "S", inches: "28–30" },
  { size: "M", inches: "32–34" },
  { size: "L", inches: "36–38" },
  { size: "XL", inches: "40–42" },
];

const measureTips = [
  {
    title: "Chest",
    description:
      "Wrap the measuring tape around the fullest part of your chest, keeping it parallel to the floor. Ensure the tape is snug but not tight.",
  },
  {
    title: "Waist",
    description:
      "Measure around your natural waistline — the narrowest part of your torso, usually just above the belly button. Breathe normally while measuring.",
  },
  {
    title: "Hips",
    description:
      "Stand with your feet together and measure around the fullest part of your hips and buttocks. Keep the tape level and parallel to the floor.",
  },
];

// ─── Sub-components ──────────────────────────────────────────

function ClothingTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" as const }}
    >
      <div className="overflow-x-auto max-w-full rounded-xl border border-divider">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="bg-default-100 dark:bg-default-100/50">
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Size
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Chest (in)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Waist (in)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Hips (in)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Height
              </th>
            </tr>
          </thead>
          <tbody>
            {clothingData.map((row) => (
              <tr
                key={row.size}
                className="border-t border-divider transition-colors duration-150 hover:bg-accent/5"
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  {row.size}
                </td>
                <td className="px-4 py-3 text-foreground/80">{row.chest}</td>
                <td className="px-4 py-3 text-foreground/80">{row.waist}</td>
                <td className="px-4 py-3 text-foreground/80">{row.hips}</td>
                <td className="px-4 py-3 text-foreground/80">{row.height}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function ShoesTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" as const }}
    >
      <div className="overflow-x-auto max-w-full rounded-xl border border-divider">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="bg-default-100 dark:bg-default-100/50">
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                EU
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                UK
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                US
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                CM
              </th>
            </tr>
          </thead>
          <tbody>
            {shoesData.map((row) => (
              <tr
                key={row.eu}
                className="border-t border-divider transition-colors duration-150 hover:bg-accent/5"
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  {row.eu}
                </td>
                <td className="px-4 py-3 text-foreground/80">{row.uk}</td>
                <td className="px-4 py-3 text-foreground/80">{row.us}</td>
                <td className="px-4 py-3 text-foreground/80">{row.cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function AccessoriesTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" as const }}
      className="space-y-8"
    >
      {/* Ring Sizes */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Ring Sizes
        </h4>
        <div className="overflow-x-auto max-w-full rounded-xl border border-divider">
          <table className="w-full min-w-[240px] text-sm">
            <thead>
              <tr className="bg-default-100 dark:bg-default-100/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  US Size
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  MM
                </th>
              </tr>
            </thead>
            <tbody>
              {ringData.map((row) => (
                <tr
                  key={row.us}
                  className="border-t border-divider transition-colors duration-150 hover:bg-accent/5"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {row.us}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{row.mm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Belt Sizes */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Belt Sizes
        </h4>
        <div className="overflow-x-auto max-w-full rounded-xl border border-divider">
          <table className="w-full min-w-[240px] text-sm">
            <thead>
              <tr className="bg-default-100 dark:bg-default-100/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Size
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Inches
                </th>
              </tr>
            </thead>
            <tbody>
              {beltData.map((row) => (
                <tr
                  key={row.size}
                  className="border-t border-divider transition-colors duration-150 hover:bg-accent/5"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {row.size}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{row.inches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function HowToMeasure() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" as const, delay: 0.15 }}
      className="mt-8"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        How to Measure
      </h3>
      <div className="space-y-3">
        {measureTips.map((tip, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={tip.title}
              className="rounded-xl border border-divider overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left",
                  "transition-colors duration-150 hover:bg-default-100 dark:hover:bg-default-100/50",
                )}
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-foreground">
                  {tip.title}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted" />
                )}
              </button>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                >
                  <p className="px-4 pb-4 text-sm text-foreground/70 leading-relaxed">
                    {tip.description}
                  </p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────

export function SizeGuide() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("clothing");
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isHeaderInView = useInView(headerRef, { once: true, margin: "-60px" });
  const isContentInView = useInView(contentRef, {
    once: true,
    margin: "-40px",
  });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-40px" });

  return (
    <section className="py-16 md:py-24 bg-background relative">
      <div className="container mx-auto px-0 md:px-4 ">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 28 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
          }
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-12"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-accent/10 text-accent border border-accent/20"
          >
            <Ruler className="w-3.5 h-3.5 mr-1" />
            Size Guide
          </Chip>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Find Your Perfect Fit
          </h2>

          <p className="text-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Use our comprehensive size guides to find the right fit every time.
            Accurate measurements mean fewer returns and more confidence.
          </p>
        </motion.div>

        {/* ─── Content Area ─── */}
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 24 }}
          animate={
            isContentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
          }
          transition={{ duration: 0.55, ease: "easeOut" as const, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          {/* ─── Category Tabs ─── */}
          <div className="flex items-center justify-center gap-1 p-1 bg-default-100 dark:bg-default-100/50 rounded-xl mb-8">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 z-10",
                    isActive
                      ? "text-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="size-guide-tab-indicator"
                      className="absolute inset-0 bg-background rounded-lg shadow-sm z-[-1]"
                      transition={{ duration: 0.3, ease: "easeOut" as const }}
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* ─── Size Table ─── */}
          <div key={activeCategory}>
            {activeCategory === "clothing" && <ClothingTable />}
            {activeCategory === "shoes" && <ShoesTable />}
            {activeCategory === "accessories" && <AccessoriesTable />}
          </div>

          {/* ─── How to Measure ─── */}
          <HowToMeasure />
        </motion.div>

        {/* ─── CTA ─── */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: "easeOut" as const, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button
            variant="soft"
            className="bg-accent text-white font-semibold px-6"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Still unsure? Chat with us
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
