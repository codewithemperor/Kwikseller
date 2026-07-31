"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  MapPin,
  Package,
  Star,
  Store,
  ImageIcon,
} from "lucide-react";
import { cn, getInitials } from "../lib/utils";

export interface VendorCardProps {
  /** Display name, e.g. "Lagos Tech Hub". */
  name: string;
  /** URL slug (used to build href when href itself is omitted). */
  slug: string;
  /** Logo image URL. Falls back to initials on a primary tint. */
  logo?: string;
  /** Cover banner image. Falls back to the kwik-gradient. */
  cover?: string;
  /** Category label, e.g. "Electronics". */
  category?: string;
  /** Location string, e.g. "Lagos, NG". */
  location?: string;
  /** Average rating 0-5. */
  rating?: number;
  /** Number of products in the store. */
  productCount?: number;
  /** Verified vendor badge. */
  isVerified?: boolean;
  /** Link wrapping the card. Defaults to `/vendor/${slug}` when omitted. */
  href?: string;
  /** Extra Tailwind classes. */
  className?: string;
}

/**
 * VendorCard — generic storefront / vendor card.
 *
 * Layout: a 3:1 cover banner with an overlapping circular logo, the vendor
 * name, a stats row (rating · products · location), and an orange "Visit
 * Store" CTA. The verified badge sits next to the name when `isVerified`.
 *
 * Tokens: cover fallback uses the brand gradient (`.kwik-gradient`), CTA
 * uses `bg-secondary-500` (orange), verified badge uses `text-primary-600`.
 */
export function VendorCard({
  name,
  slug,
  logo,
  cover,
  category,
  location,
  rating,
  productCount,
  isVerified = false,
  href,
  className,
}: VendorCardProps) {
  const linkHref = href ?? `/vendor/${slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-lg",
        className,
      )}
    >
      {/* Cover */}
      <div className="relative h-24 w-full overflow-hidden bg-gray-100 sm:h-28">
        {cover ? (
          <img
            src={cover}
            alt={`${name} cover banner`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="kwik-gradient h-full w-full" aria-hidden="true" />
        )}
      </div>

      {/* Logo (overlapping the cover) */}
      <div className="relative -mt-8 px-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-gray-100 shadow-sm">
          {logo ? (
            <img
              src={logo}
              alt={`${name} logo`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary-50 text-base font-bold text-primary-700">
              {getInitials(name) || <Store className="h-6 w-6" aria-hidden="true" />}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="line-clamp-1 text-base font-bold text-foreground">
                {name}
              </h3>
              {isVerified && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-primary-600"
                  aria-label="Verified vendor"
                />
              )}
            </div>
            {category && (
              <span className="text-xs font-medium text-gray-500">{category}</span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {rating !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
            </span>
          )}
          {productCount !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              {productCount.toLocaleString()} products
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {location}
            </span>
          )}
        </div>

        {/* CTA */}
        <a
          href={linkHref}
          aria-label={`Visit ${name} store`}
          className="mt-1 inline-flex h-9 w-full items-center justify-center rounded-lg bg-secondary-500 px-4 text-xs font-semibold text-white transition hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Visit Store
        </a>
      </div>
    </motion.article>
  );
}

export default VendorCard;
