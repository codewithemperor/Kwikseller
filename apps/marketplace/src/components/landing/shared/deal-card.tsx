"use client";

import React from "react";
import Link from "next/link";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/api";

// ─── Deal-type → friendly label mapping ─────────────────────────────────────
//
// The dummy handler returns `FLASH` / `FEATURED` / `DEAL_OF_THE_DAY`, while the
// real NestJS backend returns `FLASH_DEAL` / `FEATURED_DEAL` / `DEAL_OF_THE_DAY`
// / `COUPON`. This map covers both spellings so the badge reads the same in
// either mode.

const DEAL_TYPE_LABELS: Record<string, string> = {
  FLASH: "Flash Deal",
  FLASH_DEAL: "Flash Deal",
  FEATURED: "Featured Deal",
  FEATURED_DEAL: "Featured Deal",
  DEAL_OF_THE_DAY: "Deal of the Day",
  COUPON: "Coupon",
};

export function dealTypeLabel(dealType: string): string {
  if (!dealType) return "Deal";
  return DEAL_TYPE_LABELS[dealType] ?? dealType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Image resolver ──────────────────────────────────────────────────────────
//
// A Deal may carry its own `imageUrl` (the promotional poster). When it
// doesn't, fall back to the first linked product's main image so the card is
// never blank.

function resolveDealImage(deal: Deal): string {
  if (deal.imageUrl && deal.imageUrl.trim()) return deal.imageUrl;
  const firstProduct = deal.products?.[0]?.product;
  if (!firstProduct) return "";
  const mainImg = firstProduct.images?.find((i) => i.isMain) ?? firstProduct.images?.[0];
  if (mainImg?.url) return mainImg.url;
  // The flat `image` field is not on the API `Product` type, but some
  // dummy payloads flatten it onto the product — accept it defensively.
  const flatImage = (firstProduct as unknown as { image?: string }).image;
  return flatImage ?? "";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DealCard({ deal }: { deal: Deal }) {
  const imageSrc = resolveDealImage(deal);
  const showDiscountBadge =
    deal.discountType === "PERCENTAGE" && typeof deal.discountValue === "number" && deal.discountValue > 0;
  const badgeLabel = dealTypeLabel(deal.dealType);

  return (
    <Link
      href={`/deals/${deal.id}`}
      aria-label={`Open deal: ${deal.title}`}
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden rounded-lg border border-border bg-kwik-bg-surface",
        "transition-shadow duration-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange/50",
      )}
    >
      {/* Image — fills the entire 4:5 frame. The subtle zoom on hover is
          applied to the wrapper; AppImage renders the <img> inside. */}
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
        <AppImage
          src={imageSrc}
          alt={deal.title}
          fallbackVariant="product"
          fallbackHint={deal.title}
          className="h-full w-full"
        />
      </div>

      {/* Top-right: discount badge (only for PERCENTAGE deals). */}
      {showDiscountBadge && (
        <span className="absolute right-2 top-2 rounded-full bg-kwik-red px-2 py-1 text-[11px] font-semibold leading-none text-white shadow-sm">
          -{Math.round(deal.discountValue)}%
        </span>
      )}

      {/* Bottom-left: deal-type pill. */}
      <span className="absolute bottom-2 left-2 rounded-full bg-kwik-orange px-2.5 py-1 text-[11px] font-semibold leading-none text-white shadow-sm">
        {badgeLabel}
      </span>
    </Link>
  );
}

// ─── Skeleton (used by the /deals listing while loading) ─────────────────────

export function DealCardSkeleton() {
  return (
    <div className="aspect-[4/5] animate-pulse rounded-lg border border-border bg-kwik-bg-light" />
  );
}
