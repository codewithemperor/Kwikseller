"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PackageOpen, Star, Zap } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@heroui/react";
import { marketplaceApi, productsApi } from "@kwikseller/api-client";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SectionHeader,
  ProductCarouselSection,
  PromoBannerGrid,
  BrandCarouselSection,
} from "@/components/landing/shared/marketplace-carousel";
import type {
  MarketplaceCategory,
  MarketplaceHeroBanner,
  MarketplacePromoBanner,
  MarketplaceSeller,
  MarketplaceBrand,
  MarketplaceTrustItem,
  MarketplaceProduct,
  MarketplaceReview,
} from "@/data/marketplace-home";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import {
  ShieldCheck,
  Truck,
  BadgePercent,
  Headset,
} from "lucide-react";

/* ─── Static category icon map (emoji fallbacks) ─── */
const CATEGORY_ICONS: Record<string, string> = {
  fashion: "👗",
  electronics: "📱",
  phones: "📲",
  beauty: "💄",
  home: "🏠",
  food: "🍽️",
  automobile: "🚗",
  sports: "⚽",
  health: "💊",
  books: "📚",
  gaming: "🎮",
  kids: "🧸",
  jewelry: "💍",
  groceries: "🛒",
  default: "📦",
};

function getCategoryIcon(name: string, slug: string): string {
  const key = (slug || "").toLowerCase();
  if (CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (k !== "default" && name.toLowerCase().includes(k)) return v;
  }
  return CATEGORY_ICONS["default"] ?? "📦";
}
/* ─── Static Trust Items (UI-only) ────────────────────────── */
const TRUST_ITEMS: MarketplaceTrustItem[] = [
  { id: "escrow", title: "Escrow Protected", description: "Your money stays secure until delivery is confirmed.", icon: ShieldCheck },
  { id: "delivery", title: "Fast Delivery", description: "Reliable delivery options across major cities.", icon: Truck },
  { id: "deals", title: "Best Deals", description: "Daily discounts on trusted products and brands.", icon: BadgePercent },
  { id: "support", title: "Responsive Support", description: "Get help quickly whenever you need assistance.", icon: Headset },
];

