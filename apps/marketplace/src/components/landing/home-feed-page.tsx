"use client";

import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  Boxes,
  ChevronRight,
  Clock3,
  Download,
  PackageCheck,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { marketplaceApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickViewModal } from "@/components/landing/quick-view-modal";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { useCartStore, useHomeFeedStore, useRecentlyViewedStore, useWishlistStore } from "@/stores";
import { rankProductsForMember } from "@/lib/marketplace-ranking";
import type { MarketplaceProduct } from "@/data/marketplace-home";

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

interface HomeBrand {
  id: string;
  name: string;
  image: string | null;
  productCount: number;
}

interface HomeFeedResponse {
  heroBanners: HomeBanner[];
  categories: HomeCategory[];
  brands: HomeBrand[];
  featuredProducts: MarketplaceProduct[];
  dealProducts: MarketplaceProduct[];
  trendingProducts: MarketplaceProduct[];
}

type PoolOffer = {
  id: string;
  retailPrice: number;
  markup?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    images?: Array<{ url: string; isMain?: boolean }>;
    category?: { name: string };
  };
  poolProduct?: {
    name: string;
    description?: string;
    suggestedRetailPrice?: number;
    images?: string;
  };
  store?: { name: string };
};

type PoolCampaign = {
  id: string;
  title: string;
  targetQuantity: number;
  committedQuantity: number;
  unitPrice: number;
  status: string;
  poolProduct?: { name: string };
};

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
    const raw = localStorage.getItem("kwikseller-search-history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function campaignHref(campaign: PoolCampaign) {
  const slug = campaign.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
  return `/group-buy/${slug || "campaign"}-${campaign.id}`;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-100 ${className}`} />;
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="-mx-4 mb-4 flex items-center justify-between gap-3 bg-[#0b4aa2] px-4 py-3 text-white md:mx-0">
      <div>
        <h2 className="text-base font-semibold text-white md:text-xl">{title}</h2>
        <p className="mt-0.5 max-w-2xl text-xs leading-5 text-white/70 md:text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ProductBand({
  title,
  description,
  products,
  actionHref,
  gridClassName = "grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-4 xl:grid-cols-5",
  onQuickView,
}: {
  title: string;
  description: string;
  products: MarketplaceProduct[];
  actionHref?: string;
  gridClassName?: string;
  onQuickView?: (product: MarketplaceProduct) => void;
}) {
  return (
    <section>
      <SectionHeader
        title={title}
        description={description}
        action={
          actionHref ? (
            <Link href={actionHref} className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
              View more <ChevronRight className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      />
      {products.length ? (
        <div className={gridClassName}>
          {products.map((product, index) => (
            <MarketplaceProductCard key={`${product.id}-${index}`} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-300 p-8">
          <EmptyState
            icon={<PackageOpen className="h-10 w-10" />}
            title="Nothing listed yet"
            description="New live products will show up here as vendors publish them."
          />
        </div>
      )}
    </section>
  );
}

function PoolOfferCard({ offer }: { offer: PoolOffer }) {
  const addItem = useCartStore((state) => state.addItem);
  const productId = offer.product?.id;
  const image = offer.product?.images?.[0]?.url ?? null;
  const name = offer.product?.name ?? offer.poolProduct?.name ?? "Pool resale offer";

  const addToCart = () => {
    if (!productId) {
      kwikToast.error("This Pool offer is not ready for checkout yet.");
      return;
    }

    addItem({
      productId,
      poolOfferId: offer.id,
      name,
      price: offer.retailPrice,
      comparePrice: offer.poolProduct?.suggestedRetailPrice,
      image: image ?? "",
      store: offer.store?.name,
      productType: "PHYSICAL",
      productSource: "POOL_RESALE",
      requiresShipping: true,
    });
    kwikToast.success("Pool resale offer added to cart");
  };

  return (
    <article className="group border-b border-neutral-200 pb-4 dark:border-white/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <AppImage src={image} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallbackVariant="product" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-800">
          <Users className="h-3 w-3" />
          Pool Resale
        </span>
      </div>
      <div className="mt-3 space-y-3">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-kwik-dark dark:text-white">{name}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-kwik-muted dark:text-white/55">{offer.store?.name ?? "Verified vendor"}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-kwik-muted dark:text-white/55">Vendor price</p>
            <p className="text-base font-bold text-kwik-dark dark:text-white">{formatCurrency(offer.retailPrice)}</p>
          </div>
          <button
            type="button"
            onClick={addToCart}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-kwik-dark px-3 text-xs font-semibold text-white transition hover:bg-black"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Cart
          </button>
        </div>
      </div>
    </article>
  );
}

function CampaignRow({ campaign }: { campaign: PoolCampaign }) {
  const progress =
    campaign.targetQuantity > 0
      ? Math.min(100, Math.round((campaign.committedQuantity / campaign.targetQuantity) * 100))
      : 0;

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
        <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
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
          className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-white text-xs font-semibold text-[#0b4aa2]"
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}

function MarketplaceHomeSkeleton() {
  return (
    <div className="bg-white py-4">
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

export function MarketplaceHomeFeedPage() {
  const [feed, setFeed] = React.useState<HomeFeedResponse | null>(null);
  const [poolOffers, setPoolOffers] = React.useState<PoolOffer[]>([]);
  const [campaigns, setCampaigns] = React.useState<PoolCampaign[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeBanner, setActiveBanner] = React.useState(0);
  const [quickViewProduct, setQuickViewProduct] = React.useState<MarketplaceProduct | null>(null);
  const setCachedHomeFeed = useHomeFeedStore((state) => state.setHomeFeed);
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const recentlyViewedItems = useRecentlyViewedStore((state) => state.items);

  React.useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const isPageReload = navEntry?.type === "reload";

      const cachedHome = useHomeFeedStore.getState();
      if (!isPageReload && cachedHome.isFresh() && cachedHome.feed) {
        setFeed(cachedHome.feed);
        setPoolOffers(cachedHome.poolOffers);
        setCampaigns(cachedHome.campaigns);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [homeResponse, poolResponse, campaignsResponse] = await Promise.allSettled([
          marketplaceApi.getHomeFeed(),
          marketplaceApi.getPoolOffers({ limit: 6 }),
          marketplaceApi.getPoolCampaigns({ limit: 4 }),
        ]);

        if (!isMounted) return;
        if (homeResponse.status === "fulfilled") {
          const nextFeed = unwrapApiData<HomeFeedResponse>(homeResponse.value.data);
          const nextPoolOffers = poolResponse.status === "fulfilled"
            ? unwrapApiData<PoolOffer[]>(poolResponse.value.data)
            : [];
          const nextCampaigns = campaignsResponse.status === "fulfilled"
            ? unwrapApiData<PoolCampaign[]>(campaignsResponse.value.data)
            : [];

          setFeed(nextFeed);
          setPoolOffers(nextPoolOffers);
          setCampaigns(nextCampaigns);
          setCachedHomeFeed({
            feed: nextFeed,
            poolOffers: nextPoolOffers,
            campaigns: nextCampaigns,
          });
        } else {
          throw homeResponse.reason;
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load marketplace");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFeed();
    return () => {
      isMounted = false;
    };
  }, [setCachedHomeFeed]);

  React.useEffect(() => {
    const count = feed?.heroBanners.length ?? 0;
    if (count < 2) return undefined;

    const interval = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % count);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [feed?.heroBanners.length]);

  if (isLoading) return <MarketplaceHomeSkeleton />;

  if (error || !feed) {
    return (
      <div className="bg-white px-4 py-20 dark:bg-[#07111f]">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200">
            <PackageOpen className="h-7 w-7 text-kwik-orange" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-kwik-dark dark:text-white">Marketplace could not load</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-kwik-muted dark:text-white/60">
            {error || "We could not reach the live catalog right now. Please try again in a moment."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-kwik-dark px-5 text-sm font-semibold text-white"
          >
            Retry marketplace
          </button>
        </div>
      </div>
    );
  }

  const banners = feed.heroBanners.length
    ? feed.heroBanners
    : [
        {
          id: "fallback",
          title: "Pool-ready marketplace",
          subtitle: "Shop vendor stock, resale offers, group buys, and digital products in one cart.",
          image: null,
          href: "/search",
          badge: "Kwikseller",
        },
      ];
  const banner = banners[activeBanner % banners.length];
  const memberSignals = {
    cartProductIds: cartItems.map((item) => item.productId),
    wishlistProductIds: wishlistItems.map((item) => item.id),
    recentlyViewedIds: recentlyViewedItems.map((item) => item.id),
    searchHistory: getSearchHistory(),
  };
  const rankedFeatured = rankProductsForMember(feed.featuredProducts, memberSignals);
  const rankedTrending = rankProductsForMember(feed.trendingProducts, memberSignals);
  const stockProducts = rankedFeatured.filter((item) => item.productSource !== "POOL_RESALE");
  const digitalProducts = [...rankedFeatured, ...rankedTrending].filter(
    (item) => item.productType === "DIGITAL",
  );

  return (
    <div className="bg-white pb-12 dark:bg-[#07111f]">
      <section className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#07111f]">
        <div className="container mx-auto px-4 py-5 md:py-7">
          <div className="lg:hidden">
            <Link href={banner.href || "/search"} className="block">
              <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                <AppImage src={banner.image} alt={banner.title} className="h-full w-full object-cover" fallbackVariant="product" />
              </div>
            </Link>
            {banners.length > 1 && (
              <div className="mt-3 flex justify-center gap-2" aria-label="Marketplace banners">
                {banners.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() => setActiveBanner(index)}
                    className={`h-1.5 rounded-full transition-all ${index === activeBanner ? "w-6 bg-kwik-dark" : "w-1.5 bg-neutral-300"}`}
                    aria-label={`Show banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1.45fr)_380px] xl:grid-cols-[minmax(0,1.55fr)_430px]">
            <Link href={banner.href || "/search"} className="block h-[390px] overflow-hidden bg-neutral-100 xl:h-[430px]">
              <AppImage src={banner.image} alt={banner.title} className="h-full w-full object-cover transition duration-700 hover:scale-[1.02]" fallbackVariant="product" />
            </Link>

            <aside className="flex h-[390px] flex-col justify-between border border-neutral-200 p-6 dark:border-white/10 xl:h-[430px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-kwik-orange">{banner.badge || "Kwikseller Pool"}</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-kwik-dark dark:text-white xl:text-4xl">{banner.title}</h1>
                <p className="mt-3 text-sm leading-6 text-kwik-muted dark:text-white/60">{banner.subtitle}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 border-y border-neutral-200 py-4 dark:border-white/10">
                  <div>
                    <p className="text-2xl font-semibold text-kwik-dark dark:text-white">{feed.categories.length}</p>
                    <p className="text-xs text-kwik-muted dark:text-white/55">Categories</p>
                  </div>
                  <div className="border-x border-neutral-200 px-4 dark:border-white/10">
                    <p className="text-2xl font-semibold text-kwik-dark dark:text-white">{poolOffers.length}</p>
                    <p className="text-xs text-kwik-muted dark:text-white/55">Pool offers</p>
                  </div>
                  <div className="pl-4">
                    <p className="text-2xl font-semibold text-kwik-dark dark:text-white">{campaigns.length}</p>
                    <p className="text-xs text-kwik-muted dark:text-white/55">Group buys</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  {[
                    { icon: PackageCheck, title: "Vendor Stock", text: "Physical products with real inventory rules." },
                    { icon: Users, title: "Pool Resale", text: "Vendor markup on Admin Pool Catalog items." },
                    { icon: Download, title: "Digital Delivery", text: "Checkout skips shipping when fulfillment is digital." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <item.icon className="mt-0.5 h-4 w-4 text-kwik-orange" />
                      <div>
                        <p className="text-sm font-semibold text-kwik-dark dark:text-white">{item.title}</p>
                        <p className="text-xs leading-5 text-kwik-muted dark:text-white/55">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/search"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-kwik-dark px-4 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Browse
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 text-sm font-semibold text-kwik-dark transition hover:border-kwik-dark"
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

      <div className="container mx-auto space-y-12 px-4 py-10">
        <section>
          <div className="-mx-4 mb-4 flex items-center justify-between gap-3 bg-[#0b4aa2] px-4 py-3 text-white md:mx-0">
            <div>
              <h2 className="text-base font-semibold text-white md:text-xl">Pool resale shelf</h2>
              <p className="mt-0.5 max-w-2xl text-xs leading-5 text-white/70 md:text-sm">
              Vendor offers backed by the Admin Pool Catalog, priced with markup, and ready to validate in checkout.
              </p>
            </div>
            <Link href="/pool" className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
              View more <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {poolOffers.length ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {poolOffers.slice(0, 6).map((offer, index) => (
                <PoolOfferCard key={`${offer.id}-${index}`} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-emerald-300 p-8 text-sm leading-6 text-emerald-900">
              Pool offers will appear as vendors opt into the Admin Pool Catalog.
            </div>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <ProductBand
            title="Vendor stock"
            description="Products fulfilled manually while Rider stays paused."
            products={(stockProducts.length ? stockProducts : rankedFeatured).slice(0, 8)}
            actionHref="/search?source=vendor-stock"
            gridClassName="grid grid-cols-2 gap-x-4 gap-y-7 xl:grid-cols-4"
            onQuickView={setQuickViewProduct}
          />

          <aside className="bg-[#0b4aa2] p-5 text-white">
            <div className="-mx-5 mb-4 flex items-center justify-between gap-3 bg-[#0b4aa2] px-5 py-3">
              <div>
                <h2 className="text-base font-semibold md:text-xl">Group-buy desk</h2>
                <p className="mt-0.5 text-xs leading-5 text-white/70 md:text-sm">Campaigns waiting for buyer commitments.</p>
              </div>
              <Link href="/group-buy" className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
                View more <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div>
              {campaigns.length ? (
                campaigns.slice(0, 4).map((campaign, index) => <CampaignRow key={`${campaign.id}-${index}`} campaign={campaign} />)
              ) : (
                <div className="border border-dashed border-white/30 p-6">
                  <Clock3 className="h-6 w-6 text-white" />
                  <p className="mt-3 text-sm font-semibold text-white">No live group buys yet</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">Admin-created campaigns will show here after setup.</p>
                </div>
              )}
            </div>
          </aside>
        </section>

        {digitalProducts.length > 0 && (
          <ProductBand
            title="Digital delivery"
            description="Instant-access products that skip shipping."
            products={digitalProducts.slice(0, 5)}
            actionHref="/search?type=digital"
            onQuickView={setQuickViewProduct}
          />
        )}

        <ProductBand
          title="Trending catalog"
          description="Live active products from stores."
          products={rankedTrending}
          actionHref="/search"
          onQuickView={setQuickViewProduct}
        />

        <section id="categories" className="scroll-mt-28">
          <div className="-mx-4 mb-4 flex items-center justify-between bg-[#0b4aa2] px-4 py-3 text-white md:mx-0">
            <div>
              <Boxes className="h-6 w-6 text-white" />
              <h2 className="mt-2 text-base font-semibold text-white md:text-xl">Browse by category</h2>
              <p className="mt-0.5 text-xs text-white/70 md:text-sm">Category shelves stay API-driven and ready for fulfillment filters.</p>
            </div>
            <Link href="/categories" className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
              View more <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {feed.categories.slice(0, 8).map((category, index) => (
              <Link
                key={`${category.id}-${index}`}
                href={`/categories?name=${category.slug}`}
                className="group border-b border-neutral-200 pb-4"
              >
                <div className="aspect-[5/3] overflow-hidden bg-neutral-100">
                  <AppImage src={category.image} alt={category.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <p className="mt-3 text-sm font-semibold text-kwik-dark">{category.name}</p>
                <p className="text-xs text-kwik-muted">{category.itemCount} products</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Vendor storefronts"
            description="Use this compact vendor treatment wherever sellers are listed."
            action={
              <Link href="/vendors" className="inline-flex items-center gap-1 text-sm font-semibold text-kwik-dark dark:text-white">
                View more <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-4">
            {feed.brands.slice(0, 4).map((brand, index) => (
              <div key={`${brand.id}-${index}`} className="border-b border-neutral-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden bg-neutral-100">
                    <AppImage src={brand.image} alt={brand.name} className="h-full w-full object-cover" fallbackVariant="default" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-kwik-dark">{brand.name}</p>
                    <p className="text-xs text-kwik-muted">{brand.productCount} active products</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified shelf
                  </span>
                  <Link href="/vendors" className="inline-flex items-center gap-1 font-semibold text-kwik-dark">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#071a3f] px-5 py-6 text-white md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Store className="h-7 w-7 text-kwik-orange" />
              <h2 className="mt-4 text-2xl font-semibold">Checkout is now commerce-aware.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                The cart validates inventory, shipping requirements, digital delivery, and Pool rules before Paystack checkout.
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#071a3f]"
            >
              Go to cart
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
