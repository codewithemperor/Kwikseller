"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Heart,
  Package,
  RotateCcw,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Zap,
  Settings2,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { kwikToast } from "@/lib/toast";
import {
  useCartStore,
  useWishlistStore,
  useRecentlyViewedStore,
  usePriceDropStore,
} from "@/stores";
import { AppImage } from "@/components/ui/app-image";
import {
  ProductGallery,
  PriceDisplay,
  RatingDisplay,
  StockBadge,
  QuantitySelector,
  VendorSummary,
  ReviewSummary,
  ReviewList,
  ReviewForm,
  RelatedProducts,
  formatCurrency,
  hasHtmlMarkup,
  getStockStatus,
} from "@/components/product/shared";
import { ProductVariantSelector } from "@/components/product/product-variant-selector";
import { useReviews, useReviewSummary } from "@/lib/api-hooks";
import type { MarketplaceProduct, ProductVariant } from "@/data/marketplace-home";
import { PhotoLightbox } from "@/components/modals/photo-lightbox";

/* ─── Product Description (renders HTML or plain text) ─── */
function ProductDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = React.useState(false);

  // Strip HTML for the compact preview
  const plainText = React.useMemo(() => {
    if (!hasHtmlMarkup(description)) return description;
    return description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }, [description]);

  const fullContentClassName =
    "text-sm leading-6 text-kwik-gray dark:text-white/65 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-kwik-dark [&_h1]:dark:text-white [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-kwik-dark [&_h2]:dark:text-white [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-kwik-dark [&_h3]:dark:text-white [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-kwik-dark [&_strong]:dark:text-white";

  return (
    <div>
      {expanded ? (
        hasHtmlMarkup(description) ? (
          <div className={fullContentClassName} dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          <p className={fullContentClassName}>{description}</p>
        )
      ) : (
        <p className="text-sm leading-6 text-kwik-gray dark:text-white/65 line-clamp-3">
          {plainText}
        </p>
      )}
      {plainText.length > 120 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-semibold text-kwik-orange hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/* ─── Entrance animation wrapper ─── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Delivery Estimate Widget (no gradients) ─── */
function DeliveryEstimateWidget({ stock }: { stock: number }) {
  const today = new Date();
  const standardDelivery = new Date(today);
  standardDelivery.setDate(standardDelivery.getDate() + 4);
  const expressDelivery = new Date(today);
  expressDelivery.setDate(expressDelivery.getDate() + 1);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });

  const stockStatus = getStockStatus(stock);

  return (
    <div className="rounded-xl border border-border p-4 dark:border-white/10">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kwik-orange/10">
          <Truck className="h-4 w-4 text-kwik-orange" />
        </div>
        <h3 className="text-sm font-semibold text-kwik-dark dark:text-white">Delivery Options</h3>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between rounded-lg bg-kwik-bg-surface px-3 py-2.5 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <Package className="h-4 w-4 text-kwik-muted dark:text-white/55" />
            <div>
              <p className="text-sm font-medium text-kwik-dark dark:text-white">Standard Delivery</p>
              <p className="text-xs text-kwik-muted dark:text-white/55">3-5 business days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">FREE</p>
            <p className="text-xs text-kwik-muted dark:text-white/55">{formatDate(standardDelivery)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-kwik-bg-surface px-3 py-2.5 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-kwik-orange" />
            <div>
              <p className="text-sm font-medium text-kwik-dark dark:text-white">Express Delivery</p>
              <p className="text-xs text-kwik-muted dark:text-white/55">1-2 business days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-kwik-orange">₦2,500</p>
            <p className="text-xs text-kwik-muted dark:text-white/55">{formatDate(expressDelivery)}</p>
          </div>
        </div>

        {stockStatus === "LOW_STOCK" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Only {stock} left — order soon for faster delivery
          </div>
        )}
        {stockStatus === "OUT_OF_STOCK" && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Currently out of stock — check back soon
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page-level detail section (divider, NOT a nested white card — spec #10) ───
    Follows the Marketplace Home section treatment: a clear header with icon,
    separated from the next section by a subtle top border. No card-in-card. */
function DetailSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-6 dark:border-white/10">
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kwik-orange/10">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-kwik-dark dark:text-white sm:text-xl">{title}</h2>
          {description && (
            <p className="text-xs text-kwik-muted dark:text-white/55">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/* ─── Main Product Detail Page ─── */
export function ProductDetailPage({
  product,
  relatedProducts: relatedProductsProp = [],
  vendorProducts = [],
  recommendedProducts = [],
}: {
  product: MarketplaceProduct;
  relatedProducts?: MarketplaceProduct[];
  vendorProducts?: MarketplaceProduct[];
  recommendedProducts?: MarketplaceProduct[];
}) {
  const router = useRouter();

  // ─── Gallery ───
  const gallery = React.useMemo(
    () => (product.images?.length ? product.images : [product.image]),
    [product.images, product.image],
  );

  // ─── State ───
  const [quantity, setQuantity] = React.useState(1);
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(
    product.variants?.[0] ?? null,
  );
  const [variantPrice, setVariantPrice] = React.useState(product.price);

  // ─── Reviews (API-backed, unified — spec #9, #12) ───
  const reviewsQuery = useReviews(product.id);
  const reviews = reviewsQuery.data ?? [];
  const summaryQuery = useReviewSummary(product.id);
  const reviewSummary = summaryQuery.data;

  // ─── Review filter / sort / helpful-vote state ───
  type SortKey = "helpful" | "recent" | "rating";
  const [filterStar, setFilterStar] = React.useState<number | null>(null);
  const [sortBy, setSortBy] = React.useState<SortKey>("helpful");
  const [votedReviews, setVotedReviews] = React.useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = React.useState<{ src: string; alt: string } | null>(null);

  const VOTES_KEY = `kwik:review-votes:${product.id}`;

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(VOTES_KEY);
      setVotedReviews(raw ? new Set(JSON.parse(raw) as string[]) : new Set());
    } catch {
      setVotedReviews(new Set());
    }
    setFilterStar(null);
  }, [VOTES_KEY]);

  React.useEffect(() => {
    try {
      const arr = Array.from(votedReviews);
      if (arr.length) localStorage.setItem(VOTES_KEY, JSON.stringify(arr));
      else localStorage.removeItem(VOTES_KEY);
    } catch {
      // ignore
    }
  }, [votedReviews, VOTES_KEY]);

  const visibleReviews = React.useMemo(() => {
    let list = reviews;
    if (filterStar !== null) list = list.filter((r) => r.rating === filterStar);
    const sorted = [...list];
    if (sortBy === "recent") {
      sorted.sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      });
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else {
      sorted.sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0));
    }
    return sorted;
  }, [reviews, filterStar, sortBy]);

  const handleHelpfulVote = React.useCallback((reviewId: string) => {
    setVotedReviews((prev) => {
      if (prev.has(reviewId)) return prev;
      const next = new Set(prev);
      next.add(reviewId);
      return next;
    });
  }, []);

  // ─── Store hooks ───
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const checkPriceDrop = usePriceDropStore((s) => s.checkPriceDrop);

  const isWishlisted = isInWishlist(product.id);

  // ─── Derived values ───
  const effectiveStock = selectedVariant?.stock ?? product.stock ?? 0;
  const stockStatus = getStockStatus(effectiveStock);
  const isOutOfStock = stockStatus === "OUT_OF_STOCK" || stockStatus === "UNAVAILABLE";
  const hasSavings = Boolean(product.comparePrice && product.comparePrice > variantPrice);
  const savingsAmount = hasSavings ? Number(product.comparePrice) - variantPrice : 0;
  const savingsPercent = hasSavings && product.comparePrice
    ? Math.round((savingsAmount / Number(product.comparePrice)) * 100)
    : 0;

  // Average rating: prefer the API summary, fall back to product.rating
  const averageRating = reviewSummary?.average ?? product.rating;
  const totalReviews = reviewSummary?.total ?? product.reviewCount;
  const distribution = reviewSummary?.distribution ?? {};

  // ─── Track recently viewed + price drop on mount ───
  React.useEffect(() => {
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
    });
  }, [product, addRecentlyViewed]);

  React.useEffect(() => {
    const alert = checkPriceDrop(product.id, product.name, product.image, product.price);
    if (alert) {
      kwikToast.success(`Price dropped! ${product.name} is now ${formatCurrency(alert.currentPrice)}`);
    }
  }, [product.id, product.name, product.image, product.price, checkPriceDrop]);

  // Reset state when product changes
  React.useEffect(() => {
    setQuantity(1);
    setSelectedVariant(product.variants?.[0] ?? null);
    setVariantPrice(product.price);
  }, [product.id, product.variants, product.price]);

  // ─── Handlers ───
  const handleVariantSelect = React.useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
    setVariantPrice(variant.price);
  }, []);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      kwikToast.error("Out of stock", "This product is currently unavailable.");
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: variantPrice,
        comparePrice: product.comparePrice,
        image: product.image,
        store: product.store,
        storeId: product.storeId,
        storeSlug: product.storeSlug,
        storeName: product.store,
        productType: product.productType,
        productSource: product.productSource,
        requiresShipping: product.requiresShipping,
      });
    }
    const variantLabel = selectedVariant ? ` (${selectedVariant.name}: ${selectedVariant.options})` : "";
    kwikToast.success(`${quantity}× ${product.name}${variantLabel} added to cart`);
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      kwikToast.error("Out of stock", "This product is currently unavailable.");
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: variantPrice,
        comparePrice: product.comparePrice,
        image: product.image,
        store: product.store,
        storeId: product.storeId,
        storeSlug: product.storeSlug,
        storeName: product.store,
        productType: product.productType,
        productSource: product.productSource,
        requiresShipping: product.requiresShipping,
      });
    }
    router.push("/checkout");
  };

  const handleWishlistToggle = () => {
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.comparePrice,
      image: product.image,
      rating: product.rating,
      category: product.category,
    });
    kwikToast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: shareUrl });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    if (!navigator.clipboard?.writeText) {
      kwikToast.info(shareUrl);
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      kwikToast.success("Link copied to clipboard");
    } catch {
      kwikToast.info(shareUrl);
    }
  };

  // ─── Sticky bottom bar (IntersectionObserver — efficient, no scroll listener) ───
  const addToCartRef = React.useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = React.useState(false);

  React.useEffect(() => {
    const el = addToCartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ─── Trust badges ───
  const trustItems = [
    { icon: Truck, title: "Fast Delivery", description: "Quick & reliable shipping" },
    { icon: Shield, title: "Secure Payment", description: "Protected checkout" },
    { icon: RotateCcw, title: "Easy Returns", description: "30-day return policy" },
    { icon: ShieldCheck, title: "Buyer Protection", description: "Money-back guarantee" },
  ];

  // ─── Breadcrumb category link ───
  const categoryHref = product.categoryId
    ? `/categories/${product.categoryId}`
    : `/categories`;

  return (
    <div className="min-h-screen bg-background pb-4 pt-4 sm:pt-6">
      <div className="container mx-auto space-y-6 px-4">
        {/* Breadcrumb */}
        <FadeIn>
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-kwik-muted dark:text-white/55">
            <Link href="/" className="hover:text-kwik-orange">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/products" className="hover:text-kwik-orange">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={categoryHref} className="hover:text-kwik-orange">
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-kwik-dark dark:text-white line-clamp-1">
              {product.name}
            </span>
          </nav>
        </FadeIn>

        {/* ─── Main two-column area ───
            Sticky gallery uses native CSS position:sticky (spec #3).
            top = --header-height so it sticks BELOW the header (spec #4).
            max-height = viewport minus header so the whole gallery (main
            image + thumbnails) fits within the available viewport (spec #7).
            self-start keeps the sticky column from stretching to the info
            column's height. The sticky parent is this grid — when the user
            scrolls into Reviews / Related Products (outside this grid) the
            gallery releases naturally (spec #6). No JS scroll listeners. */}
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* LEFT: Gallery — sticky on large screens, normal flow on mobile */}
          <div className="lg:sticky lg:top-[var(--header-height)] lg:self-start">
            <div className="lg:h-[calc(100vh-var(--header-height)-1.5rem)]">
              <FadeIn className="h-full">
                <ProductGallery
                  images={gallery}
                  alt={product.name}
                  variant="full"
                  aspectRatio="1.05/1"
                  fillViewport
                  className="h-full"
                />
              </FadeIn>
            </div>
          </div>

          {/* RIGHT: Purchase Information — compact */}
          <div className="space-y-4">
            <FadeIn delay={0.05}>
              {/* Title + rating + type tag */}
              <div>
                <div className="flex items-center gap-2">
                  {product.store && (
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kwik-orange">
                      {product.store}
                    </p>
                  )}
                  {product.tag && (
                    <span className="rounded-full bg-kwik-bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-kwik-muted dark:bg-white/10 dark:text-white/60">
                      {product.tag}
                    </span>
                  )}
                </div>
                <h1 className="mt-1.5 text-xl font-bold leading-tight text-kwik-dark dark:text-white sm:text-2xl">
                  {product.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <RatingDisplay rating={averageRating} reviewCount={totalReviews} size="sm" />
                  <StockBadge stock={effectiveStock} variant="badge" />
                </div>
              </div>
            </FadeIn>

            {/* Price + description (compact, no card border) */}
            <FadeIn delay={0.1}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <PriceDisplay
                    price={variantPrice}
                    comparePrice={product.comparePrice}
                    size="lg"
                    showDiscount
                  />
                  {hasSavings && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                      Save {formatCurrency(savingsAmount)} ({savingsPercent}%)
                    </span>
                  )}
                </div>

                {/* Description right after price */}
                {product.description && (
                  <ProductDescription description={product.description} />
                )}
              </div>
            </FadeIn>

            {/* Variant selector (compact) */}
            {product.variants && product.variants.length > 0 && (
              <FadeIn delay={0.12}>
                <ProductVariantSelector
                  variants={product.variants}
                  onVariantSelect={handleVariantSelect}
                  selectedVariant={selectedVariant}
                />
              </FadeIn>
            )}

            {/* Quantity + Actions (compact single card) */}
            <FadeIn delay={0.15}>
              <div ref={addToCartRef} className="space-y-3 rounded-xl border border-border bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <QuantitySelector
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={Math.max(1, effectiveStock)}
                    disabled={isOutOfStock}
                    label="Qty"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleWishlistToggle}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                        isWishlisted
                          ? "border-kwik-orange bg-kwik-orange-tint"
                          : "border-border hover:border-kwik-orange/50 dark:border-white/10"
                      }`}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        className={`h-4 w-4 ${isWishlisted ? "fill-current text-kwik-orange" : "text-kwik-dark-medium dark:text-white/60"}`}
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:border-kwik-orange/50 dark:border-white/10"
                      aria-label="Share product"
                    >
                      <Share2 className="h-4 w-4 text-kwik-dark-medium dark:text-white/60" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-kwik-orange bg-kwik-orange/5 px-4 text-sm font-semibold text-kwik-orange transition-colors hover:bg-kwik-orange/10 disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-kwik-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-kwik-orange-hover disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    Buy now
                  </button>
                </div>
              </div>
            </FadeIn>

            {/* Delivery estimate */}
            <FadeIn delay={0.15}>
              <DeliveryEstimateWidget stock={effectiveStock} />
            </FadeIn>

            {/* Vendor summary (spec #16) */}
            {product.store && (
              <FadeIn delay={0.2}>
                <VendorSummary
                  storeName={product.store}
                  storeSlug={product.storeSlug}
                  storeId={product.storeId}
                />
              </FadeIn>
            )}

            {/* Trust badges */}
            <FadeIn delay={0.25}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {trustItems.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="border border-border bg-white p-3 text-center dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-orange/10">
                      <Icon className="h-4 w-4 text-kwik-orange" />
                    </div>
                    <p className="text-xs font-semibold text-kwik-dark dark:text-white">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-tight text-kwik-muted dark:text-white/55">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* ─── Below-the-fold sections ───
            Page-level sections with subtle dividers (spec #10) — no nested
            white cards. Delivery & Vendor appear once each in the right
            column above, so they are NOT repeated here (spec #1: the
            duplicate delivery options came from this section rendering the
            same DeliveryEstimateWidget a second time; same for VendorSummary). */}

        {/* Specifications */}
        {product.specifications && product.specifications.length > 0 && (
          <DetailSection
            title="Specifications"
            icon={<Settings2 className="h-4 w-4 text-kwik-orange" />}
          >
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 dark:border-white/10 dark:bg-white/10">
              {product.specifications.map((item) => (
                <div
                  key={item.label}
                  className="bg-background px-4 py-3 dark:bg-background"
                >
                  <p className="text-[11px] uppercase tracking-wide text-kwik-muted dark:text-white/45">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-kwik-dark dark:text-white">
                    {item.value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* ─── Reviews & Ratings (unified) ─── */}
        <DetailSection
          title="Reviews & Ratings"
          description={`${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}`}
          icon={<MessageSquare className="h-4 w-4 text-kwik-orange" />}
        >
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Left: Rating summary + write review */}
            <div className="space-y-4">
              {reviewsQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-xl bg-kwik-bg-surface dark:bg-white/5" />
                  <div className="h-32 animate-pulse rounded-xl bg-kwik-bg-surface dark:bg-white/5" />
                </div>
              ) : totalReviews > 0 ? (
                <>
                  <ReviewSummary
                    average={averageRating}
                    total={totalReviews}
                    distribution={distribution}
                    onFilter={setFilterStar}
                    activeFilter={filterStar}
                  />
                  <ReviewForm productId={product.id} />
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-kwik-bg-surface p-5 text-center dark:bg-white/5">
                    <p className="text-3xl font-bold text-kwik-dark dark:text-white">—</p>
                    <p className="mt-1 text-sm text-kwik-muted dark:text-white/55">No reviews yet</p>
                  </div>
                  <ReviewForm productId={product.id} />
                </div>
              )}
            </div>

            {/* Right: Review list + sort controls */}
            <div className="space-y-3">
              {reviews.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-kwik-muted dark:text-white/55">
                    Showing <span className="font-semibold text-kwik-dark dark:text-white">{visibleReviews.length}</span> of {totalReviews}
                    {filterStar !== null && <> · filtered to {filterStar}-star</>}
                  </span>
                  <div className="flex gap-1">
                    {([
                      { key: "helpful", label: "Helpful" },
                      { key: "recent", label: "Recent" },
                      { key: "rating", label: "Top" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          sortBy === opt.key
                            ? "bg-kwik-dark text-white dark:bg-white dark:text-kwik-dark"
                            : "bg-kwik-bg-surface text-kwik-muted hover:bg-kwik-border/40 dark:bg-white/5 dark:text-white/60"
                        }`}
                        aria-pressed={sortBy === opt.key}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {reviewsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 animate-pulse rounded-xl bg-kwik-bg-surface dark:bg-white/5" />
                  ))}
                </div>
              ) : visibleReviews.length > 0 ? (
                <ReviewList
                  reviews={visibleReviews}
                  votedReviewIds={votedReviews}
                  onHelpfulVote={handleHelpfulVote}
                  onPhotoClick={(src, alt) => setLightbox({ src, alt })}
                />
              ) : filterStar !== null ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center dark:border-white/10">
                  <p className="text-sm font-medium text-kwik-dark dark:text-white">
                    No {filterStar}-star reviews
                  </p>
                  <p className="mt-1 text-xs text-kwik-muted dark:text-white/55">
                    Try a different filter.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </DetailSection>

        {/* ─── Product discovery (spec #17) ─── */}

        {/* Related Products */}
        {relatedProductsProp.length > 0 && (
          <RelatedProducts
            title="Related Products"
            description="Products in the same category"
            products={relatedProductsProp}
            variant="related"
          />
        )}

        {/* More From This Vendor */}
        {vendorProducts.length > 0 && (
          <RelatedProducts
            title="More From This Vendor"
            description={`More from ${product.store}`}
            products={vendorProducts}
            variant="vendor"
          />
        )}

        {/* You May Also Like */}
        {recommendedProducts.length > 0 && (
          <RelatedProducts
            title="You May Also Like"
            description="Recommended for you"
            products={recommendedProducts}
            variant="recommended"
          />
        )}
      </div>

      {/* ─── Sticky Quick Actions Bar (mobile-first, IntersectionObserver-based) ─── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 right-0 z-40 md:bottom-0"
          >
            <div className="border-t border-border bg-background/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              <div className="container mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-kwik-dark dark:text-white">{product.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-base font-bold text-kwik-orange">
                      {formatCurrency(variantPrice)}
                    </span>
                    {product.comparePrice && (
                      <span className="text-xs text-kwik-muted line-through dark:text-white/45">
                        {formatCurrency(product.comparePrice)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleWishlistToggle}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-colors ${
                    isWishlisted
                      ? "border-kwik-orange bg-kwik-orange-tint"
                      : "border-border hover:border-kwik-orange/50 dark:border-white/10"
                  }`}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={`h-5 w-5 ${isWishlisted ? "fill-current text-kwik-orange" : "text-kwik-dark-medium dark:text-white/60"}`}
                  />
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-xl border-2 border-kwik-orange bg-kwik-orange/5 px-4 font-semibold text-kwik-orange transition-colors hover:bg-kwik-orange/10"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Add to cart</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-kwik-orange px-5 font-semibold text-white transition-colors hover:bg-kwik-orange-hover"
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Buy now</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review photo lightbox */}
      <PhotoLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt ?? ""}
        isOpen={!!lightbox}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
