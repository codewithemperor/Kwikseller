"use client";

/**
 * marketplace-carousel.tsx
 * Reusable carousel components for marketplace sections
 */

import React, { useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MarketplaceProductCard } from "./marketplace-product-card";
import type { MarketplaceProduct } from "@/data/marketplace-home";

/* ─────────────────────────────────────────────
   Section Header with Light Orange Background
───────────────────────────────────────────── */
export function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between  bg-accent px-4 py-3 sm:px-5">
      <h2 className="text-lg font-semibold text-[#111827] sm:text-xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium text-accent-soft hover:underline"
        >
          View More →
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Carousel Nav Button
───────────────────────────────────────────── */
function NavButton({
  onClick,
  direction,
  disabled,
}: {
  onClick: () => void;
  direction: "prev" | "next";
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white shadow-sm transition-all hover:border-[#ea580c] hover:text-[#ea580c] disabled:cursor-not-allowed disabled:opacity-30"
      aria-label={direction === "prev" ? "Previous" : "Next"}
    >
      {direction === "prev" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Product Carousel Section
───────────────────────────────────────────── */
export function ProductCarouselSection({
  title,
  href,
  products,
  onQuickView,
  autoplay = false,
}: {
  title: string;
  href?: string;
  products: MarketplaceProduct[];
  onQuickView: (p: MarketplaceProduct) => void;
  autoplay?: boolean;
}) {
  const plugins = autoplay
    ? [Autoplay({ delay: 4000, stopOnInteraction: true })]
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, align: "start", slidesToScroll: 1 },
    plugins,
  );

  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(true);

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
        <SectionHeader title={title} href={href} />

        <div className="relative bg-white">
          {/* Navigation buttons */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex"
          >
            <NavButton
              onClick={() => {}}
              direction="prev"
              disabled={!canPrev}
            />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex"
          >
            <NavButton
              onClick={() => {}}
              direction="next"
              disabled={!canNext}
            />
          </button>

          <div className="overflow-hidden p-5" ref={emblaRef}>
            <div className="flex gap-2">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="min-w-0 shrink-0 basis-[calc(60%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5"
                >
                  <MarketplaceProductCard
                    product={product}
                    priority={index < 2}
                    onQuickView={onQuickView}
                  />
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
   Category Carousel Section (Circle images)
───────────────────────────────────────────── */
export function CategoryCarouselSection({
  categories,
}: {
  categories: Array<{ id: string; name: string; image: string; icon?: any }>;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
  });

  return (
    <section className="bg-[#f5f5f5] py-1">
      <div className="container mx-auto px-0 md:px-4 ">
        <SectionHeader title="Shop by Category" href="/categories" />

        <div className="overflow-hidden bg-white p-5 " ref={emblaRef}>
          <div className="flex gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="min-w-0 shrink-0 basis-[calc(33.33%-11px)] sm:basis-[calc(20%-12px)] md:basis-[calc(16.66%-14px)] lg:basis-[calc(12.5%-14px)]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#f3f4f6] shadow-sm transition-transform hover:scale-105 md:h-28 md:w-28">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-center text-sm font-medium text-[#111827]">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Promo Banner Grid (2 columns, image only)
───────────────────────────────────────────── */
export function PromoBannerGrid({
  banners,
}: {
  banners: Array<{ id: string; image: string; href: string }>;
}) {
  return (
    <section className="bg-[#f5f5f5] py-1">
      <div className="container mx-auto px-0 md:px-4 ">
        <div className="grid grid-cols-2 gap-4">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className="overflow-hidden rounded-[24px] transition-transform hover:scale-[1.02]"
            >
              <div className="relative aspect-[1.2/1]">
                <Image
                  src={banner.image}
                  alt="Promotional banner"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Brand Carousel (Circle only, no white rectangle)
───────────────────────────────────────────── */
export function BrandCarouselSection({
  brands,
}: {
  brands: Array<{ id: string; name: string; image: string; href: string }>;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
  });

  return (
    <section className="bg-[#f5f5f5] py-1">
      <div className="container mx-auto px-0 md:px-4 ">
        <SectionHeader title="Popular Brands" href="/brands" />

        <div className="overflow-hidden bg-white p-5 py-8 " ref={emblaRef}>
          <div className="flex gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={brand.href}
                className="min-w-0 shrink-0 basis-[calc(33.33%-11px)] sm:basis-[calc(20%-12px)] md:basis-[calc(16.66%-14px)] lg:basis-[calc(12.5%-14px)]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[#f3f4f6] shadow-sm transition-transform hover:scale-105 md:h-24 md:w-24">
                    <Image
                      src={brand.image}
                      alt={brand.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-center text-sm font-medium text-[#111827]">
                    {brand.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
