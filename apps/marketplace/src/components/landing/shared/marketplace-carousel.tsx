"use client";

/**
 * marketplace-carousel.tsx
 * Reusable carousel components for marketplace sections
 */

import React, { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MarketplaceProductCard } from "./marketplace-product-card";
import type { MarketplaceProduct } from "@/data/marketplace-home";

/* ─── Stagger animation helpers ──────────────────────────── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function StaggerWrap({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={staggerContainer}>
      {children}
    </motion.div>
  );
}

function StaggerChild({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={staggerItem} className={className}>{children}</motion.div>;
}

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
    <div className="flex items-center justify-between bg-accent px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3">
        <div className="h-7 w-[3px] rounded-full bg-kwik-orange" />
        <h2 className="text-lg font-bold text-kwik-dark sm:text-xl md:text-2xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm font-semibold text-accent-foreground hover:text-kwik-orange transition-colors duration-200 hover:underline underline-offset-4"
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
      className="flex h-8 w-8 items-center justify-center rounded-full border border-kwik-border bg-background shadow-sm transition-all hover:border-kwik-orange hover:text-kwik-orange disabled:cursor-not-allowed disabled:opacity-30"
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
    <section className="bg-kwik-bg-page py-1">
      <div className="container mx-auto px-0 md:px-4 ">
        <SectionHeader title={title} href={href} />

        <div className="relative bg-background">
          {/* Navigation buttons */}
          <div className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex">
            <NavButton
              onClick={() => emblaApi?.scrollPrev()}
              direction="prev"
              disabled={!canPrev}
            />
          </div>
          <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex">
            <NavButton
              onClick={() => emblaApi?.scrollNext()}
              direction="next"
              disabled={!canNext}
            />
          </div>

          <div className="overflow-hidden p-5" ref={emblaRef}>
              <StaggerWrap>
                <div className="flex gap-2">
                  {products.map((product, index) => (
                    <StaggerChild key={product.id} className="min-w-0 shrink-0 basis-[calc(60%-8px)] sm:basis-[calc(33.33%-11px)] lg:basis-[calc(25%-12px)] xl:basis-[calc(20%-13px)] p-0.5">
                      <MarketplaceProductCard
                        product={product}
                        priority={index < 2}
                        onQuickView={onQuickView}
                      />
                    </StaggerChild>
                  ))}
                </div>
              </StaggerWrap>
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
  categories: Array<{ id: string; name: string; image: string; slug?: string; icon?: any }>;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
  });

  return (
    <section className="bg-kwik-bg-page py-1">
      <div className="container mx-auto px-0 md:px-4 ">
        <SectionHeader title="Shop by Category" href="/categories" />

        <div className="overflow-hidden bg-background p-5 " ref={emblaRef}>
          <StaggerWrap>
            <div className="flex gap-4">
              {categories.map((category) => (
                <StaggerChild key={category.id} className="min-w-0 shrink-0 basis-[calc(33.33%-11px)] sm:basis-[calc(20%-12px)] md:basis-[calc(16.66%-14px)] lg:basis-[calc(12.5%-14px)]">
                  <Link href={`/categories/${category.slug || category.id}`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-kwik-bg-light shadow-sm transition-transform hover:scale-105 md:h-28 md:w-28">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 96px, 112px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-center text-sm font-medium text-kwik-dark">
                        {category.name}
                      </span>
                    </div>
                  </Link>
                </StaggerChild>
              ))}
            </div>
          </StaggerWrap>
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
    <section className="bg-kwik-bg-page py-1">
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
                  sizes="(max-width: 768px) 50vw, 400px"
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
    <section className="bg-kwik-bg-page py-1">
      <div className="container mx-auto px-0 md:px-4 ">
        <SectionHeader title="Popular Brands" href="/brands" />

        <div className="overflow-hidden bg-background p-5 py-8 " ref={emblaRef}>
          <div className="flex gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={brand.href}
                className="min-w-0 shrink-0 basis-[calc(33.33%-11px)] sm:basis-[calc(20%-12px)] md:basis-[calc(16.66%-14px)] lg:basis-[calc(12.5%-14px)]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full bg-kwik-bg-light shadow-sm transition-transform hover:scale-105 md:h-24 md:w-24">
                    <Image
                      src={brand.image}
                      alt={brand.name}
                      fill
                      sizes="(max-width: 768px) 80px, 96px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-center text-sm font-medium text-kwik-dark">
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
