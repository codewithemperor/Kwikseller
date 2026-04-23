"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@heroui/react";
import { motion, useInView, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { productsApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import { useCartStore, useWishlistStore, useRecentlyViewedStore, usePriceDropStore } from "@/stores";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { MarketplaceSectionHeader } from "@/components/landing/shared/marketplace-section-header";
import { ProductVariantSelector } from "@/components/product/product-variant-selector";
import type { MarketplaceProduct, ProductVariant } from "@/data/marketplace-home";

/* ─── Re-export Loader2 for dynamic loading ─────────────── */
const Loader2 = () => (
  <div className="h-6 w-6 animate-spin rounded-full border-2 border-kwik-orange/30 border-t-kwik-orange" />
);

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Entrance animation wrapper ─────────────────────────── */
function FadeInUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Staggered children container ───────────────────────── */
function StaggerIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Delivery Estimate Widget ─────────────────────────── */
function DeliveryEstimateWidget({ stock }: { stock: number }) {
  // Calculate delivery dates
  const today = new Date();
  const standardDelivery = new Date(today);
  standardDelivery.setDate(standardDelivery.getDate() + 3);
  // Add business days (skip weekends)
  let daysToAdd = 3;
  while (daysToAdd > 0) {
    standardDelivery.setDate(standardDelivery.getDate() + 1);
    const day = standardDelivery.getDay();
    if (day !== 0 && day !== 6) daysToAdd--;
  }
  const expressDelivery = new Date(today);
  expressDelivery.setDate(expressDelivery.getDate() + 1);
  if (expressDelivery.getDay() === 0) expressDelivery.setDate(expressDelivery.getDate() + 1);
  if (expressDelivery.getDay() === 6) expressDelivery.setDate(expressDelivery.getDate() + 2);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });

  const isLowStock = stock > 0 && stock <= 10;

  return (
    <div className="rounded-[24px] border border-kwik-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5">
          <Truck className="h-4 w-4 text-kwik-orange" />
        </div>
        <h3 className="text-sm font-semibold text-kwik-dark">Delivery Options</h3>
      </div>

      <div className="space-y-3">
        {/* Standard Delivery */}
        <div className="flex items-center justify-between rounded-xl bg-kwik-bg-surface px-4 py-3 ring-1 ring-kwik-border/50">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-kwik-gray-light" />
            <div>
              <p className="text-sm font-medium text-kwik-dark">Standard Delivery</p>
              <p className="text-xs text-kwik-gray-light">3-5 business days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-kwik-green">FREE</p>
            <p className="text-xs text-kwik-gray-light">{formatDate(standardDelivery)}</p>
          </div>
        </div>

        {/* Express Delivery */}
        <div className="flex items-center justify-between rounded-xl bg-kwik-bg-surface px-4 py-3 ring-1 ring-kwik-border/50">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-kwik-orange" />
            <div>
              <p className="text-sm font-medium text-kwik-dark">Express Delivery</p>
              <p className="text-xs text-kwik-gray-light">1-2 business days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-kwik-orange">₦2,500</p>
            <p className="text-xs text-kwik-gray-light">{formatDate(expressDelivery)}</p>
          </div>
        </div>

        {/* Stock status indicator */}
        {isLowStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-xl bg-kwik-amber/10 px-4 py-2.5 text-xs font-medium text-kwik-amber"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Only {stock} left in stock — order soon for faster delivery!
          </motion.div>
        )}
        {stock === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-xl bg-kwik-red/10 px-4 py-2.5 text-xs font-medium text-kwik-red"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Currently out of stock. Check back soon or set a price drop alert!
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function ProductDetailPage({
  product,
}: {
  product: MarketplaceProduct;
}) {
  const [activeImage, setActiveImage] = React.useState(
    product.images?.[0] ?? product.image,
  );
  const [relatedProducts, setRelatedProducts] = React.useState<
    MarketplaceProduct[]
  >([]);
  const [isLoadingRelated, setIsLoadingRelated] = React.useState(true);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(
    product.variants?.[0] ?? null,
  );
  const [variantPrice, setVariantPrice] = React.useState(product.price);

  // Sticky bottom bar visibility
  const addToCartRef = React.useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!addToCartRef.current) return;
    const rect = addToCartRef.current.getBoundingClientRect();
    const isPast = rect.bottom < 0;
    setShowStickyBar(isPast);
  });

  const gallery = product.images?.length ? product.images : [product.image];
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Smooth image transition
  const setActiveImageWithTransition = React.useCallback((image: string) => {
    if (image === activeImage || isTransitioning) return;
    setIsTransitioning(true);
    // Fade out
    setTimeout(() => {
      setActiveImage(image);
      // Fade in
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  }, [activeImage, isTransitioning]);

  // Navigate images
  const goToImage = React.useCallback((direction: 'prev' | 'next') => {
    const currentIdx = gallery.indexOf(activeImage);
    let nextIdx: number;
    if (direction === 'prev') {
      nextIdx = currentIdx <= 0 ? gallery.length - 1 : currentIdx - 1;
    } else {
      nextIdx = currentIdx >= gallery.length - 1 ? 0 : currentIdx + 1;
    }
    setActiveImageWithTransition(gallery[nextIdx]);
  }, [activeImage, gallery, setActiveImageWithTransition]);

  // Touch/swipe support
  const touchStartRef = React.useRef<number | null>(null);
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(diff) > 50) {
      goToImage(diff < 0 ? 'next' : 'prev');
    }
    touchStartRef.current = null;
  }, [goToImage]);

  // Store hooks
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const checkPriceDrop = usePriceDropStore((s) => s.checkPriceDrop);

  const isWishlisted = isInWishlist(product.id);

  // Track recently viewed on mount
  React.useEffect(() => {
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
    });
  }, [product.id, product.name, product.price, product.comparePrice, product.image, product.store, addRecentlyViewed]);

  // Track price drop on mount
  React.useEffect(() => {
    const alert = checkPriceDrop(
      product.id,
      product.name,
      product.image,
      product.price,
    );
    if (alert) {
      kwikToast.success(
        `Price dropped! ${product.name} is now ${formatCurrency(alert.currentPrice)}`,
      );
    }
  }, [product.id, product.name, product.image, product.price, checkPriceDrop]);

  // Fetch related products
  React.useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await productsApi.list({
          limit: 4,
          category: product.category,
        });
        if (response.success && response.data) {
          const data = response.data as any;
          const list = Array.isArray(data) ? data : data.products || [];
          setRelatedProducts(
            list
              .filter((p: any) => p.id !== product.id)
              .slice(0, 4)
              .map((p: any) => ({
                id: String(p.id),
                name: p.name,
                price: p.price,
                comparePrice: p.comparePrice,
                image:
                  p.image || p.images?.[0] || p.featuredImage || null,
                rating: p.averageRating || p.rating || 0,
                reviewCount: p.reviewCount || 0,
                store: p.store?.name || p.storeName || "",
                category: p.category?.name || p.categoryName || "",
                isNew: p.isNew || false,
              })),
          );
        }
      } catch {
        // No related products
      } finally {
        setIsLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product.id, product.category]);

  // --- Handlers ---

  const handleVariantSelect = React.useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
    setVariantPrice(variant.price);
  }, []);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i += 1) {
      addItem({
        productId: product.id,
        name: product.name,
        price: variantPrice,
        comparePrice: product.comparePrice,
        image: product.image,
        store: product.store,
      });
    }
    const variantLabel = selectedVariant
      ? ` (${selectedVariant.name}: ${selectedVariant.options})`
      : "";
    kwikToast.success(
      `${quantity}x ${product.name}${variantLabel} added to cart`,
    );
    setCartOpen(true);
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
    kwikToast.success(
      isWishlisted
        ? "Removed from wishlist"
        : "Added to wishlist",
    );
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      kwikToast.success("Link copied to clipboard");
    } catch {
      kwikToast.error("Failed to copy link");
    }
  };

  // --- Rating summary computation ---

  const reviews = product.reviews ?? [];

  const ratingCounts = React.useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 1-star, index 4 = 5-star
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1] += 1;
      }
    });
    return counts;
  }, [reviews]);

  const totalReviews = reviews.length;

  // --- Trust info items ---

  const trustItems = [
    { icon: Truck, title: "Fast Delivery", description: "Quick & reliable shipping" },
    { icon: Shield, title: "Secure Payment", description: "100% protected checkout" },
    { icon: RotateCcw, title: "Easy Returns", description: "30-day return policy" },
    { icon: ShieldCheck, title: "Buyer Protection", description: "Money-back guarantee" },
  ];

  return (
    <div className="bg-kwik-bg-page py-1">
      <div className="container mx-auto space-y-5 px-4">

        {/* Breadcrumb */}
        <FadeInUp delay={0}>
          <nav className="flex items-center gap-1.5 text-sm text-kwik-gray-light flex-wrap">
            <Link href="/" className="hover:text-kwik-orange transition-colors duration-200">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-kwik-muted" />
            {product.category && (
              <>
                <Link href={`/search?category=${encodeURIComponent(product.category)}`} className="hover:text-kwik-orange transition-colors duration-200">
                  {product.category}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-kwik-muted" />
              </>
            )}
            <span className="text-kwik-dark font-medium">{product.name}</span>
          </nav>
        </FadeInUp>

        {/* Main product card */}
        <div className="rounded-[28px] bg-background p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

            {/* Left column: Gallery with gradient shadow */}
            <FadeInUp delay={0.1}>
              <div className="space-y-4">
                <div
                  className="relative aspect-[1.05/1] overflow-hidden rounded-[24px] bg-kwik-bg-light shadow-inner ring-1 ring-kwik-border/50"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Subtle gradient overlay at edges */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/[0.03] dark:to-white/[0.02] z-10 rounded-[24px]" />
                  <motion.div
                    animate={{ opacity: isTransitioning ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                  >
                    <AppImage
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full"
                      objectFit="contain"
                    />
                  </motion.div>

                  {/* Navigation buttons (visible when gallery > 1) */}
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goToImage('prev'); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-md border border-kwik-border/50 text-kwik-dark-medium hover:bg-background hover:text-kwik-orange transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goToImage('next'); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-md border border-kwik-border/50 text-kwik-dark-medium hover:bg-background hover:text-kwik-orange transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      {/* Image counter indicator */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 shadow-sm border border-kwik-border/50">
                        <span className="text-xs font-semibold text-kwik-dark">
                          {gallery.indexOf(activeImage) + 1}/{gallery.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {gallery.map((image, idx) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImageWithTransition(image)}
                        className={`relative aspect-square overflow-hidden rounded-[18px] transition-all duration-300 ease-out ${
                          activeImage === image
                            ? "ring-2 ring-kwik-orange ring-offset-2 ring-offset-kwik-bg-page dark:ring-offset-kwik-bg-light scale-[1.03] shadow-md shadow-kwik-orange/20"
                            : "border border-kwik-border hover:border-kwik-orange/50 hover:shadow-sm"
                        } bg-kwik-bg-surface`}
                      >
                        <AppImage
                          src={image}
                          alt={`${product.name} - Image ${idx + 1}`}
                          className="w-full h-full"
                          objectFit="contain"
                        />
                        {activeImage === image && (
                          <div className="absolute inset-0 rounded-[18px] ring-1 ring-inset ring-kwik-orange/30" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FadeInUp>

            {/* Right column: Info */}
            <div className="space-y-5">

              {/* Product title + rating */}
              <FadeInUp delay={0.15}>
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-kwik-orange font-semibold">
                    {product.store}
                  </p>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-kwik-dark leading-tight">
                    {product.name}
                  </h1>
                  <div className="mt-3 flex items-center gap-2 text-sm text-kwik-gray-light">
                    <span className="inline-flex items-center gap-1 font-medium text-kwik-dark">
                      <Star className="h-4 w-4 fill-kwik-star text-kwik-star" />
                      {product.rating.toFixed(1)}
                    </span>
                    <span>({product.reviewCount} reviews)</span>
                  </div>
                </div>
              </FadeInUp>

              {/* Price + Actions card with enhanced background */}
              <FadeInUp delay={0.2}>
                <div className="rounded-[24px] bg-gradient-to-br from-kwik-bg-surface via-kwik-bg-surface to-kwik-orange-tint/50 p-5 ring-1 ring-kwik-border/50">
                  {product.comparePrice && (
                    <p className="text-lg text-kwik-muted line-through">
                      {formatCurrency(product.comparePrice)}
                    </p>
                  )}
                  <p className="text-4xl font-bold text-kwik-dark">
                    {formatCurrency(variantPrice)}
                  </p>
                  {product.comparePrice && (
                    <span className="mt-1 inline-block rounded-lg bg-kwik-green/10 px-2 py-0.5 text-xs font-semibold text-kwik-green">
                      Save {formatCurrency(product.comparePrice - variantPrice)}
                    </span>
                  )}
                  {product.dimensions && (
                    <p className="mt-3 text-sm text-kwik-gray-light">
                      Dimensions: {product.dimensions}
                    </p>
                  )}
                  {product.tag && (
                    <p className="mt-1 text-sm text-kwik-gray-light">
                      Material: {product.tag}
                    </p>
                  )}

                  {/* Variant selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-4 border-t border-kwik-border/50 pt-4">
                      <ProductVariantSelector
                        variants={product.variants}
                        onVariantSelect={handleVariantSelect}
                        selectedVariant={selectedVariant}
                      />
                    </div>
                  )}

                  {/* Quantity selector */}
                  <div className="mt-5 flex items-center gap-3">
                    <span className="text-sm font-semibold text-kwik-dark">
                      Quantity
                    </span>
                    <div className="flex items-center gap-1 rounded-xl border border-kwik-border bg-kwik-bg-surface px-1.5 py-1 shadow-sm">
                      <Button
                        isIconOnly
                        variant="ghost"
                        className="h-8 min-w-8 rounded-lg hover:bg-kwik-orange-tint transition-colors duration-200"
                        onPress={() =>
                          setQuantity((v) => Math.max(1, v - 1))
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-kwik-dark tabular-nums">
                        {quantity}
                      </span>
                      <Button
                        isIconOnly
                        variant="ghost"
                        className="h-8 min-w-8 rounded-lg hover:bg-kwik-orange-tint transition-colors duration-200"
                        onPress={() => setQuantity((v) => v + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div ref={addToCartRef} className="mt-4 grid grid-cols-[1fr_auto_auto] gap-3">
                    {/* Add to Cart - prominent gradient button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kwik-orange to-[#d97706] px-5 font-semibold text-white shadow-lg shadow-kwik-orange/25 transition-all duration-300 hover:shadow-xl hover:shadow-kwik-orange/30 hover:brightness-110"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to cart
                    </motion.button>

                    {/* Wishlist button with pulse animation when active */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleWishlistToggle}
                      className={`relative flex h-12 min-w-12 items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                        isWishlisted
                          ? "border-kwik-orange bg-kwik-orange-tint"
                          : "border-kwik-border hover:border-kwik-orange/50"
                      }`}
                      aria-label={
                        isWishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      {isWishlisted && (
                        <motion.span
                          className="absolute inset-0 rounded-xl bg-kwik-orange/20"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                        />
                      )}
                      <Heart
                        className={`h-5 w-5 transition-all duration-300 ${
                          isWishlisted
                            ? "fill-current text-kwik-orange scale-110"
                            : "text-kwik-dark-medium"
                        }`}
                      />
                    </motion.button>

                    {/* Share button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="flex h-12 min-w-12 items-center justify-center rounded-xl border-2 border-kwik-border transition-all duration-300 hover:border-kwik-orange/50 hover:bg-kwik-orange-tint"
                      aria-label="Share product"
                    >
                      <Share2 className="h-5 w-5 text-kwik-dark-medium transition-colors duration-200 group-hover:text-kwik-orange" />
                    </motion.button>
                  </div>
                </div>
              </FadeInUp>

              {/* Delivery Estimate Widget */}
              <FadeInUp delay={0.25}>
                <DeliveryEstimateWidget stock={product.stock ?? 0} />
              </FadeInUp>

              {/* Trust info section with gradient icon containers */}
              <FadeInUp delay={0.25}>
                <StaggerIn className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {trustItems.map(({ icon: Icon, title, description }) => (
                    <StaggerItem key={title}>
                      <div className="group rounded-2xl bg-kwik-bg-surface p-4 text-center ring-1 ring-kwik-border/50 transition-all duration-300 hover:ring-kwik-orange/20 hover:shadow-sm">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-kwik-orange/10 to-kwik-orange/5">
                          <Icon className="h-5 w-5 text-kwik-orange transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <p className="text-xs font-semibold text-kwik-dark">
                          {title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-tight text-kwik-gray-light">
                          {description}
                        </p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerIn>
              </FadeInUp>

              {/* Product description */}
              {product.description && (
                <FadeInUp delay={0.3}>
                  <div className="rounded-[24px] border border-kwik-border p-5">
                    <h2 className="text-lg font-semibold text-kwik-dark">
                      Product description
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-kwik-gray">
                      {product.description}
                    </p>
                  </div>
                </FadeInUp>
              )}

              {/* Product specifications */}
              {product.specifications &&
                product.specifications.length > 0 && (
                <FadeInUp delay={0.35}>
                  <div className="rounded-[24px] border border-kwik-border p-5">
                    <h2 className="text-lg font-semibold text-kwik-dark">
                      Product details
                    </h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {product.specifications.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl bg-kwik-bg-surface px-4 py-3 ring-1 ring-kwik-border/50"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-kwik-muted">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-medium text-kwik-dark">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeInUp>
              )}
            </div>
          </div>
        </div>

        {/* Features section */}
        {product.features && product.features.length > 0 && (
          <FadeInUp delay={0.1}>
            <div className="rounded-[28px] bg-background p-5 shadow-sm sm:p-6">
              <MarketplaceSectionHeader
                title="Features"
                href="#"
                actionLabel="Product info"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-kwik-border px-4 py-3 text-sm text-kwik-dark-medium transition-colors duration-200 hover:border-kwik-orange/30 hover:bg-kwik-orange-tint"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </FadeInUp>
        )}

        {/* Reviews with rating summary */}
        {reviews.length > 0 && (
          <FadeInUp delay={0.1}>
            <div className="rounded-[28px] bg-background p-5 shadow-sm sm:p-6">
              <MarketplaceSectionHeader
                title="Reviews"
                href="#"
                actionLabel="Customer feedback"
              />
              <div className="mt-2 grid gap-6 lg:grid-cols-[240px_1fr]">
                {/* Rating summary */}
                <div className="space-y-4">
                  {/* Average rating */}
                  <div className="text-center">
                    <p className="text-5xl font-bold text-kwik-dark">
                      {product.rating.toFixed(1)}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={`avg-${idx}`}
                          className={`h-5 w-5 ${
                            idx < Math.round(product.rating)
                              ? "fill-kwik-star text-kwik-star"
                              : "text-kwik-border-light"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-kwik-gray-light">
                      {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>

                  {/* Rating distribution bars */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star - 1];
                      const pct =
                        totalReviews > 0
                          ? Math.round((count / totalReviews) * 100)
                          : 0;
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-3 text-right font-medium text-kwik-dark">
                            {star}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-kwik-star text-kwik-star" />
                          <div className="flex-1 h-2 overflow-hidden rounded-full bg-kwik-border-light">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-kwik-star to-[#fbbf24] transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs text-kwik-gray-light">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review cards with hover effects */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[24px] border border-kwik-border p-5 transition-all duration-300 hover:shadow-md hover:border-kwik-orange/20 hover:-translate-y-0.5"
                    >
                      <div className="mb-3 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`${review.id}-${index}`}
                            className={`h-4 w-4 ${
                              index < review.rating
                                ? "fill-kwik-star text-kwik-star"
                                : "text-kwik-border-light"
                            }`}
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
                        <p className="text-sm text-kwik-gray-light">
                          {review.location}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </FadeInUp>
        )}

        {/* Related Products - "You Might Also Like" with decorative header */}
        <FadeInUp delay={0.1}>
          <div className="rounded-[28px] bg-background p-5 shadow-sm sm:p-6">
            {/* Decorative section header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-kwik-orange to-[#d97706] shadow-sm shadow-kwik-orange/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-kwik-dark sm:text-xl">You might also like</h2>
                  <p className="text-xs text-kwik-gray-light">Curated recommendations for you</p>
                </div>
              </div>
              <div className="ml-auto hidden items-center gap-1 sm:flex">
                <span className="h-[2px] w-8 rounded-full bg-kwik-border" />
                <span className="h-2 w-2 rounded-full bg-kwik-orange" />
              </div>
            </div>

            {isLoadingRelated ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-kwik-orange" />
              </div>
            ) : relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {relatedProducts.map((relatedProduct, index) => (
                  <motion.div
                    key={relatedProduct.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <MarketplaceProductCard
                      product={relatedProduct}
                      priority={index < 2}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No related products"
                description="Browse other categories to discover more products."
              />
            )}
          </div>
        </FadeInUp>
      </div>

      {/* Sticky Quick Actions Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-40 md:z-30"
          >
            <div className="bg-background/80 backdrop-blur-xl border-t border-kwik-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
              <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-3xl">
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kwik-dark truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-bold text-kwik-orange">
                      {formatCurrency(variantPrice)}
                    </span>
                    {product.comparePrice && (
                      <span className="text-xs text-kwik-muted line-through">
                        {formatCurrency(product.comparePrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Wishlist button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleWishlistToggle}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all duration-200 flex-shrink-0 ${
                    isWishlisted
                      ? 'border-kwik-orange bg-kwik-orange-tint'
                      : 'border-kwik-border hover:border-kwik-orange/50'
                  }`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isWishlisted ? 'fill-current text-kwik-orange' : 'text-kwik-dark-medium'
                    }`}
                  />
                </motion.button>

                {/* Add to Cart */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="flex h-11 items-center gap-2 rounded-xl bg-kwik-orange px-5 font-semibold text-white shadow-lg shadow-kwik-orange/20 transition-all duration-200 hover:bg-kwik-orange-hover hover:shadow-xl flex-shrink-0"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Add to cart</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
