"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";
import type { ProductVariant } from "@/data/marketplace-home";

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant) => void;
  selectedVariant?: ProductVariant | null;
}

// Color map for common color options
const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a",
  white: "#ffffff",
  gray: "#9ca3af",
  grey: "#9ca3af",
  silver: "#c0c0c0",
  gold: "#d4a853",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  navy: "#1e3a5f",
  midnight: "#1a1a2e",
  starlight: "#f5f0e8",
  space: "#4a4a4a",
  violet: "#8b5cf6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  yellow: "#eab308",
  orange: "#f97316",
  titanium: "#8a8a8a",
  brown: "#92400e",
  beige: "#d2b48c",
};

function isColorOption(optionName: string): boolean {
  const lower = optionName.toLowerCase();
  return Object.keys(COLOR_MAP).some((c) => lower.includes(c)) || lower.endsWith("black") || lower.endsWith("gray") || lower.endsWith("grey") || lower.endsWith("blue") || lower.endsWith("red") || lower.endsWith("green") || lower.endsWith("violet") || lower.endsWith("silver");
}

function getColorForOption(optionName: string): string {
  const lower = optionName.toLowerCase();
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return color;
  }
  return "#9ca3af"; // default gray
}

export function ProductVariantSelector({
  variants,
  onVariantSelect,
  selectedVariant,
}: ProductVariantSelectorProps) {
  // Group variants by name
  const variantGroups = useMemo(() => {
    const groups: Record<string, ProductVariant[]> = {};
    for (const v of variants) {
      if (!groups[v.name]) groups[v.name] = [];
      groups[v.name].push(v);
    }
    return groups;
  }, [variants]);

  const groupNames = Object.keys(variantGroups);

  // Track selected options per group
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Initialize with first option of each group
  React.useEffect(() => {
    const initial: Record<string, string> = {};
    for (const [name, options] of Object.entries(variantGroups)) {
      initial[name] = options[0]?.options ?? "";
    }
    setSelectedOptions(initial);
  }, [variants]);

  const handleSelect = (groupName: string, variant: ProductVariant) => {
    setSelectedOptions((prev) => ({ ...prev, [groupName]: variant.options }));
    onVariantSelect(variant);
  };

  if (groupNames.length === 0) return null;

  // Calculate total stock for selected variant combination
  const currentStock = selectedVariant?.stock ?? 0;
  const isOutOfStock = currentStock === 0;

  return (
    <div className="space-y-4">
      {groupNames.map((groupName) => {
        const options = variantGroups[groupName];
        const selected = selectedOptions[groupName];
        const isColor = isColorOption(options[0]?.options ?? "");

        return (
          <div key={groupName} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-kwik-dark">
                {groupName}
              </span>
              {selected && (
                <span className="text-xs font-medium text-kwik-orange">
                  {selected}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map((variant) => {
                const isSelected = selected === variant.options;
                const outOfStock = variant.stock === 0;

                if (isColor) {
                  const bgColor = getColorForOption(variant.options);
                  return (
                    <motion.button
                      key={variant.id}
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => !outOfStock && handleSelect(groupName, variant)}
                      disabled={outOfStock}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-kwik-orange ring-2 ring-kwik-orange/30 ring-offset-2 ring-offset-background"
                          : "border-kwik-border hover:border-kwik-orange/50"
                      } ${outOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      aria-label={variant.options}
                      title={`${variant.options}${outOfStock ? " (Out of stock)" : ""}`}
                    >
                      <span
                        className="h-6 w-6 rounded-full border border-black/10"
                        style={{ backgroundColor: bgColor }}
                      />
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-kwik-orange"
                        >
                          <Check className="h-2.5 w-2.5 text-white" />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                }

                // Size / text-based variant buttons
                return (
                  <motion.button
                    key={variant.id}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => !outOfStock && handleSelect(groupName, variant)}
                    disabled={outOfStock}
                    className={`relative flex h-10 min-w-[48px] items-center justify-center rounded-lg border px-4 text-sm font-medium shadow-none transition-colors duration-200 ${
                      isSelected
                        ? "border-kwik-orange bg-kwik-orange/10 text-kwik-orange"
                        : "border-kwik-border bg-background text-kwik-dark-medium hover:border-kwik-orange/50 hover:bg-kwik-orange/5"
                    } ${outOfStock ? "opacity-40 cursor-not-allowed line-through" : "cursor-pointer"}`}
                    aria-label={variant.options}
                    title={`${variant.options}${outOfStock ? " (Out of stock)" : ""}`}
                  >
                    {variant.options}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-kwik-orange"
                      >
                        <Check className="h-2.5 w-2.5 text-white" />
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Stock status */}
      {isOutOfStock ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-kwik-red/10 px-3 py-2.5 text-sm font-medium text-kwik-red"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Out of stock
        </motion.div>
      ) : currentStock <= 5 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-medium text-kwik-amber"
        >
          Only {currentStock} left in stock — order soon!
        </motion.p>
      ) : null}
    </div>
  );
}
