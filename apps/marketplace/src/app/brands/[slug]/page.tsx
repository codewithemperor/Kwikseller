"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Home,
  Package,
  Sparkles,
  Star,
} from "lucide-react";
import {
  useBrands,
  useProducts,
} from "@/lib/api-hooks";
import type { Brand } from "@/lib/api";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import {
  BrandInfoCard,
  BrandStatsStrip,
  type BrandEnrichment,
} from "@/components/brand/brand-info-card";
import { kwikToast } from "@kwikseller/utils";

// ─── Sort options ──────────────────────────────────────────────────────────

type SortOption = "newest" | "price-asc" | "price-desc" | "rating";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" },
];

function sortProducts(
  products: MarketplaceProduct[],
  sort: SortOption,
): MarketplaceProduct[] {
  const copy = products.slice();
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "newest":
    default:
      // The API already returns newest first; preserve that order.
      return copy;
  }
}

// ─── Brand detail page ─────────────────────────────────────────────────────

export default function BrandDetailPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const brandsQuery = useBrands();
  const brands = brandsQuery.data ?? [];

  const brand: Brand | undefined = useMemo(() => {
    if (!slug) return undefined;
    return brands.find(
      (b) => b.slug === slug || b.id === slug,
    );
  }, [brands, slug]);

  // Fetch products for this brand. The dummy / real API filter is
  // `p.brandId === brandId || p.brand.slug === brandId` so either id or slug
  // works — we pass the brand id when we have it.
  const productsQuery = useProducts({
    brandId: brand?.id,
    limit: 50,
  });

  const [sort, setSort] = useState<SortOption>("newest");
  const [isFollowing, setIsFollowing] = useState(false);

  const allProducts = useMemo(
    () => productsQuery.data?.products ?? [],
    [productsQuery.data],
  );

  const sortedProducts = useMemo(
    () => sortProducts(allProducts, sort),
    [allProducts, sort],
  );

  const featuredProducts = useMemo(
    () => allProducts.filter((p) => p.isFeatured).slice(0, 8),
    [allProducts],
  );

  const brandEnrichment: BrandEnrichment | undefined = useMemo(() => {
    if (!brand) return undefined;
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      story: brand.story,
      tagline: brand.tagline,
      foundedYear: brand.foundedYear,
      country: brand.country,
      headquarters: brand.headquarters,
      website: brand.website,
      rating: brand.rating,
      reviewCount: brand.reviewCount,
      totalSales: brand.totalSales,
      followCount: brand.followCount,
      verified: brand.verified,
      badges: brand.badges,
      categories: brand.categories,
      socialLinks: brand.socialLinks,
    };
  }, [brand]);

  // ─── Loading: brands list still resolving ──────────────────────────────
  if (brandsQuery.isLoading) {
    return (
      <main className="min-h-screen bg-kwik-bg-page">
        <BrandDetailSkeleton />
      </main>
    );
  }

  // ─── Brand not found ───────────────────────────────────────────────────
  if (!brand) {
    return (
      <main className="min-h-screen bg-kwik-bg-page px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Breadcrumb slug={slug} brandName={undefined} />
          <EmptyState
            variant="error"
            icon={<BadgeCheck className="h-12 w-12" />}
            title="Brand not found"
            description={
              slug
                ? `We couldn't find a brand matching "${slug}". It may have been removed or never existed.`
                : "We couldn't find this brand. Browse all brands to discover something new."
            }
            action={
              <Link
                href="/brands"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
              >
                Browse all brands
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const productCount = brand._count?.products ?? sortedProducts.length;
  const hasCover = Boolean(brand.coverImage);

  return (
    <main className="min-h-screen bg-kwik-bg-page">
      {/* Breadcrumb */}
      <div className="border-b border-kwik-border-light bg-kwik-bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb slug={slug} brandName={brand.name} />
        </div>
      </div>

      {/* Brand hero — cover image with logo + name overlay */}
      <section className="relative border-b border-kwik-border-light bg-kwik-bg-surface">
        {/* Cover image */}
        {hasCover && (
          <div className="absolute inset-0 overflow-hidden">
            <AppImage
              src={brand.coverImage}
              alt=""
              fallbackVariant="product"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-kwik-bg-surface via-kwik-bg-surface/70 to-kwik-bg-surface/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-kwik-bg-surface/80 via-transparent to-transparent" />
          </div>
        )}
        {/* Decorative orbs when no cover */}
        {!hasCover && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-kwik-orange/10 blur-3xl" />
            <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-kwik-amber/10 blur-3xl" />
          </div>
        )}

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex items-end gap-5">
              {/* Logo */}
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-kwik-bg-surface ring-4 ring-kwik-bg-surface shadow-lg sm:h-28 sm:w-28">
                <AppImage
                  src={brand.image}
                  alt={brand.name}
                  className="h-full w-full"
                  fallbackVariant="product"
                />
              </div>
              {/* Title block */}
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-kwik-dark sm:text-4xl">
                    {brand.name}
                  </h1>
                  {brand.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-kwik-green-tint px-2.5 py-0.5 text-xs font-semibold text-kwik-green">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                {brand.tagline && (
                  <p className="mt-1 max-w-md text-sm text-kwik-muted">
                    {brand.tagline}
                  </p>
                )}
                <p className="mt-1 text-xs text-kwik-muted">
                  {productCount} product{productCount === 1 ? "" : "s"} available
                  {brand.country ? ` · ${brand.country}` : ""}
                </p>
              </div>
            </div>

            {/* Follow CTA */}
            <button
              type="button"
              onClick={() => {
                setIsFollowing((v) => !v);
                kwikToast.success(
                  isFollowing ? `Unfollowed ${brand.name}` : `Following ${brand.name}`,
                  {
                    description: isFollowing
                      ? "You'll no longer see new drops in your feed."
                      : "You'll see new drops in your feed.",
                  },
                );
              }}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-kwik-gradient px-5 text-sm font-semibold text-white transition hover:opacity-90 sm:self-auto"
            >
              <Star className={isFollowing ? "h-4 w-4 fill-current" : "h-4 w-4"} />
              {isFollowing ? "Following" : "Follow brand"}
            </button>
          </motion.div>

          {/* Stats strip */}
          {brandEnrichment && <BrandStatsStrip brand={brandEnrichment} />}
        </div>
      </section>

      {/* Body: 2-column layout on lg — info card sidebar + products grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Sidebar: brand info card (sticky on desktop) */}
          {brandEnrichment && (
            <div className="lg:sticky lg:top-6 lg:self-start">
              <BrandInfoCard
                brand={brandEnrichment}
                isFollowing={isFollowing}
                onToggleFollow={() => setIsFollowing((v) => !v)}
              />
            </div>
          )}

          {/* Products column */}
          <div className="min-w-0">
            {/* Featured products carousel (only when there are featured ones) */}
            {featuredProducts.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-kwik-orange" />
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Featured from {brand.name}
                  </h2>
                </div>
                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]">
                  {featuredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="w-44 shrink-0 sm:w-52"
                    >
                      <MarketplaceProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sort + count bar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-kwik-muted">
                Showing{" "}
                <span className="font-semibold text-kwik-dark">
                  {sortedProducts.length}
                </span>{" "}
                product{sortedProducts.length === 1 ? "" : "s"} from {brand.name}
              </p>
              <label className="flex items-center gap-2 text-sm text-kwik-muted">
                <span className="font-medium">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="h-10 rounded-xl border border-kwik-border-light bg-kwik-bg-surface px-3 text-sm font-medium text-kwik-dark outline-none transition-colors focus:border-kwik-orange dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* States: loading / error / empty / grid */}
            {productsQuery.isLoading ? (
              <ProductGridSkeleton count={10} columns={4} />
            ) : productsQuery.isError ? (
              <EmptyState
                variant="error"
                icon={<Package className="h-12 w-12" />}
                title="Couldn't load products"
                description="Something went wrong while fetching products from this brand. Please try again."
                action={
                  <button
                    type="button"
                    onClick={() => productsQuery.refetch()}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
                  >
                    Retry
                  </button>
                }
              />
            ) : sortedProducts.length === 0 ? (
              <EmptyState
                icon={<Package className="h-12 w-12" />}
                title="No products from this brand yet"
                description={`${brand.name} hasn't listed any products yet. Check back soon or explore the full marketplace.`}
                action={
                  <Link
                    href="/products"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
                  >
                    Browse all products
                  </Link>
                }
              />
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
              >
                {sortedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
                    }}
                  >
                    <MarketplaceProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Back to all brands */}
            <div className="mt-10 flex justify-center">
              <Link
                href="/brands"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-kwik-border-light bg-kwik-bg-surface px-5 text-sm font-semibold text-kwik-dark transition-colors hover:border-kwik-orange hover:text-kwik-orange"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all brands
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────

function Breadcrumb({
  slug,
  brandName,
}: {
  slug?: string;
  brandName?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm text-kwik-muted"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 transition-colors hover:text-kwik-orange"
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-kwik-muted" />
      <Link
        href="/brands"
        className="transition-colors hover:text-kwik-orange"
      >
        Brands
      </Link>
      {brandName ? (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-kwik-muted" />
          <span className="font-medium text-kwik-dark">{brandName}</span>
        </>
      ) : slug ? (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-kwik-muted" />
          <span className="font-medium text-kwik-dark">{slug}</span>
        </>
      ) : null}
    </nav>
  );
}

// ─── Skeleton (brands list loading) ────────────────────────────────────────

function BrandDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-4 w-48 animate-pulse rounded bg-kwik-bg-surface" />
      <div className="mt-6 flex items-center gap-5">
        <div className="h-24 w-24 animate-pulse rounded-3xl bg-kwik-bg-surface" />
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-kwik-bg-surface" />
          <div className="h-4 w-32 animate-pulse rounded bg-kwik-bg-surface" />
        </div>
      </div>
      <div className="mt-8 h-10 w-full animate-pulse rounded-xl bg-kwik-bg-surface" />
      <ProductGridSkeleton count={10} columns={4} className="mt-6" />
    </div>
  );
}
