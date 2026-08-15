"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleSlash,
  Clock,
  PackageOpen,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeal, toMarketplaceProduct, type Deal } from "@/lib/api-hooks";
import { dealTypeLabel } from "@/components/landing/shared/deal-card";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { AppImage } from "@/components/ui/app-image";
import type { MarketplaceProduct } from "@/data/marketplace-home";

// Quick-view modal is dynamically imported (client-only) to keep the
// deal-detail bundle small — same pattern as /categories and /products.
const QuickViewModal = dynamic(
  () =>
    import("@/components/landing/quick-view-modal").then(
      (mod) => mod.QuickViewModal,
    ),
  { ssr: false },
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type DealStatus = "active" | "scheduled" | "ended";

function computeDealStatus(deal: Deal, now: Date = new Date()): DealStatus {
  if (!deal.isActive) return "ended";
  const start = deal.startDate ? new Date(deal.startDate).getTime() : NaN;
  const end = deal.endDate ? new Date(deal.endDate).getTime() : NaN;
  const nowMs = now.getTime();
  if (!Number.isNaN(start) && nowMs < start) return "scheduled";
  if (!Number.isNaN(end) && nowMs > end) return "ended";
  return "active";
}

const STATUS_BADGE: Record<DealStatus, { label: string; className: string; Icon: typeof CircleCheck }> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    Icon: CircleCheck,
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    Icon: Clock,
  },
  ended: {
    label: "Ended",
    className: "bg-muted text-muted-foreground",
    Icon: CircleSlash,
  },
};

function discountLabel(deal: Deal): string | null {
  if (!deal.discountValue || deal.discountValue <= 0) return null;
  if (deal.discountType === "PERCENTAGE") return `${Math.round(deal.discountValue)}% off`;
  if (deal.discountType === "FIXED_AMOUNT") return `${formatNGN(deal.discountValue)} off`;
  return null;
}

/**
 * Map a DealProduct (the join-row carrying `dealPrice` + nested `product`)
 * to a `MarketplaceProduct`, but override the price so the card shows the
 * deal price as the current price and the product's original price as the
 * strikethrough compare-at price.
 */
function toDealMarketplaceProduct(
  row: NonNullable<Deal["products"]>[number],
): MarketplaceProduct {
  const base = toMarketplaceProduct(row.product);
  const original = row.product.comparePrice ?? row.product.price;
  return {
    ...base,
    price: row.dealPrice,
    comparePrice: original > row.dealPrice ? original : base.comparePrice,
  };
}

// ─── Hero image resolver (same logic as DealCard, but for the large hero) ───

function resolveDealImage(deal: Deal): string {
  if (deal.imageUrl && deal.imageUrl.trim()) return deal.imageUrl;
  const firstProduct = deal.products?.[0]?.product;
  if (!firstProduct) return "";
  const mainImg = firstProduct.images?.find((i) => i.isMain) ?? firstProduct.images?.[0];
  if (mainImg?.url) return mainImg.url;
  const flatImage = (firstProduct as unknown as { image?: string }).image;
  return flatImage ?? "";
}