/* ─────────────────────────────────────────────
   Hero Banner — fetches from API
───────────────────────────────────────────── */
export function MarketplaceHero() {
  const [banners, setBanners] = useState<MarketplaceHeroBanner[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [activeBanner, setActiveBanner] = React.useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, catRes] = await Promise.allSettled([
          marketplaceApi.getBanners({ type: "hero" }),
          marketplaceApi.getCategories(),
        ]);
        if (bannerRes.status === "fulfilled" && bannerRes.value.success && bannerRes.value.data) {
          const data = bannerRes.value.data as any;
          setBanners(Array.isArray(data) ? data : data.banners || []);
        }
        if (catRes.status === "fulfilled" && catRes.value.success && catRes.value.data) {
          const data = catRes.value.data as any;
          setCategories(Array.isArray(data) ? data : data.categories || []);
        }
      } catch {
        // Show empty hero when API unavailable
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    if (banners.length === 0) return;
    const id = setInterval(
      () => setActiveBanner((c) => (c + 1) % banners.length),
      5000,
    );
    return () => clearInterval(id);
  }, [banners.length]);

  return (
    <section className="border-b border-kwik-border bg-kwik-bg-page py-4">
      <div className="container mx-auto grid gap-4 px-4 lg:grid-cols-[250px_1fr_280px]">
        {/* Category sidebar */}
        <aside className="hidden rounded-[20px] bg-background p-4 shadow-sm lg:block max-h-[340px] overflow-y-auto scrollbar-thin">
          <div className="space-y-0.5">
            {categories.length > 0 ? (
              categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    const slug = category.slug || category.id;
                    window.location.href = `/categories?name=${slug}`;
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-kwik-dark-medium transition-all duration-200 hover:bg-kwik-orange-tint hover:text-kwik-orange hover:translate-x-1 active:scale-[0.98] active:bg-kwik-orange/10"
                >
                  {/* Active dot indicator */}
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-kwik-orange/50 transition-colors duration-200" />
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kwik-bg-surface dark:bg-kwik-bg-light text-base shrink-0">
                    {getCategoryIcon(category.name, category.slug || category.id)}
                  </span>
                  <span className="flex-1 truncate">{category.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-kwik-muted opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-kwik-muted">No categories yet</p>
              </div>
            )}
          </div>
        </aside>

        {/* Banner carousel */}
        <div className="space-y-3">
          <div className="hidden overflow-hidden rounded-[24px] bg-kwik-orange shadow-sm md:block">
            <div className="relative aspect-[2.25/1]">
              {banners.length > 0 ? (
                banners.map((banner, index) => (
                  <Link
                    key={banner.id}
                    href={banner.href}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === activeBanner
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0"
                    }`}
                  >
                    <AppImage
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/25" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="rounded-full bg-background/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                      >
                        {banner.badge}
                      </motion.span>
                      <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-3 max-w-xl text-3xl font-bold leading-tight"
                      >
                        {banner.title}
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mt-2 max-w-lg text-sm text-white/85"
                      >
                        {banner.subtitle}
                      </motion.p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-kwik-bg-light">
                  <EmptyState
                    icon={<PackageOpen className="h-10 w-10" />}
                    title="No promotions yet"
                    description="Check back soon for exciting deals and offers."
                  />
                </div>
              )}
              {banners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveBanner((c) =>
                        c === 0 ? banners.length - 1 : c - 1,
                      )
                    }
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-kwik-dark"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveBanner(
                        (c) => (c + 1) % banners.length,
                      )
                    }
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-kwik-dark"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {banners.map((banner, index) => (
                      <button
                        key={banner.id}
                        type="button"
                        onClick={() => setActiveBanner(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${index === activeBanner ? "w-8 bg-kwik-orange shadow-lg shadow-kwik-orange/30" : "w-2.5 bg-background/45 hover:bg-background/65"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile horizontal scroll banners */}
          <div className="md:hidden">
            {banners.length > 0 ? (
              <div className="grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto pb-1 min-[420px]:auto-cols-[56%] min-[540px]:auto-cols-[32%]">
                {banners.map((banner) => (
                  <Link
                    key={banner.id}
                    href={banner.href}
                    className="relative overflow-hidden rounded-[22px] bg-kwik-orange shadow-sm"
                  >
                    <div className="relative aspect-[1.3/1]">
                      <AppImage
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <span className="rounded-full bg-background/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
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
            ) : (
              <div className="flex h-48 items-center justify-center bg-kwik-bg-light rounded-[22px]">
                <p className="text-sm text-kwik-muted">No promotions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Seller CTA panel */}
        <div className="hidden space-y-3 lg:block">
          <div className="relative rounded-[24px] bg-background p-5 shadow-sm overflow-hidden">
            {/* Animated dashed border overlay */}
            <div className="absolute inset-0 rounded-[24px] border-2 border-dashed border-kwik-border pointer-events-none" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-kwik-orange relative z-10">
              Become a seller
            </p>
            <h2 className="mt-2 text-lg font-bold text-kwik-dark">
              Create a store and start selling
            </h2>
            <p className="mt-2 text-xs leading-6 text-kwik-gray-light">
              Reach more buyers with a storefront that follows a familiar
              marketplace experience.
            </p>
            <Link href="/register?role=VENDOR" className="mt-4 inline-flex">
              <Button
                variant="primary"
                className="relative h-11 rounded-xl bg-kwik-orange px-5 font-semibold text-white hover:bg-kwik-orange-hover overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Start selling
                </span>
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Trust Bar (static UI)
───────────────────────────────────────────── */
export function MarketplaceTrustBar() {
  return (
    <section className="bg-kwik-bg-page">
      <div className="container mx-auto grid gap-3 px-4 py-5 md:grid-cols-2 xl:grid-cols-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-kwik-border bg-background p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kwik-orange-tint text-kwik-orange">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-kwik-dark">
                  {item.title}
                </p>
                <p className="text-xs leading-5 text-kwik-gray-light">
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
   Category Section — fetches from API
───────────────────────────────────────────── */
export function MarketplaceCategorySection() {
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await marketplaceApi.getCategories();
        if (response.success && response.data) {
          const data = response.data as any;
          const cats = Array.isArray(data) ? data : data.categories || [];
          setCategories(cats.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug || c.id,
            itemCount: c.productCount ? `${c.productCount}+ items` : "",
            description: c.description || "",
            image: c.image || c.imageUrl || null,
          })));
        }
      } catch {
        // Empty state handled below
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <section className="bg-kwik-bg-page py-8">
        <div className="container mx-auto px-0 md:px-4">
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="bg-kwik-bg-page py-8">
        <div className="container mx-auto px-0 md:px-4">
          <SectionHeader title="Shop by Category" href="/categories" />
          <EmptyState
            icon={<PackageOpen className="h-8 w-8" />}
            title="No categories yet"
            description="Categories will appear here once sellers list products."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-kwik-bg-page py-1">
      <div className="container mx-auto px-0 md:px-4">
        <SectionHeader title="Shop by Category" href="/categories" />
        <div className="relative bg-background overflow-hidden" style={{ maxHeight: '340px' }}>
          <div className="overflow-y-auto overscroll-contain p-3 md:p-4" style={{ maxHeight: '340px' }}>
            <div className="flex gap-3 md:gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories?name=${category.slug || category.id}`}
                  className="group min-w-0 shrink-0"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full bg-kwik-bg-light shadow-sm transition-transform group-hover:scale-105 md:h-20 md:w-20">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 64px, 80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          {getCategoryIcon(category.name, category.slug || category.id)}
                        </div>
                      )}
                    </div>
                    <span className="max-w-[72px] text-center text-xs font-medium leading-tight text-kwik-dark truncate">
                      {category.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Promo Banners — fetches from API
───────────────────────────────────────────── */
export function MarketplacePromoBannersSection() {
  const [banners, setBanners] = useState<MarketplacePromoBanner[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await marketplaceApi.getBanners({ type: "promo" });
        if (response.success && response.data) {
          const data = response.data as any;
          const list = Array.isArray(data) ? data : data.banners || [];
          setBanners(list.map((b: any) => ({
            id: b.id,
            title: b.title || "",
            subtitle: b.subtitle || "",
            href: b.href || b.link || "#",
            image: b.image || b.imageUrl || null,
          })));
        }
      } catch {
        // Silently fail
      }
    };
    fetch();
  }, []);

  if (banners.length === 0) return null;

  const bannersForCarousel = banners.map((banner) => ({
    id: banner.id,
    image: banner.image,
    href: banner.href,
  }));

  return <PromoBannerGrid banners={bannersForCarousel} />;
}

