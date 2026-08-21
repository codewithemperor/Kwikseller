"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tag, ImageIcon } from "lucide-react";
import { cn, getInitials } from "../lib/utils";

export interface BrandCardProps {
  /** Brand display name. */
  name: string;
  /** Brand logo / image URL. Falls back to initials on a gray tint. */
  image?: string;
  /** Alt text for the image. Defaults to the brand name. */
  imageAlt?: string;
  /** Number of products associated with the brand. */
  productCount?: number;
  /** Link wrapping the card. */
  href?: string;
  /** Extra Tailwind classes. */
  className?: string;
}

/**
 * BrandCard — clean, centered card for brand logos in brand grids.
 *
 * The brand image (or initials fallback) sits in a soft gray square; below
 * it the brand name and an optional product count are centered. Hover lifts
 * the card subtly and emphasizes the logo.
 */
export function BrandCard({
  name,
  image,
  imageAlt,
  productCount,
  href,
  className,
}: BrandCardProps) {
  const altText = imageAlt ?? `${name} logo`;
  const label = `${name}${productCount !== undefined ? ` — ${productCount} products` : ""}`;

  return (
    <motion.a
      href={href}
      aria-label={label}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group flex w-full flex-col items-center gap-3 rounded-2xl border border-border bg-background p-5 text-center transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 transition-colors group-hover:bg-gray-50">
        {image ? (
          <img
            src={image}
            alt={altText}
            loading="lazy"
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-500">
            {getInitials(name) || <ImageIcon className="h-8 w-8" aria-hidden="true" />}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          {name}
        </h3>
        {productCount !== undefined && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
            <Tag className="h-3 w-3" aria-hidden="true" />
            {productCount.toLocaleString()} products
          </span>
        )}
      </div>
    </motion.a>
  );
}

export default BrandCard;
