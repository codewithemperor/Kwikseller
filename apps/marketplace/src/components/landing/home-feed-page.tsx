"use client";

import Link from "next/link";
import React from "react";
import { ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import { marketplaceApi } from "@kwikseller/api-client";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
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

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-neutral-200/80 ${className}`} />;
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-kwik-dark">{title}</h2>
        <p className="text-sm text-kwik-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ProductSection({
  title,
  description,
  products,
}: {
  title: string;
  description: string;
  products: MarketplaceProduct[];
}) {
  return (
    <section className="space-y-4">
      <SectionTitle title={title} description={description} />
      {products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-kwik-border bg-background p-8">
          <EmptyState
            icon={<PackageOpen className="h-10 w-10" />}
            title="No products yet"
            description="Fresh products will appear here as soon as stores publish them."
          />
        </div>
      )}
    </section>
  );
}

function MarketplaceHomeSkeleton() {
  return (
    <div className="bg-kwik-bg-page py-3 sm:py-4">
      <div className="container mx-auto space-y-8 px-4">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.8fr]">
          <SkeletonBlock className="h-[420px] w-full rounded-[28px]" />
          <div className="rounded-[28px] bg-background p-5 shadow-sm">
            <div className="mb-4 flex items-end justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-6 w-32" />
                <SkeletonBlock className="h-4 w-52" />
              </div>
              <SkeletonBlock className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-[20px] bg-white px-3 py-3"
                >
                  <SkeletonBlock className="h-14 w-14 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-2/3" />
                    <SkeletonBlock className="h-3 w-1/3" />
                  </div>
                  <SkeletonBlock className="h-4 w-10" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {Array.from({ length: 3 }, (_, sectionIndex) => (
          <section key={sectionIndex} className="space-y-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-36" />
              <SkeletonBlock className="h-4 w-64" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="rounded-[22px] bg-background p-2 shadow-sm">
                  <SkeletonBlock className="aspect-square w-full rounded-[18px]" />
                  <div className="space-y-2 px-2 pb-2 pt-4">
                    <SkeletonBlock className="h-4 w-4/5" />
                    <SkeletonBlock className="h-3 w-1/3" />
                    <SkeletonBlock className="h-8 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[28px] bg-background p-5 shadow-sm">
          <div className="mb-4 space-y-2">
            <SkeletonBlock className="h-6 w-24" />
            <SkeletonBlock className="h-4 w-56" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-8">
              {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[22px] bg-kwik-bg-light"
              >
                <SkeletonBlock className="aspect-square w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <SkeletonBlock className="h-4 w-4/5" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function MarketplaceHomeFeedPage() {
  const [feed, setFeed] = React.useState<HomeFeedResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeBanner, setActiveBanner] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await marketplaceApi.getHomeFeed();
        if (isMounted) {
          setFeed(response.data as HomeFeedResponse);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load marketplace",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!feed?.heroBanners?.length || feed.heroBanners.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % feed.heroBanners.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [feed?.heroBanners]);

  if (isLoading) {
    return <MarketplaceHomeSkeleton />;
  }

  if (error || !feed) {
    return (
      <div className="bg-kwik-bg-page px-4 py-16">
        <div className="container mx-auto rounded-[24px] border border-kwik-border bg-background p-8">
          <EmptyState
            icon={<PackageOpen className="h-10 w-10" />}
            title="Marketplace unavailable"
            description={error || "We couldn't load the marketplace right now."}
          />
        </div>
      </div>
    );
  }

  const banners = feed.heroBanners;
  const currentBanner = banners[activeBanner] || banners[0];

  return (
    <div className="bg-kwik-bg-page py-3 sm:py-4">
      <div className="container mx-auto space-y-8 px-4">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.8fr]">
          <div className="relative h-[420px] overflow-hidden rounded-[28px] bg-background shadow-sm">
            <Link href={currentBanner?.href || "/products"} className="block h-full w-full">
              <AppImage
                src={currentBanner?.image}
                alt={currentBanner?.title || "Kwikseller banner"}
                className="h-full w-full"
                objectFit="cover"
              />
            </Link>

            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveBanner((current) =>
                      current === 0 ? banners.length - 1 : current - 1,
                    )
                  }
                  className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-kwik-dark shadow-sm backdrop-blur"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveBanner((current) => (current + 1) % banners.length)
                  }
                  className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-kwik-dark shadow-sm backdrop-blur"
                  aria-label="Next banner"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {banners.map((banner, index) => (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => setActiveBanner(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeBanner
                          ? "w-8 bg-white"
                          : "w-2.5 bg-white/55"
                      }`}
                      aria-label={`Go to banner ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-[28px] bg-background p-5 shadow-sm">
            <SectionTitle
              title="Categories"
              description="Browse live categories from the API."
              action={
                <Link
                  href="/categories"
                  className="text-sm font-medium text-accent transition hover:opacity-80"
                >
                  See more
                </Link>
              }
            />
            <div className="h-[340px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {feed.categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories?name=${category.slug}`}
                  className="group flex items-center gap-3 rounded-[20px] bg-white px-3 py-3 transition hover:bg-neutral-50"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                    <AppImage
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-kwik-dark">
                      {category.name}
                    </p>
                    <p className="mt-1 text-xs text-kwik-muted">
                      {category.itemCount} product
                      {category.itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-kwik-muted transition group-hover:text-accent">
                    View
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ProductSection
          title="Featured Picks"
          description="A fresh random set on every load."
          products={feed.featuredProducts}
        />

        <ProductSection
          title="Trending Now"
          description="Popular active products pulled from the live catalog."
          products={feed.trendingProducts}
        />

        <ProductSection
          title="Deals"
          description="Discounted products with real compare prices."
          products={feed.dealProducts}
        />

        <section className="rounded-[28px] bg-background p-5 shadow-sm">
          <SectionTitle
            title="Brands"
            description="Active brands with live product counts."
          />
          {feed.brands.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-8">
              {feed.brands.map((brand) => (
                <div
                  key={brand.id}
                  className="overflow-hidden rounded-[22px] bg-kwik-bg-light"
                >
                  <div className="aspect-square overflow-hidden">
                    <AppImage
                      src={brand.image}
                      alt={brand.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-kwik-dark">
                      {brand.name}
                    </p>
                    <p className="text-xs text-kwik-muted">
                      {brand.productCount} product
                      {brand.productCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<PackageOpen className="h-10 w-10" />}
              title="No brands yet"
              description="Brands will show up here as soon as they’re active."
            />
          )}
        </section>
      </div>
    </div>
  );
}