/* ─────────────────────────────────────────────
   Top Sellers — fetches from API
───────────────────────────────────────────── */
export function MarketplaceTopSellersSection() {
  const [sellers, setSellers] = useState<MarketplaceSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await marketplaceApi.getSellers({ limit: 10 });
        if (response.success && response.data) {
          const data = response.data as any;
          const list = Array.isArray(data) ? data : data.sellers || [];
          setSellers(list.map((s: any) => ({
            id: s.id,
            name: s.name || s.storeName || "",
            tagline: s.tagline || s.description || "",
            image: s.image || s.bannerUrl || s.coverUrl || null,
            logo: s.logo || s.logoUrl || null,
            location: s.location || "",
            rating: s.rating || 0,
            productCount: s.productCount ? `${s.productCount} products` : "0 products",
          })));
        }
      } catch {
        // Empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

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

  if (isLoading) {
    return (
      <section className="bg-kwik-bg-page py-1">
        <div className="container mx-auto px-0 md:px-4">
          <SectionHeader title="Top Sellers" href="/vendors" />
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (sellers.length === 0) return null;

  return (
    <section className="bg-kwik-bg-page py-1">
      <div className="container mx-auto px-0 md:px-4">
        <SectionHeader title="Top Sellers" href="/vendors" />
        <div className="relative bg-background p-5 py-8">
          <div
            role="button"
            tabIndex={0}
            onClick={() => emblaApi?.scrollPrev()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emblaApi?.scrollPrev(); } }}
            className={`absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex cursor-pointer ${!canPrev ? 'opacity-30 pointer-events-none' : ''}`}
            aria-label="Previous"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-kwik-border bg-background shadow-sm transition-all hover:border-kwik-orange">
              <ChevronLeft className="h-4 w-4" />
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => emblaApi?.scrollNext()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emblaApi?.scrollNext(); } }}
            className={`absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex cursor-pointer ${!canNext ? 'opacity-30 pointer-events-none' : ''}`}
            aria-label="Next"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-kwik-border bg-background shadow-sm transition-all hover:border-kwik-orange">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {sellers.map((seller) => (
                <div
                  key={seller.id}
                  className="min-w-0 shrink-0 basis-[calc(100%-16px)] sm:basis-[calc(50%-8px)] lg:basis-[calc(33.333%-11px)]"
                >
                  <Link
                    href={`/vendors?seller=${seller.id}`}
                    className="group block overflow-hidden rounded-[22px] bg-background shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[2.6/1] overflow-hidden">
                      <AppImage
                        src={seller.image}
                        alt={seller.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute right-3 top-3 max-w-[55%] rounded-xl bg-background/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                        <p className="line-clamp-2 text-xs font-semibold leading-tight text-kwik-dark">
                          Looking For The Newest {seller.tagline}?
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-kwik-border bg-background shadow-sm">
                        <AppImage
                          src={seller.logo}
                          alt={seller.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-base font-semibold text-kwik-dark">
                        {seller.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-kwik-border border-t border-kwik-border">
                      <div className="flex flex-col items-center py-3">
                        <p className="text-lg font-bold text-kwik-dark">
                          {seller.rating ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-kwik-star text-kwik-star" />
                              {seller.rating.toFixed(1)}
                            </span>
                          ) : (
                            "0"
                          )}
                        </p>
                        <p className="text-xs text-kwik-muted">Reviews</p>
                      </div>
                      <div className="flex flex-col items-center py-3">
                        <p className="text-lg font-bold text-kwik-dark">
                          {seller.productCount?.replace(/\D/g, "") ?? "0"}
                        </p>
                        <p className="text-xs text-kwik-muted">Products</p>
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
   Brands Section — fetches from API
───────────────────────────────────────────── */
export function MarketplaceBrandsSection() {
  const [brands, setBrands] = useState<MarketplaceBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await marketplaceApi.getBrands();
        if (response.success && response.data) {
          const data = response.data as any;
          const list = Array.isArray(data) ? data : data.brands || [];
          setBrands(list.map((b: any) => ({
            id: b.id,
            name: b.name || "",
            image: b.image || b.logo || b.logoUrl || null,
            href: b.href || `/brands/${b.slug || b.id}`,
          })));
        }
      } catch {
        // Empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <section className="bg-kwik-bg-page py-8">
        <div className="container mx-auto px-0 md:px-4">
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  const brandsForCarousel = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    image: brand.image,
    href: brand.href,
  }));

  return <BrandCarouselSection brands={brandsForCarousel} />;
}

