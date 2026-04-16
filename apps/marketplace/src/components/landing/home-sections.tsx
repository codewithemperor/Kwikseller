"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@heroui/react";
import {
  getMarketplaceProduct,
  marketplaceBrands,
  marketplaceCategories,
  marketplaceFeaturedDeals,
  marketplaceFeaturedProducts,
  marketplaceHeroBanners,
  marketplaceNewArrivals,
  marketplacePromoBanners,
  marketplaceReviews,
  marketplaceTopSellers,
  marketplaceTrustItems,
  MarketplaceProduct,
  marketplaceProducts,
} from "@/data/marketplace-home";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { useMarketplaceShell } from "@/components/layout/marketplace-shell-context";
import {
  SectionHeader,
  ProductCarouselSection,
  CategoryCarouselSection,
  PromoBannerGrid,
  BrandCarouselSection,
} from "@/components/landing/shared/marketplace-carousel";

/* ─────────────────────────────────────────────
   Hero (unchanged)
───────────────────────────────────────────── */
export function MarketplaceHero() {
  const [activeBanner, setActiveBanner] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(
      () => setActiveBanner((c) => (c + 1) % marketplaceHeroBanners.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="border-b border-[#e5e7eb] bg-[#f5f5f5] py-4">
      <div className="container mx-auto grid gap-4 px-4 lg:grid-cols-[250px_1fr_280px]">
        {/* Category sidebar */}
        <aside className="hidden rounded-[20px] bg-white p-4 shadow-sm lg:block">
          <div className="space-y-1">
            {marketplaceCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#374151] transition-colors hover:bg-[#fff7ed] hover:text-[#ea580c]"
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Banner carousel */}
        <div className="space-y-3">
          <div className="hidden overflow-hidden rounded-[24px] bg-[#ea580c] shadow-sm md:block">
            <div className="relative aspect-[2.25/1]">
              {marketplaceHeroBanners.map((banner, index) => (
                <Link
                  key={banner.id}
                  href={banner.href}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === activeBanner
                      ? "pointer-events-auto opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                >
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                      {banner.badge}
                    </span>
                    <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight">
                      {banner.title}
                    </h1>
                    <p className="mt-2 max-w-lg text-sm text-white/85">
                      {banner.subtitle}
                    </p>
                  </div>
                </Link>
              ))}
              <button
                type="button"
                onClick={() =>
                  setActiveBanner((c) =>
                    c === 0 ? marketplaceHeroBanners.length - 1 : c - 1,
                  )
                }
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111827]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveBanner(
                    (c) => (c + 1) % marketplaceHeroBanners.length,
                  )
                }
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111827]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {marketplaceHeroBanners.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setActiveBanner(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeBanner ? "w-8 bg-white" : "w-2.5 bg-white/45"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile horizontal scroll banners */}
          <div className="md:hidden">
            <div className="grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto pb-1 min-[420px]:auto-cols-[56%] min-[540px]:auto-cols-[32%]">
              {marketplaceHeroBanners.map((banner) => (
                <Link
                  key={banner.id}
                  href={banner.href}
                  className="relative overflow-hidden rounded-[22px] bg-[#ea580c] shadow-sm"
                >
                  <div className="relative aspect-[1.3/1]">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      sizes="78vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                        {banner.badge}
                      </span>
                      <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-tight">
                        {banner.title}
                      </h2>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Seller CTA panel */}
        <div className="hidden space-y-3 lg:block">
          <div className="rounded-[20px] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ea580c]">
              Become a seller
            </p>
            <h2 className="mt-2 text-lg font-bold text-[#111827]">
              Create a store and start selling
            </h2>
            <p className="mt-2 text-xs leading-6 text-[#6b7280]">
              Reach more buyers with a storefront that follows a familiar
              marketplace experience.
            </p>
            <Link href="/register?role=VENDOR" className="mt-4 inline-flex">
              <Button
                variant="primary"
                className="h-11 rounded-xl bg-[#ea580c] px-5 font-semibold text-white hover:bg-[#c2410c]"
              >
                Start selling
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Trust Bar
───────────────────────────────────────────── */
export function MarketplaceTrustBar() {
  return (
    <section className="bg-[#f5f5f5]">
      <div className="container mx-auto grid gap-3 px-4 py-5 md:grid-cols-2 xl:grid-cols-4">
        {marketplaceTrustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#ea580c]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#111827]">
                  {item.title}
                </p>
                <p className="text-xs leading-5 text-[#6b7280]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Category Section (now uses carousel)
───────────────────────────────────────────── */
export function MarketplaceCategorySection() {
  const categoriesForCarousel = marketplaceCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    image: cat.image,
    icon: cat.icon,
  }));

  return <CategoryCarouselSection categories={categoriesForCarousel} />;
}

/* ─────────────────────────────────────────────
   Promo Banners Section
───────────────────────────────────────────── */
export function MarketplacePromoBannersSection() {
  const banners = marketplacePromoBanners.map((banner) => ({
    id: banner.id,
    image: banner.image,
    href: banner.href,
  }));

  return <PromoBannerGrid banners={banners} />;
}

/* ─────────────────────────────────────────────
   Top Sellers
───────────────────────────────────────────── */
export function MarketplaceTopSellersSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-[#f5f5f5] py-1">
      <div className="container mx-auto px-0 md:px-4 ">
        <SectionHeader title="Top Sellers" href="/vendors" />

        <div className="relative bg-white p-5 py-8">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white shadow-sm transition-all hover:border-[#ea580c] disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </div>
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white shadow-sm transition-all hover:border-[#ea580c] disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {marketplaceTopSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="min-w-0 shrink-0 basis-[calc(100%-16px)] sm:basis-[calc(50%-8px)] lg:basis-[calc(33.333%-11px)]"
                >
                  <Link
                    href={`/vendors?seller=${seller.id}`}
                    className="group block overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/[0.04] transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[2.6/1] overflow-hidden">
                      <Image
                        src={seller.image}
                        alt={seller.name}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute right-3 top-3 max-w-[55%] rounded-xl bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                        <p className="line-clamp-2 text-xs font-semibold leading-tight text-[#111827]">
                          Looking For The Newest {seller.tagline}?
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#f3f4f6] bg-white shadow-sm">
                        <Image
                          src={seller.logo}
                          alt={seller.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-base font-semibold text-[#111827]">
                        {seller.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-[#f3f4f6] border-t border-[#f3f4f6]">
                      <div className="flex flex-col items-center py-3">
                        <p className="text-lg font-bold text-[#111827]">
                          {seller.rating ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
                              {seller.rating.toFixed(1)}
                            </span>
                          ) : (
                            "0"
                          )}
                        </p>
                        <p className="text-xs text-[#9ca3af]">Reviews</p>
                      </div>
                      <div className="flex flex-col items-center py-3">
                        <p className="text-lg font-bold text-[#111827]">
                          {seller.productCount?.replace(/\D/g, "") ?? "0"}
                        </p>
                        <p className="text-xs text-[#9ca3af]">Products</p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Brands Section (now uses carousel with circles only)
───────────────────────────────────────────── */
export function MarketplaceBrandsSection() {
  const brandsForCarousel = marketplaceBrands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    image: brand.image,
    href: brand.href,
  }));

  return <BrandCarouselSection brands={brandsForCarousel} />;
}

/* ─────────────────────────────────────────────
   Reviews section
───────────────────────────────────────────── */
export function MarketplaceReviewsSection() {
  const [emblaRef] = useEmblaCarousel({ loop: false, align: "start" });

  return (
    <section className="bg-[#f5f5f5] py-5">
      <div className="container mx-auto px-0 md:px-4 ">
        <SectionHeader title="Customer Reviews" href="#" />
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {marketplaceReviews.map((review) => (
              <div
                key={review.id}
                className="min-w-0 shrink-0 basis-[calc(100%-16px)] sm:basis-[calc(50%-8px)] lg:basis-[calc(33.333%-11px)]"
              >
                <article className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
                  <div className="mb-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#d1d5db]"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-[#4b5563]">
                    {review.text}
                  </p>
                  <div className="mt-4 border-t border-[#f3f4f6] pt-4">
                    <p className="font-semibold text-[#111827]">
                      {review.name}
                    </p>
                    <p className="text-sm text-[#6b7280]">{review.location}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Named section exports used by page.tsx
───────────────────────────────────────────── */
export function MarketplaceFeaturedProductsSection({
  onQuickView,
}: {
  onQuickView: (p: MarketplaceProduct) => void;
}) {
  return (
    <ProductCarouselSection
      title="Featured Products"
      href="/products"
      products={marketplaceProducts}
      onQuickView={onQuickView}
    />
  );
}

export function MarketplaceFeaturedDealsSection({
  onQuickView,
}: {
  onQuickView: (p: MarketplaceProduct) => void;
}) {
  return (
    <ProductCarouselSection
      title="Featured Deals"
      href="/deals"
      products={marketplaceFeaturedDeals}
      onQuickView={onQuickView}
      autoplay
    />
  );
}

export function MarketplaceNewArrivalsSection({
  onQuickView,
}: {
  onQuickView: (p: MarketplaceProduct) => void;
}) {
  return (
    <ProductCarouselSection
      title="New Arrivals"
      href="/products?filter=new"
      products={marketplaceNewArrivals}
      onQuickView={onQuickView}
    />
  );
}

export function MarketplaceSellerCta() {
  const ctaProduct = getMarketplaceProduct("chair-1");
  return (
    <section className="bg-[#f5f5f5] py-5 pb-12">
      <div className="container mx-auto px-0 md:px-4 ">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ea580c]">
              Sell on Kwikseller
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#111827]">
              Build a storefront with a familiar marketplace experience
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b7280]">
              List products, reach buyers and manage your store with a cleaner
              buying experience inspired by established e-commerce layouts.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=VENDOR" className="inline-flex">
                <Button
                  variant="primary"
                  className="h-11 rounded-xl bg-[#ea580c] px-5 font-semibold text-white hover:bg-[#c2410c]"
                >
                  Create vendor account
                </Button>
              </Link>
              <Link href="/vendors" className="inline-flex">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-[#d1d5db] px-5 font-semibold text-[#111827]"
                >
                  View top sellers
                </Button>
              </Link>
            </div>
          </div>
          {ctaProduct && (
            <div className="border-t border-[#f3f4f6] bg-[#faf7f2] p-5 lg:border-l lg:border-t-0">
              <MarketplaceProductCard product={ctaProduct} priority />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
