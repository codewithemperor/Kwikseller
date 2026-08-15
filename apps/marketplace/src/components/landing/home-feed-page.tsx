"use client";

import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  PackageCheck,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Sparkle,
  Sparkles,
  Store,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { marketplaceApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickViewModal } from "@/components/landing/quick-view-modal";
import { RecentlyViewedSection } from "@/components/landing/recently-viewed-section";
import { NewsletterSection } from "@/components/landing/newsletter-section";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { ProductSection } from "@/components/landing/shared/product-section";
import { CategoryCard } from "@/components/landing/shared/category-card";
import { useCartStore, useHomeFeedStore, useRecentlyViewedStore, useWishlistStore } from "@/stores";
import { rankProductsForMember } from "@/lib/marketplace-ranking";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import { SEARCH_HISTORY_KEY } from "@/constants/marketplace";

// ==================== Types ====================

interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
  badge: string;
}

interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  itemCount: number;
}

interface FlashDealProduct extends MarketplaceProduct {
  dealPrice?: number;
  discountPercent?: number;
}

interface FlashDeal {
  id: string;
  title: string;
  description?: string;
  dealType: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string | null;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  products: FlashDealProduct[];
}

interface GroupBuyCampaign {
  id: string;
  title: string;
  targetQuantity: number;
  committedQuantity: number;
  unitPrice: number;
  status: string;
  startsAt: string;
  endsAt: string | null;
  progress: number;
  poolProduct: {
    id: string;
    name: string;
    description?: string;
    images?: string;
    suggestedRetailPrice?: number;
  } | null;
}

interface TopVendor {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  productCount: number;
  isVerified: boolean;
  vendor: {
    name: string;
    avatar: string | null;
  };
}

interface HomeFeedResponse {
  heroBanners: HomeBanner[];
  categories: HomeCategory[];
  featuredProducts: MarketplaceProduct[];
  trendingProducts: MarketplaceProduct[];
  newArrivals: MarketplaceProduct[];
  flashDeals: FlashDeal[];
  groupBuyCampaigns: GroupBuyCampaign[];
  topVendors: TopVendor[];
}

// ==================== Helpers ====================

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function unwrapApiData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function getSearchHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function campaignHref(campaign: GroupBuyCampaign) {
  const slug = campaign.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
  return `/group-buy/${slug || "campaign"}-${campaign.id}`;
}

// ==================== Countdown timer for flash deals ====================