/* ─────────────────────────────────────────────
   Reviews Section — fetches from API
───────────────────────────────────────────── */
export function MarketplaceReviewsSection() {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [emblaRef] = useEmblaCarousel({ loop: false, align: "start" });

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await productsApi.list({ limit: 1, sortBy: "rating", sortOrder: "desc" });
        if (response.success && response.data) {
          // If the API returns reviews data, use it; otherwise skip section
          const data = response.data as any;
          if (data.reviews && Array.isArray(data.reviews)) {
            setReviews(data.reviews);
          }
        }
      } catch {
        // No reviews available
      }
    };
    fetch();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="bg-kwik-bg-page py-5">
      <div className="container mx-auto px-0 md:px-4">
        <SectionHeader title="Customer Reviews" href="#" />
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="min-w-0 shrink-0 basis-[calc(100%-16px)] sm:basis-[calc(50%-8px)] lg:basis-[calc(33.333%-11px)]"
              >
                <article className="rounded-[22px] bg-background p-5 shadow-sm ring-1 ring-border">
                  <div className="mb-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "fill-kwik-star text-kwik-star" : "text-kwik-border-light"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-kwik-gray">
                    {review.text}
                  </p>
                  <div className="mt-4 border-t border-kwik-border pt-4">
                    <p className="font-semibold text-kwik-dark">
                      {review.name}
                    </p>
                    <p className="text-sm text-kwik-gray-light">{review.location}</p>
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
   Featured Products — fetches from API
