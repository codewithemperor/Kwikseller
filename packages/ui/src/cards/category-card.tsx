"use client";

import React from "react";
import { motion } from "framer-motion";
import { Package, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export interface CategoryCardProps {
  /** Display name, e.g. "Electronics". */
  name: string;
  /** Background image. When omitted, a primary-tinted gradient is shown. */
  image?: string;
  /** Alt text for the image. Defaults to the category name. */
  imageAlt?: string;
  /** Number of items in the category, shown as "N items". */
  itemCount?: number;
  /** Optional lucide icon shown when no image is provided. */
  icon?: LucideIcon;
  /** Link wrapping the card. */
  href?: string;
  /** Extra Tailwind classes. */
  className?: string;
}

/**
 * CategoryCard — generic category tile with an image (or gradient fallback
 * + icon), name overlay and optional item count.
 *
 * Designed to live inside responsive grids (`grid grid-cols-2 md:grid-cols-4`
 * etc.). The image fills a 4:3 box; a navy→blue gradient overlay keeps the
 * white name/count text legible on any photo.
 */
export function CategoryCard({
  name,
  image,
  imageAlt,
  itemCount,
  icon: Icon = Package,
  href,
  className,
}: CategoryCardProps) {
  const altText = imageAlt ?? name;
  const label = `${name}${itemCount !== undefined ? ` — ${itemCount} items` : ""}`;

  return (
    <motion.a
      href={href}
      aria-label={label}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "group relative block aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Image (or gradient + icon fallback) */}
      {image ? (
        <img
          src={image}
          alt={altText}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div
          className="kwik-gradient absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon className="h-10 w-10 text-white/90" strokeWidth={1.5} />
        </div>
      )}

      {/* Gradient overlay for legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/30 to-transparent"
        aria-hidden="true"
      />

      {/* Text */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white drop-shadow-sm sm:text-base">
          {name}
        </h3>
        {itemCount !== undefined && (
          <span className="text-xs font-medium text-white/85">
            {itemCount.toLocaleString()} {itemCount === 1 ? "item" : "items"}
          </span>
        )}
      </div>
    </motion.a>
  );
}

export default CategoryCard;