function useCountdown(targetTime: Date | null) {
  const [timeLeft, setTimeLeft] = React.useState({ hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    if (!targetTime) return;
    const timer = window.setInterval(() => {
      const diff = targetTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  return timeLeft;
}

function FlashDealCountdown({ endDate }: { endDate: string | null }) {
  // If no end date, countdown to end of day
  const [targetTime, setTargetTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (endDate) {
      setTargetTime(new Date(endDate));
    } else {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      setTargetTime(end);
    }
  }, [endDate]);

  const timeLeft = useCountdown(targetTime);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-bold text-white tabular-nums backdrop-blur">
        {pad(timeLeft.hours)}h
      </span>
      <span className="text-xs font-bold text-white/80">:</span>
      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-bold text-white tabular-nums backdrop-blur">
        {pad(timeLeft.minutes)}m
      </span>
      <span className="text-xs font-bold text-white/80">:</span>
      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-bold text-white tabular-nums backdrop-blur">
        {pad(timeLeft.seconds)}s
      </span>
    </div>
  );
}

// ==================== Skeleton ====================

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted dark:bg-white/5 ${className}`} />;
}

function MarketplaceHomeSkeleton() {
  return (
    <div className="bg-background py-4">
      <div className="container mx-auto space-y-8 px-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_380px]">
          <SkeletonBlock className="h-[240px] md:h-[340px] lg:h-[390px]" />
          <SkeletonBlock className="hidden h-[390px] lg:block" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <SkeletonBlock key={index} className="h-72" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== Group-buy campaign row ====================

function CampaignRow({ campaign }: { campaign: GroupBuyCampaign }) {
  return (
    <div className="border-b border-white/15 py-4 transition hover:border-white/35">
      <div className="flex items-start justify-between gap-4">
        <Link href={campaignHref(campaign)} className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-cyan-100">{campaign.status}</p>
          <h3 className="mt-1 text-sm font-semibold text-white">{campaign.title}</h3>
          <p className="mt-1 text-xs text-white/65">{campaign.poolProduct?.name ?? "Pool campaign"}</p>
        </Link>
        <p className="text-sm font-bold text-white">{formatCurrency(campaign.unitPrice)}</p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-white" style={{ width: `${campaign.progress}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-white/65">
        <span>{campaign.committedQuantity} committed</span>
        <span>{campaign.targetQuantity} target</span>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href={campaignHref(campaign)}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-white/20 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          View details
        </Link>
        <button
          type="button"
          onClick={() => kwikToast.success(`Subscribed to ${campaign.title}`)}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-white text-xs font-semibold text-kwik-blue"
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}

// ==================== Top vendor card ====================

function TopVendorCard({ vendor }: { vendor: TopVendor }) {
  return (
    <Link
      href={`/vendor/${vendor.slug}`}
      className="group border-b border-border pb-4 transition hover:opacity-80"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-muted dark:bg-white/5">
        <AppImage
          src={vendor.banner}
          alt={vendor.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          fallbackVariant="store"
        />
        <div className="absolute -bottom-4 left-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-background">
          <AppImage
            src={vendor.logo}
            alt={vendor.name}
            className="h-full w-full object-cover"
            fallbackVariant="store"
          />
        </div>
        {vendor.isVerified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-kwik-orange px-2 py-0.5 text-[10px] font-bold text-white">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </span>
        )}
      </div>
      <div className="mt-5">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{vendor.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {vendor.productCount} products
        </p>
      </div>
    </Link>
  );
}

// ==================== Main component ====================

export function MarketplaceHomeFeedPage() {
  const [feed, setFeed] = React.useState<HomeFeedResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeBanner, setActiveBanner] = React.useState(0);
  const [quickViewProduct, setQuickViewProduct] = React.useState<MarketplaceProduct | null>(null);

  // Infinite scroll state for "Browse All Products"
  const [moreProducts, setMoreProducts] = React.useState<MarketplaceProduct[]>([]);
  const [morePage, setMorePage] = React.useState(0);
  const [moreTotalPages, setMoreTotalPages] = React.useState(1);
  const [moreIsLoading, setMoreIsLoading] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const setCachedHomeFeed = useHomeFeedStore((state) => state.setHomeFeed);
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const recentlyViewedItems = useRecentlyViewedStore((state) => state.items);

  // ---- Load the homepage feed (single API call) ----
  React.useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const isPageReload = navEntry?.type === "reload";

      const cachedHome = useHomeFeedStore.getState();
      // Only use cached feed if it has the new schema fields (flashDeals,
      // groupBuyCampaigns, topVendors, newArrivals). Old caches from the
      // previous version lack these and must be re-fetched.
      const cachedFeed = cachedHome.feed as unknown as HomeFeedResponse | null;
      const cacheHasNewSchema =
        cachedFeed &&
        Array.isArray(cachedFeed.flashDeals) &&
        Array.isArray(cachedFeed.groupBuyCampaigns) &&
        Array.isArray(cachedFeed.topVendors) &&
        Array.isArray(cachedFeed.newArrivals);
      if (!isPageReload && cachedHome.isFresh() && cacheHasNewSchema) {
        setFeed(cachedFeed);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await marketplaceApi.getHomeFeed();
        if (!isMounted) return;
        const nextFeed = unwrapApiData<HomeFeedResponse>(response.data);
        setFeed(nextFeed);
        setCachedHomeFeed({ feed: nextFeed as any, poolOffers: [], campaigns: [] });
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "We could not reach the live catalog right now."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFeed();
    return () => { isMounted = false; };
  }, [setCachedHomeFeed]);

  // ---- Load page 1 of "Browse All Products" after the feed is ready ----
  const loadMoreProducts = React.useCallback(async (page: number) => {
    setMoreIsLoading(true);
    try {
      // The `api` wrapper already extracts res.data, so `result` IS the
      // ApiResponse body: { success, data: [...products], meta: {...}, timestamp }
      const result = await marketplaceApi.getHomeFeedMore({ page, limit: 20 }) as {
        data: MarketplaceProduct[];
        meta?: { page: number; limit: number; total: number; totalPages: number };
      };
      const products = result.data ?? [];
      const meta = result.meta ?? { page, totalPages: 1 };
      setMoreProducts(prev => page === 1 ? products : [...prev, ...products]);
      setMorePage(meta.page);
      setMoreTotalPages(meta.totalPages);
    } catch {
      // Silently fail — the curated sections above still render
    } finally {
      setMoreIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (feed && morePage === 0) {
      loadMoreProducts(1);
    }
  }, [feed, morePage, loadMoreProducts]);

  // ---- IntersectionObserver for infinite scroll ----
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !moreIsLoading && morePage < moreTotalPages) {
          loadMoreProducts(morePage + 1);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [moreIsLoading, morePage, moreTotalPages, loadMoreProducts]);

  // ---- Banner auto-rotation ----
  React.useEffect(() => {
    const count = feed?.heroBanners.length ?? 0;
    if (count < 2) return undefined;
    const interval = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % count);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [feed?.heroBanners.length]);

  // ---- Loading & error states ----
  if (isLoading) return <MarketplaceHomeSkeleton />;

  if (error || !feed) {
    return (
      <div className="bg-background py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border">
            <PackageOpen className="h-7 w-7 text-kwik-orange" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-foreground">Marketplace could not load</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {error || "We could not reach the live catalog right now. Please try again in a moment."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-kwik-orange px-5 text-sm font-semibold text-white"
          >
            Retry marketplace
          </button>
        </div>
      </div>
    );
  }

  // ---- Derived data ----
  const banners = feed.heroBanners.length
    ? feed.heroBanners
    : [{
        id: "fallback",
        title: "Pool-ready marketplace",
        subtitle: "Shop vendor stock, resale offers, group buys, and digital products in one cart.",
        image: null,
        href: "/search",
        badge: "Kwikseller",
      }];
  const banner = banners[activeBanner % banners.length];

  const memberSignals = {
    cartProductIds: cartItems.map((item) => item.productId),
    wishlistProductIds: wishlistItems.map((item) => item.id),
    recentlyViewedIds: recentlyViewedItems.map((item) => item.id),
    searchHistory: getSearchHistory(),
  };
  const rankedFeatured = rankProductsForMember(feed.featuredProducts, memberSignals);
  const rankedTrending = rankProductsForMember(feed.trendingProducts, memberSignals);
  const rankedNewArrivals = rankProductsForMember(feed.newArrivals, memberSignals);
  const stockProducts = rankedFeatured.filter((item) => item.productSource !== "POOL_RESALE");
  const digitalProducts = [...rankedFeatured, ...rankedTrending].filter(
    (item) => item.productType === "DIGITAL",
  );

  // Flatten flash deal products (all deals combined into one section)
  const allFlashDealProducts: FlashDealProduct[] = feed.flashDeals.flatMap(
    (deal) => deal.products,
  );
  const nearestFlashDealEnd = feed.flashDeals
    .map((d) => d.endDate)
    .filter((d): d is string => !!d)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  return (
    <div className="bg-background pb-12">
      {/* ==================== Hero Section ==================== */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-kwik-bg-warm via-background to-kwik-bg-surface">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-kwik-orange/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-kwik-amber/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto py-5 md:py-7 container-px">
          {/* Mobile hero */}
          <div className="lg:hidden">
            <Link href={banner.href || "/search"} className="group block overflow-hidden rounded-2xl shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted dark:bg-white/5">
                <AppImage src={banner.image} alt={banner.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" fallbackVariant="product" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-kwik-orange px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    <Sparkle className="h-3 w-3" />
                    {banner.badge || "Kwikseller"}
                  </span>
                  <h1 className="mt-2 text-2xl font-bold leading-tight text-white drop-shadow-sm">{banner.title}</h1>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/85">{banner.subtitle}</p>
                </div>
              </div>
            </Link>
            {banners.length > 1 && (
              <div className="mt-3 flex justify-center gap-2" aria-label="Marketplace banners">
                {banners.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() => setActiveBanner(index)}
                    className={`h-1.5 rounded-full transition-all ${index === activeBanner ? "w-6 bg-kwik-orange" : "w-1.5 bg-muted-foreground/30"}`}
                    aria-label={`Show banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop hero */}
          <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1.45fr)_380px] xl:grid-cols-[minmax(0,1.55fr)_430px]">
            <Link href={banner.href || "/search"} className="group relative block h-[390px] overflow-hidden rounded-2xl bg-muted shadow-lg dark:bg-white/5 xl:h-[430px]">
              <AppImage src={banner.image} alt={banner.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" fallbackVariant="product" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />

              <div className="absolute left-5 top-5 flex flex-col gap-2">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kwik-orange opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-kwik-orange" />
                  </span>
                  Live · {banner.badge || "Kwikseller Pool"}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 xl:p-8">
                <motion.h1
                  key={banner.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-xl text-3xl font-bold leading-tight text-white drop-shadow-md xl:text-5xl"
                >
                  {banner.title}
                </motion.h1>
                <motion.p
                  key={`${banner.id}-sub`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="mt-2 max-w-md text-sm leading-6 text-white/85 xl:text-base"
                >
                  {banner.subtitle}
                </motion.p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-kwik-orange px-5 text-sm font-semibold text-white shadow-md transition-transform group-hover:scale-[1.02]">
                    Shop now
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="text-xs text-white/70">{banners.length > 1 ? `${activeBanner + 1} / ${banners.length}` : ""}</span>
                </div>
              </div>
            </Link>

            <aside className="relative flex h-[390px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-lg xl:h-[430px]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-kwik-orange/5 via-transparent to-kwik-amber/5" aria-hidden />

              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wide text-kwik-orange">Marketplace at a glance</p>
                <h2 className="mt-3 text-2xl font-bold leading-tight text-foreground">
                  Shop vendor stock, pool offers & group buys
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Real inventory from verified Nigerian vendors — fulfilled through Kwikseller escrow.
                </p>
              </div>

              <div className="relative space-y-4">
                <div className="grid grid-cols-3 border-y border-border py-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{feed.categories.length}</p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                  <div className="border-x border-border px-4">
                    <p className="text-2xl font-bold text-foreground">{feed.groupBuyCampaigns.length}</p>
                    <p className="text-xs text-muted-foreground">Group buys</p>
                  </div>
                  <div className="pl-4">
                    <p className="text-2xl font-bold text-foreground">{feed.topVendors.length}</p>
                    <p className="text-xs text-muted-foreground">Vendors</p>
                  </div>
                </div>

                <div className="grid gap-2.5">
                  {[
                    { icon: PackageCheck, title: "Vendor Stock", text: "Physical products with real inventory rules.", tone: "text-kwik-orange" },
                    { icon: Users, title: "Partner network", text: "More products fulfilled through verified partners.", tone: "text-kwik-violet" },
                    { icon: Download, title: "Digital Delivery", text: "Checkout skips shipping when fulfillment is digital.", tone: "text-kwik-emerald" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-kwik-bg-surface">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background ${item.tone}`}>
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs leading-5 text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/search"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-kwik-orange px-4 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01]"
                  >
                    Browse
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-kwik-orange hover:text-kwik-orange"
                  >
                    Cart
                    <ShoppingCart className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ==================== Product Sections ==================== */}
      <div className="mx-auto space-y-12 py-10">

        {/* Flash Deals — powered by the Deal table (admin-created FLASH_DEAL campaigns).
            Falls back to comparePrice>price heuristic when no DealProduct rows exist. */}
        {allFlashDealProducts.length > 0 && (
          <div className="container-px">
            <ProductSection
              title="Flash Deals"
              description="Time-limited discounts — grab them before the timer runs out."
              products={allFlashDealProducts}
              viewAllHref="/search?sort=deals"
              icon={Flame}
              accent="orange"
              badge={<FlashDealCountdown endDate={nearestFlashDealEnd ?? null} />}
              onQuickView={setQuickViewProduct}
            />
          </div>
        )}

        {/* Featured Products */}
        <div className="container-px">
          <ProductSection
            title="Featured Products"
            description="Hand-picked products from verified vendors."
            products={rankedFeatured}
            viewAllHref="/search?filter=featured"
            icon={Sparkles}
            onQuickView={setQuickViewProduct}
          />
        </div>

        {/* New Arrivals + Group Buy desk — two-column layout */}
        <div className="container-px grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <ProductSection
            title="New Arrivals"
            description="Fresh listings added in the last 3 weeks."
            products={rankedNewArrivals}
            viewAllHref="/search?sort=newest"
            icon={Zap}
            gridClassName="grid grid-cols-2 gap-x-4 gap-y-7 xl:grid-cols-4 2xl:grid-cols-5"
            onQuickView={setQuickViewProduct}
          />

          {/* Group-buy desk — real PoolCampaign data */}
          <div>
            <aside className="bg-kwik-blue p-5 text-white">
              <div className="-mx-5 mb-4 flex items-center justify-between gap-3 bg-kwik-blue px-5 py-3">
                <div>
                  <h2 className="text-base font-semibold md:text-xl">Group-buy desk</h2>
                  <p className="mt-0.5 text-xs leading-5 text-white/70 md:text-sm">Campaigns waiting for buyer commitments.</p>
                </div>
                <Link href="/group-buy" className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
                  View more <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div>
                {feed.groupBuyCampaigns.length ? (
                  feed.groupBuyCampaigns.slice(0, 4).map((campaign) => (
                    <CampaignRow key={campaign.id} campaign={campaign} />
                  ))
                ) : (
                  <div className="border border-dashed border-white/30 p-6">
                    <Clock3 className="h-6 w-6 text-white" />
                    <p className="mt-3 text-sm font-semibold text-white">No live group buys yet</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">Admin-created campaigns will show here after setup.</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Vendor Stock — physical products fulfilled by vendors */}
        <div className="container-px">
          <ProductSection
            title="Vendor Stock"
            description="Products fulfilled manually while Rider stays paused."
            products={stockProducts}
            viewAllHref="/search?source=vendor-stock"
            icon={PackageCheck}
            gridClassName="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            onQuickView={setQuickViewProduct}
          />
        </div>

        {/* Digital Delivery — only renders when digital products exist */}
        {digitalProducts.length > 0 && (
          <div className="container-px">
            <ProductSection
              title="Digital Delivery"
              description="Instant-access products that skip shipping."
              products={digitalProducts.slice(0, 10)}
              viewAllHref="/search?type=digital"
              icon={Download}
              onQuickView={setQuickViewProduct}
            />
          </div>
        )}

        {/* Trending Catalog */}
        <div className="container-px">
          <ProductSection
            title="Trending Catalog"
            description="Live active products from stores, ranked by sales and ratings."
            products={rankedTrending}
            viewAllHref="/search"
            icon={Zap}
            onQuickView={setQuickViewProduct}
          />
        </div>

        {/* Browse by Category */}
        <section id="categories" className="scroll-mt-28">
          <div className="bg-kwik-blue text-white">
            <div className="container-px py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white md:text-xl">Browse by category</h2>
                <p className="mt-0.5 text-xs text-white/70 md:text-sm">Category shelves stay API-driven and ready for fulfillment filters.</p>
              </div>
              <Link href="/categories" className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
                View more <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="container-px bg-background py-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {feed.categories.slice(0, 8).map((category, index) => (
                <CategoryCard key={`${category.id}-${index}`} category={category} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Top Vendors — real verified stores by product count */}
        {feed.topVendors.length > 0 && (
          <section>
            <div className="-mx-4 flex items-center justify-between gap-3 bg-kwik-blue px-4 py-3 text-white md:mx-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white md:text-xl">Top Vendors</h2>
                  <p className="mt-0.5 max-w-2xl text-xs leading-5 text-white/70 md:text-sm">Verified stores with the most products on the marketplace.</p>
                </div>
              </div>
              <Link href="/vendors" className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
                View more <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="container-px bg-background py-4">
              <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                {feed.topVendors.slice(0, 8).map((vendor) => (
                  <TopVendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Delivery agents leaderboard — CTA banner */}
        <section className="container-px py-2">
          <Link
            href="/delivery-agents"
            className="group relative block overflow-hidden rounded-3xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-kwik-orange/10 sm:p-8"
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kwik-orange text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-kwik-orange-tint px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-kwik-orange">
                    <Sparkles className="h-3 w-3" /> Top-rated couriers
                  </div>
                  <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                    Meet our delivery agents
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    Real ratings from real buyers. See who&apos;s delivering your orders across Nigeria — ranked by speed, care, and friendliness.
                  </p>
                </div>
              </div>
              <div className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-kwik-orange px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300 group-hover:bg-kwik-orange-dark group-hover:shadow-md">
                View leaderboard
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </section>

        {/* Checkout CTA */}
        <section className="bg-foreground px-5 py-6 text-background md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Store className="h-7 w-7 text-kwik-orange" />
              <h2 className="mt-4 text-2xl font-semibold">Checkout is now commerce-aware.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-background/70">
                The cart validates inventory, shipping requirements, digital delivery, and Pool rules before Paystack checkout.
              </p>
            </div>
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-background px-5 text-sm font-semibold text-foreground"
            >
              Go to cart
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Newsletter */}
        <div className="max-w-4xl mx-auto">
          <NewsletterSection />
        </div>

        {/* Recently viewed (only renders when the buyer has viewed products) */}
        <RecentlyViewedSection />

        {/* ==================== Browse All Products — Infinite Scroll ==================== */}
        {moreProducts.length > 0 && (
          <div className="container-px">
            <ProductSection
              title="Browse All Products"
              description="Scroll to load more products from the marketplace."
              products={moreProducts}
              viewAllHref="/search"
              icon={PackageOpen}
              onQuickView={setQuickViewProduct}
            >
              {/* Infinite scroll sentinel — IntersectionObserver triggers loadMoreProducts when this enters the viewport */}
              {morePage < moreTotalPages && (
                <div ref={sentinelRef} className="flex items-center justify-center py-8">
                  {moreIsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
                      Loading more products...
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Scroll to load more</div>
                  )}
                </div>
              )}
              {morePage >= moreTotalPages && moreProducts.length > 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  You&apos;ve reached the end of the catalog.
                </div>
              )}
            </ProductSection>
          </div>
        )}
      </div>

      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