───────────────────────────────────────────── */
export function MarketplaceFeaturedProductsSection({
  onQuickView,
}: {
  onQuickView: (p: MarketplaceProduct) => void;
}) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await productsApi.list({ limit: 8, status: "ACTIVE" });
        if (response.success && response.data) {
          const data = response.data as any;
          const list = Array.isArray(data) ? data : data.products || [];
          setProducts(list.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.image || (typeof p.images?.[0] === "object" ? p.images[0].url : p.images?.[0]) || (typeof p.featuredImage === "object" ? p.featuredImage.url : p.featuredImage) || null,
            rating: p.averageRating || p.rating || 0,
            reviewCount: p.reviewCount || 0,
            store: p.store?.name || p.storeName || "",
            category: p.category?.name || p.categoryName || "",
            isNew: p.isNew || false,
          })));
        }
      } catch {
        // Empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <section className="bg-kwik-bg-page py-8">
        <div className="container mx-auto px-0 md:px-4">
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <ProductCarouselSection
      title="Featured Products"
      href="/search"
      products={products}
      onQuickView={onQuickView}
    />
  );
}

/* ─────────────────────────────────────────────
   Featured Deals — fetches from API
───────────────────────────────────────────── */
export function MarketplaceFeaturedDealsSection({
  onQuickView,
}: {
  onQuickView: (p: MarketplaceProduct) => void;
}) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await productsApi.getDeals({ limit: 8 });
        if (response.success && response.data) {
          const data = response.data as any;
          const list = Array.isArray(data) ? data : data.deals || [];
          setProducts(list.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.image || (typeof p.images?.[0] === "object" ? p.images[0].url : p.images?.[0]) || (typeof p.featuredImage === "object" ? p.featuredImage.url : p.featuredImage) || null,
            rating: p.averageRating || p.rating || 0,
            reviewCount: p.reviewCount || 0,
            store: p.store?.name || p.storeName || "",
            category: p.category?.name || p.categoryName || "",
            isNew: p.isNew || false,
          })));
        }
      } catch {
        // Empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <section className="bg-kwik-bg-page py-8">
        <div className="container mx-auto px-0 md:px-4">
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <ProductCarouselSection
      title="Featured Deals"
      href="/search?q=deals"
      products={products}
      onQuickView={onQuickView}
      autoplay
    />
  );
}

/* ─────────────────────────────────────────────
   Seller CTA (static UI)
───────────────────────────────────────────── */
export function MarketplaceSellerCta() {
  return (
    <section className="bg-kwik-bg-page py-5 pb-12">
      <div className="container mx-auto px-0 md:px-4">
        <div className="overflow-hidden rounded-[28px] bg-background shadow-sm lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-kwik-orange">
              Sell on Kwikseller
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-kwik-dark">
              Build a storefront with a familiar marketplace experience
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-kwik-gray-light">
              List products, reach buyers and manage your store with a cleaner
              buying experience inspired by established e-commerce layouts.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=VENDOR" className="inline-flex">
                <Button
                  variant="primary"
                  className="h-11 rounded-xl bg-kwik-orange px-5 font-semibold text-white hover:bg-kwik-orange-hover"
                >
                  Create vendor account
                </Button>
              </Link>
              <Link href="/vendors" className="inline-flex">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-kwik-border-light px-5 font-semibold text-kwik-dark"
                >
                  View top sellers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