// ─── Page component ─────────────────────────────────────────────────────────

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const dealQuery = useDeal(id);
  const deal = dealQuery.data;
  const isLoading = dealQuery.isLoading;
  const isError = dealQuery.isError;
  const isNotFound = !isLoading && !isError && !deal;

  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);

  const status = useMemo<DealStatus>(
    () => (deal ? computeDealStatus(deal) : "active"),
    [deal],
  );

  const heroImage = useMemo(() => (deal ? resolveDealImage(deal) : ""), [deal]);
  const discount = useMemo(() => (deal ? discountLabel(deal) : null), [deal]);
  const products = useMemo<MarketplaceProduct[]>(() => {
    if (!deal?.products || deal.products.length === 0) return [];
    return deal.products.map(toDealMarketplaceProduct);
  }, [deal]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-3 w-48 animate-pulse rounded bg-muted py-3" />
            <div className="grid gap-6 pb-8 pt-2 md:grid-cols-2">
              <div className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />
              <div className="space-y-3">
                <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-20 w-full animate-pulse rounded bg-muted" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 border-b border-border pb-4">
                <div className="aspect-[4/5] animate-pulse bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (isNotFound || isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
              <PackageOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-foreground">Deal not found</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {isError
                ? "We couldn't load this deal. Please try again later."
                : "We couldn't find the deal you're looking for. It may have ended or been removed."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/deals"
                className="inline-flex h-11 items-center justify-center rounded-md bg-kwik-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
              >
                Browse all deals
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Back home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[status];
  const StatusIcon = statusBadge.Icon;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-kwik-orange">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/deals" className="transition-colors hover:text-kwik-orange">
              Deals
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="line-clamp-1 font-medium text-foreground">{deal.title}</span>
          </nav>
        </div>
      </div>

      {/* ── Deal header ── */}
      <section className="bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-kwik-bg-surface"
            >
              <AppImage
                src={heroImage}
                alt={deal.title}
                fallbackVariant="product"
                fallbackHint={deal.title}
                className="h-full w-full"
              />
              {/* Type badge (top-left) */}
              <span className="absolute left-3 top-3 rounded-full bg-kwik-orange px-3 py-1.5 text-xs font-semibold leading-none text-white shadow-sm">
                {dealTypeLabel(deal.dealType)}
              </span>
              {/* Discount badge (top-right) */}
              {discount && (
                <span className="absolute right-3 top-3 rounded-full bg-kwik-red px-3 py-1.5 text-xs font-semibold leading-none text-white shadow-sm">
                  {discount}
                </span>
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="flex flex-col"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    statusBadge.className,
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusBadge.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-kwik-orange-tint px-3 py-1 text-xs font-semibold text-kwik-orange">
                  <Tag className="h-3.5 w-3.5" />
                  {dealTypeLabel(deal.dealType)}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
                {deal.title}
              </h1>

              {deal.description && (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {deal.description}
                </p>
              )}

              {/* Discount info */}
              {discount && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-kwik-orange/30 bg-kwik-orange-tint px-4 py-2.5">
                  <Tag className="h-4 w-4 text-kwik-orange" />
                  <span className="text-sm font-semibold text-kwik-orange">
                    {discount}
                  </span>
                </div>
              )}

              {/* Date range */}
              <div className="mt-5 space-y-2">
                <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-kwik-muted" />
                  <div>
                    <span className="font-medium text-foreground">Starts</span>
                    <span className="ml-2">{formatDate(deal.startDate)}</span>
                  </div>
                </div>
                {deal.endDate && (
                  <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-kwik-muted" />
                    <div>
                      <span className="font-medium text-foreground">Ends</span>
                      <span className="ml-2">{formatDate(deal.endDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {products.length > 0 && (
                  <a
                    href="#deal-products"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-kwik-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
                  >
                    Shop the deal ({products.length} item{products.length !== 1 ? "s" : ""})
                  </a>
                )}
                <Link
                  href="/deals"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" /> All deals
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Products in this deal ── */}
      <section id="deal-products" className="border-t border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                Products in this deal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {products.length > 0
                  ? `${products.length} product${products.length !== 1 ? "s" : ""} included in this campaign`
                  : "No products are linked to this deal yet."}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <PackageOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">
                No products in this deal
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Products will appear here once they are added to this campaign.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-kwik-orange px-5 text-sm font-semibold text-kwik-orange transition-colors hover:bg-kwik-orange-tint"
              >
                Browse all products
              </Link>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } },
              }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            >
              {products.map((product, index) => (
                <motion.div
                  key={`${product.id}-${index}`}
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.3, ease: "easeOut" },
                    },
                  }}
                >
                  <MarketplaceProductCard
                    product={product}
                    onQuickView={() => setQuickViewProduct(product)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Quick view ── */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
