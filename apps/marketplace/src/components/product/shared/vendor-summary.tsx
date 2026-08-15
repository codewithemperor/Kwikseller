"use client";

import Link from "next/link";
import { Store, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorSummaryProps {
  storeName: string;
  storeSlug?: string;
  storeId?: string;
  rating?: number;
  productCount?: number | string;
  logoUrl?: string;
  className?: string;
  /** When true, shows a "Visit Store" link. */
  showLink?: boolean;
}

/**
 * Reusable vendor/store summary card.
 * Shows vendor name, rating, product count, and a link to the vendor storefront.
 * Does NOT duplicate the entire vendor storefront — just a clear path to it.
 */
export function VendorSummary({
  storeName,
  storeSlug,
  storeId,
  rating,
  productCount,
  logoUrl,
  className,
  showLink = true,
}: VendorSummaryProps) {
  const href = storeSlug ? `/vendors/${storeSlug}` : storeId ? `/vendors?store=${storeId}` : "/vendors";

  const content = (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-kwik-orange/10 dark:bg-white/10">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
        ) : (
          <Store className="h-5 w-5 text-kwik-orange" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-kwik-dark dark:text-white">{storeName}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-kwik-muted dark:text-white/55">
          {rating !== undefined && rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              {rating.toFixed(1)}
            </span>
          )}
          {productCount !== undefined && (
            <span>
              {typeof productCount === "number"
                ? `${productCount} product${productCount === 1 ? "" : "s"}`
                : productCount}
            </span>
          )}
        </div>
      </div>
      {showLink && (
        <ChevronRight className="h-4 w-4 shrink-0 text-kwik-muted dark:text-white/40" />
      )}
    </div>
  );

  if (!showLink) {
    return <div className={cn("rounded-xl border border-border p-4", className)}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border border-border p-4 transition-colors hover:border-kwik-orange/40 hover:bg-kwik-orange-tint/30 dark:hover:bg-white/5",
        className,
      )}
    >
      {content}
    </Link>
  );
}
