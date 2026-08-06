"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  Check,
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
  Store,
  Truck,
  Sparkles,
  Zap,
  PenLine,
  ThumbsUp,
  X,
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
import { ReviewForm } from "@/components/product/review-form";
import { useReviewStore } from "@/stores/review-store";
import type { MarketplaceProduct, ProductVariant } from "@/data/marketplace-home";

/* ─── Re-export Loader2 for dynamic loading ─────────────── */
const Loader2 = ({ className = "" }: { className?: string }) => (
  <div className={`h-6 w-6 animate-spin rounded-full border-2 border-kwik-orange/30 border-t-kwik-orange ${className}`.trim()} />
);

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function extractProductImage(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.url ?? "";
}

function categoryToParam(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hasHtmlMarkup(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * Render an ISO date as a friendly relative string (e.g. "3 days ago",
 * "Just now", "2 weeks ago"). Falls back to a localized date for older
 * reviews (>= 6 months).
 */
function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return "";
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "Just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  if (day < 14) return "1 week ago";
  if (day < 30) return `${Math.round(day / 7)} weeks ago`;
  if (day < 60) return "1 month ago";
  if (day < 180) return `${Math.round(day / 30)} months ago`;
  return new Date(then).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

function ProductDescription({ description }: { description: string }) {
  const contentClassName =
    "mt-3 text-sm leading-7 text-kwik-gray [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-kwik-dark [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-kwik-dark [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-kwik-dark [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-kwik-dark";

  if (hasHtmlMarkup(description)) {
    return <div className={contentClassName} dangerouslySetInnerHTML={{ __html: description }} />;
  }

  return <p className={contentClassName}>{description}</p>;
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
    <div className="border border-kwik-border p-5 dark:border-white/10">
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

/* ─── User Reviews (from local store) ───────────────────── */
function UserReviews({ productId }: { productId: string }) {
  const [mounted, setMounted] = React.useState(false);
  // Select the raw reviews array (stable reference) and filter in useMemo
  // to avoid the "getSnapshot should be cached" infinite loop.
  const allReviews = useReviewStore((s) => s.reviews);
  const userReviews = React.useMemo(
    () => allReviews.filter((r) => r.productId === productId),
    [allReviews, productId],
  );

  React.useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: the persisted store reads from localStorage
  // (client-only), so render the empty state during SSR.
  if (!mounted || userReviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Star className="h-6 w-6 text-gray-400" />
        </div>
        <p className="mt-3 text-sm font-medium text-kwik-dark">No reviews yet</p>
        <p className="mt-1 text-xs text-kwik-gray-light">Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {userReviews.map((review) => (
        <div
          key={review.id}
          className="rounded-xl border border-kwik-border bg-kwik-bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                {review.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-kwik-dark">{review.author}</p>
                <p className="text-xs text-kwik-gray-light">
                  {new Date(review.date).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </p>
              </div>
            </div>
            {review.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                <Check className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <div className="mt-2 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={`h-3.5 w-3.5 ${idx < review.rating ? "fill-kwik-star text-kwik-star" : "text-kwik-border-light"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold text-kwik-dark">{review.title}</p>
          <p className="mt-1 text-sm leading-5 text-kwik-gray">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailPage({
  product,
  relatedProducts: relatedProductsProp,
}: {
  product: MarketplaceProduct;
  /**
   * Optional pre-fetched related products. When provided, the component skips
   * its own related-products fetch and renders these directly. The route
   * page passes these in (fetched via the shared `useProducts` hook with the
   * product's category slug).
   */
  relatedProducts?: MarketplaceProduct[];
}) {
  const router = useRouter();
  const gallery = React.useMemo(
    () => (product.images?.length ? product.images : [product.image]),
    [product.images, product.image],
  );
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const activeImage = gallery[activeImageIndex] ?? product.image;
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

  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    if (activeImageIndex > gallery.length - 1) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, gallery.length]);

  // Smooth image transition
  const setActiveImageWithTransition = React.useCallback((index: number) => {
    if (index === activeImageIndex || isTransitioning) return;
    setIsTransitioning(true);
    // Fade out
    setTimeout(() => {
      setActiveImageIndex(index);
      // Fade in
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  }, [activeImageIndex, isTransitioning]);

  // Navigate images
  const goToImage = React.useCallback((direction: 'prev' | 'next') => {
    let nextIdx: number;
    if (direction === 'prev') {
      nextIdx = activeImageIndex <= 0 ? gallery.length - 1 : activeImageIndex - 1;
    } else {
      nextIdx = activeImageIndex >= gallery.length - 1 ? 0 : activeImageIndex + 1;
    }
    setActiveImageWithTransition(nextIdx);
  }, [activeImageIndex, gallery.length, setActiveImageWithTransition]);

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
  const hasSavings = Boolean(product.comparePrice && product.comparePrice > variantPrice);
  const savingsAmount = hasSavings ? Number(product.comparePrice) - variantPrice : 0;
  const savingsPercent = hasSavings && product.comparePrice
    ? Math.round((savingsAmount / Number(product.comparePrice)) * 100)
    : 0;

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

  // Fetch related products via the shared `useProducts` hook (passed in as a
  // prop from the route page, which has the raw API Product + category slug).
  React.useEffect(() => {
    if (relatedProductsProp && relatedProductsProp.length > 0) {
      setRelatedProducts(relatedProductsProp.slice(0, 5));
      setIsLoadingRelated(false);
    } else {
      // Fallback: try the direct API call with the category NAME as the
      // search term so the dummy API returns relevant matches.
      let cancelled = false;
      setIsLoadingRelated(true);
      const fetchRelated = async () => {
        try {
          const response = await productsApi.list({
            limit: 5,
            search: product.category,
          });
          if (cancelled) return;
          if (response.success && response.data) {
            const data = response.data as any;
            const list = Array.isArray(data) ? data : data.products || [];
            setRelatedProducts(
              list
                .filter((p: any) => p.id !== product.id)
                .slice(0, 5)
                .map((p: any) => ({
                  id: String(p.id),
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  comparePrice: p.comparePrice,
                  image:
                    extractProductImage(p.image) || extractProductImage(p.images?.[0]) || extractProductImage(p.featuredImage),
                  rating: p.averageRating || p.rating || 0,
                  reviewCount: p.reviewCount || 0,
                  store: p.store?.name || p.storeName || "",
                  storeId: p.storeId || p.store?.id,
                  storeSlug: p.store?.slug || p.storeSlug,
                  category: p.category?.name || p.categoryName || "",
                  isNew: p.isNew || false,
                })),
            );
          }
        } catch {
          if (!cancelled) setRelatedProducts([]);
        } finally {
          if (!cancelled) setIsLoadingRelated(false);
        }
      };
      fetchRelated();
      return () => {
        cancelled = true;
      };
    }
  }, [product.id, product.category, relatedProductsProp]);

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
        storeId: product.storeId,
        storeSlug: product.storeSlug,
        storeName: product.store,
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

  const handleBuyNow = () => {
    // Add to cart then immediately navigate to checkout
    for (let i = 0; i < quantity; i += 1) {
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
    kwikToast.success(
      isWishlisted
        ? "Removed from wishlist"
        : "Added to wishlist",
    );
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: shareUrl });
        return;
      } catch {
        // Fall through to clipboard copy when native sharing is cancelled or unavailable.
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

  // Average rating from the actual reviews (matches the distribution bars).
  // Falls back to product.rating when no reviews have been fetched yet.
  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) return product.rating;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews, product.rating]);

  // ─── Review filter / sort / helpful-vote state ────────────────
  type SortKey = "helpful" | "recent" | "rating";
  const [filterStar, setFilterStar] = React.useState<number | null>(null);
  const [sortBy, setSortBy] = React.useState<SortKey>("helpful");
  // Set of review IDs the user has marked as helpful — persisted to
  // localStorage (keyed by product id) so votes survive page refreshes.
  const VOTES_STORAGE_PREFIX = "kwik:review-votes:";
  const [votedReviews, setVotedReviews] = React.useState<Set<string>>(new Set());

  // Load persisted votes on product change.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(VOTES_STORAGE_PREFIX + product.id);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setVotedReviews(new Set(arr));
      } else {
        setVotedReviews(new Set());
      }
    } catch {
      setVotedReviews(new Set());
    }
    setFilterStar(null);
  }, [product.id]);

  // Persist votes whenever they change.
  React.useEffect(() => {
    try {
      const key = VOTES_STORAGE_PREFIX + product.id;
      const arr = Array.from(votedReviews);
      if (arr.length > 0) {
        localStorage.setItem(key, JSON.stringify(arr));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // localStorage may be unavailable (private mode / SSR) — ignore.
    }
  }, [votedReviews, product.id]);
  // Lightbox state for review photos.
  const [lightbox, setLightbox] = React.useState<{ src: string; alt: string } | null>(null);

  // Filtered + sorted reviews derived from the source list.
  const visibleReviews = React.useMemo(() => {
    let list = reviews;
    if (filterStar !== null) {
      list = list.filter((r) => r.rating === filterStar);
    }
    const sorted = [...list];
    switch (sortBy) {
      case "recent":
        sorted.sort((a, b) => {
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bt - at;
        });
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "helpful":
      default:
        sorted.sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0));
        break;
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

  // --- Trust info items ---

  const trustItems = [
    { icon: Truck, title: "Fast Delivery", description: "Quick & reliable shipping" },
    { icon: Shield, title: "Secure Payment", description: "100% protected checkout" },
    { icon: RotateCcw, title: "Easy Returns", description: "30-day return policy" },
    { icon: ShieldCheck, title: "Buyer Protection", description: "Money-back guarantee" },
  ];

  return (
    <div className="bg-background pt-4 pb-1 sm:pt-6">
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
                <Link href={`/categories?name=${encodeURIComponent(categoryToParam(product.category))}`} className="hover:text-kwik-orange transition-colors duration-200">
                  {product.category}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-kwik-muted" />
              </>
            )}
            <span className="text-kwik-dark font-medium">{product.name}</span>
          </nav>
        </FadeInUp>

        {/* Main product card */}
        <div className="bg-white dark:bg-white/5">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

            {/* Left column: Gallery with gradient shadow */}
            <FadeInUp delay={0.1}>
              <div className="space-y-4">
                <div
                  className="relative aspect-[1.05/1] overflow-hidden bg-neutral-100 ring-1 ring-kwik-border/50 dark:bg-white/10 dark:ring-white/10"
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
                          {activeImageIndex + 1}/{gallery.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {gallery.map((image, idx) => (
                      <button
                        key={`${image}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageWithTransition(idx)}
                        className={`relative h-16 w-16 flex-none overflow-hidden rounded-[14px] transition-all duration-300 ease-out sm:h-20 sm:w-20 ${
                          activeImageIndex === idx
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
                        {activeImageIndex === idx && (
                          <div className="absolute inset-0 rounded-[14px] ring-1 ring-inset ring-kwik-orange/30" />
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

              {/* Price + Actions card */}
              <FadeInUp delay={0.2}>
                <div className="overflow-hidden bg-white dark:bg-white/5">
                  <div className="border-b border-kwik-border/70 py-4 dark:border-white/10 sm:py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kwik-muted">Amount</p>
                        <div className="mt-2">
                          <p className="text-3xl font-bold leading-none text-kwik-dark sm:text-4xl">
                            {formatCurrency(variantPrice)}
                          </p>
                          {product.comparePrice && (
                            <p className="mt-1 text-sm font-medium text-kwik-muted line-through">
                              {formatCurrency(product.comparePrice)}
                            </p>
                          )}
                        </div>
                      </div>
                      {hasSavings && (
                        <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-right">
                          <p className="text-sm font-bold text-emerald-600">{savingsPercent}% off</p>
                          <p className="text-[11px] font-medium text-emerald-700/80">Save {formatCurrency(savingsAmount)}</p>
                        </div>
                      )}
                    </div>

                    {(product.dimensions || product.tag) && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {product.dimensions && (
                            <div className="rounded-lg bg-kwik-bg-surface px-3 py-2 dark:bg-white/5">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-kwik-muted">Dimensions</p>
                            <p className="mt-1 text-sm font-medium text-kwik-dark">{product.dimensions}</p>
                          </div>
                        )}
                        {product.tag && (
                            <div className="rounded-lg bg-kwik-bg-surface px-3 py-2 dark:bg-white/5">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-kwik-muted">Material</p>
                            <p className="mt-1 text-sm font-medium text-kwik-dark">{product.tag}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Variant selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="border-b border-kwik-border/70 py-4 dark:border-white/10 sm:py-5">
                      <ProductVariantSelector
                        variants={product.variants}
                        onVariantSelect={handleVariantSelect}
                        selectedVariant={selectedVariant}
                      />
                    </div>
                  )}

                  {/* Quantity selector */}
                  <div className="py-4 sm:py-5">
                    <div className="flex items-center justify-between gap-3">
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
                    <div ref={addToCartRef} className="mt-4 grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddToCart}
                        className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-kwik-orange bg-kwik-orange/5 px-5 font-semibold text-kwik-orange shadow-sm transition-all duration-300 hover:bg-kwik-orange/10 hover:shadow-md"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to cart
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBuyNow}
                        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kwik-orange to-kwik-amber px-5 font-semibold text-white shadow-lg shadow-kwik-orange/25 transition-all duration-300 hover:shadow-xl hover:shadow-kwik-orange/30 hover:brightness-110"
                      >
                        <Zap className="h-4 w-4" />
                        Buy now
                      </motion.button>
                    </div>

                    {/* Wishlist + Share row */}
                    <div className="mt-3 flex gap-3">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleWishlistToggle}
                        className={`relative flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border-2 transition-all duration-300 ${
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
                          className={`h-4 w-4 transition-all duration-300 ${
                            isWishlisted
                              ? "fill-current text-kwik-orange scale-110"
                              : "text-kwik-dark-medium"
                          }`}
                        />
                        <span className="text-xs font-semibold text-kwik-dark">{isWishlisted ? "Wishlisted" : "Wishlist"}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShare}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-kwik-border transition-all duration-300 hover:border-kwik-orange/50 hover:bg-kwik-orange-tint"
                        aria-label="Share product"
                      >
                        <Share2 className="h-4 w-4 text-kwik-dark-medium transition-colors duration-200 group-hover:text-kwik-orange" />
                        <span className="text-xs font-semibold text-kwik-dark">Share</span>
                      </motion.button>
                    </div>
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
                      <div className="group border border-neutral-200 bg-white p-4 text-center transition-all duration-300 hover:border-kwik-orange/30 dark:border-white/10 dark:bg-white/5">
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
                  <div className="py-5">
                    <h2 className="text-lg font-semibold text-kwik-dark">
                      Product description
                    </h2>
                    <ProductDescription description={product.description} />
                  </div>
                </FadeInUp>
              )}

              {/* Product specifications */}
              {product.specifications &&
                product.specifications.length > 0 && (
                <FadeInUp delay={0.35}>
                  <div className="border border-kwik-border p-5 dark:border-white/10">
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
            <div className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5 sm:p-6">
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
            <div className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5 sm:p-6">
              <MarketplaceSectionHeader
                title="Reviews"
                href="#"
                actionLabel="Customer feedback"
              />
              <div className="mt-2 grid gap-6 lg:grid-cols-[260px_1fr]">
                {/* Rating summary */}
                <div className="space-y-4">
                  {/* Average rating */}
                  <div className="rounded-2xl bg-gradient-to-br from-kwik-orange-tint to-kwik-amber-tint p-5 text-center">
                    <p className="text-5xl font-bold text-kwik-dark">
                      {averageRating.toFixed(1)}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={`avg-${idx}`}
                          className={`h-5 w-5 ${
                            idx < Math.round(averageRating)
                              ? "fill-kwik-star text-kwik-star"
                              : "text-kwik-border-light"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-kwik-gray-light">
                      Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>

                  {/* Rating distribution bars (clickable to filter) */}
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star - 1];
                      const pct =
                        totalReviews > 0
                          ? Math.round((count / totalReviews) * 100)
                          : 0;
                      const isActive = filterStar === star;
                      return (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFilterStar(isActive ? null : star)}
                          className={`group flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors ${
                            isActive
                              ? "bg-kwik-orange-tint"
                              : "hover:bg-kwik-bg-surface"
                          }`}
                          aria-pressed={isActive}
                          aria-label={`Filter to ${star}-star reviews`}
                        >
                          <span className="w-3 text-right font-semibold text-kwik-dark">
                            {star}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-kwik-star text-kwik-star" />
                          <div className="flex-1 h-2 overflow-hidden rounded-full bg-kwik-border-light">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-kwik-star to-kwik-amber transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs text-kwik-gray-light">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter reset / sort controls */}
                  <div className="flex flex-col gap-2 border-t border-kwik-border-light pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-kwik-gray-light">
                        Sort by
                      </span>
                      {filterStar !== null && (
                        <button
                          type="button"
                          onClick={() => setFilterStar(null)}
                          className="text-xs font-medium text-kwik-orange hover:underline"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { key: "helpful", label: "Helpful" },
                        { key: "recent", label: "Recent" },
                        { key: "rating", label: "Top" },
                      ] as const).map((opt) => (
                        <button
                          type="button"
                          key={opt.key}
                          onClick={() => setSortBy(opt.key)}
                          className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                            sortBy === opt.key
                              ? "bg-kwik-dark text-white"
                              : "bg-kwik-bg-surface text-kwik-gray hover:bg-kwik-border/40"
                          }`}
                          aria-pressed={sortBy === opt.key}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Write a review CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("write-review-form");
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-kwik-orange bg-kwik-orange-tint px-4 py-2.5 text-sm font-semibold text-kwik-orange-dark transition-colors hover:bg-kwik-orange hover:text-white"
                  >
                    <PenLine className="h-4 w-4" />
                    Write a review
                  </button>
                </div>

                {/* Review cards with hover effects */}
                <div className="space-y-3">
                  {/* Result count summary */}
                  <div className="flex items-center justify-between text-xs text-kwik-gray-light">
                    <span>
                      Showing <span className="font-semibold text-kwik-dark">{visibleReviews.length}</span> of {totalReviews}
                      {filterStar !== null && (
                        <> · filtered to {filterStar}-star</>
                      )}
                    </span>
                  </div>

                  {visibleReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-kwik-border py-10 text-center">
                      <Star className="h-8 w-8 text-kwik-border-light" />
                      <p className="mt-2 text-sm font-medium text-kwik-dark">
                        No {filterStar}-star reviews
                      </p>
                      <p className="mt-1 text-xs text-kwik-gray-light">
                        Try a different filter or sort.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {visibleReviews.map((review) => {
                        const voted = votedReviews.has(review.id);
                        const helpfulCount = (review.helpful ?? 0) + (voted ? 1 : 0);
                        return (
                          <article
                            key={review.id}
                            className="group border border-kwik-border p-5 transition-all duration-300 hover:border-kwik-orange/30 hover:shadow-sm dark:border-white/10"
                          >
                            {/* Header: stars + verified badge */}
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
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
                              {review.verified && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-kwik-green-tint px-2 py-0.5 text-[10px] font-bold text-kwik-green">
                                  <Check className="h-3 w-3" /> Verified
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            {review.title && (
                              <p className="text-sm font-semibold text-kwik-dark">
                                {review.title}
                              </p>
                            )}

                            {/* Body */}
                            <p className="mt-1 text-sm leading-6 text-kwik-gray">
                              {review.text}
                            </p>

                            {/* Photos */}
                            {review.images && review.images.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {review.images.map((img, i) => (
                                  <button
                                    type="button"
                                    key={`${review.id}-img-${i}`}
                                    onClick={() => setLightbox({ src: img, alt: `${review.name}'s photo ${i + 1}` })}
                                    className="relative h-16 w-16 overflow-hidden rounded-lg border border-kwik-border-light bg-kwik-bg-surface transition-transform hover:scale-105"
                                    aria-label={`View photo ${i + 1} from ${review.name}`}
                                  >
                                    <AppImage
                                      src={img}
                                      alt={`${review.name}'s photo ${i + 1}`}
                                      className="h-full w-full"
                                      objectFit="cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Vendor reply sub-thread (cycle 7) */}
                            {review.vendorReply && (
                              <div className="mt-4 rounded-xl border border-kwik-orange/20 bg-gradient-to-br from-kwik-orange-tint/60 to-kwik-amber-tint/40 p-3 sm:p-4">
                                <div className="flex items-start gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kwik-gradient text-white shadow-sm">
                                    <Store className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <p className="text-sm font-semibold text-kwik-dark">
                                        {review.vendorReply.authorName}
                                      </p>
                                      <span className="inline-flex items-center gap-1 rounded-full bg-kwik-orange/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kwik-orange-dark">
                                        <BadgeCheck className="h-2.5 w-2.5" />
                                        Seller
                                      </span>
                                      {review.vendorReply.createdAt && (
                                        <span className="text-[11px] text-kwik-muted">
                                          · {formatRelativeDate(review.vendorReply.createdAt)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm leading-relaxed text-kwik-dark/90">
                                      {review.vendorReply.text}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Footer: author + date + helpful */}
                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-kwik-border pt-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kwik-orange to-kwik-amber text-xs font-bold text-white">
                                  {review.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-kwik-dark">
                                    {review.name}
                                  </p>
                                  <p className="truncate text-xs text-kwik-gray-light">
                                    {review.location}
                                    {review.createdAt && (
                                      <>
                                        {" · "}
                                        {formatRelativeDate(review.createdAt)}
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleHelpfulVote(review.id)}
                                disabled={voted}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                                  voted
                                    ? "border-kwik-orange bg-kwik-orange-tint text-kwik-orange-dark"
                                    : "border-kwik-border text-kwik-gray hover:border-kwik-orange/40 hover:text-kwik-orange"
                                }`}
                                aria-pressed={voted}
                                aria-label="Mark this review as helpful"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {helpfulCount > 0 ? helpfulCount : "Helpful"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FadeInUp>
        )}

        {/* User Reviews + Review Form */}
        <FadeInUp delay={0.1}>
          <div id="write-review-form" className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5 sm:p-6 scroll-mt-20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-kwik-dark sm:text-xl">
                  Customer Reviews
                </h2>
                <p className="text-xs text-kwik-gray-light">
                  Share your experience with this product
                </p>
              </div>
              <ReviewForm productId={product.id} />
            </div>

            <UserReviews productId={product.id} />
          </div>
        </FadeInUp>

        {/* Related Products - "You Might Also Like" with decorative header */}
        <FadeInUp delay={0.1}>
          <div className="border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/5 sm:p-6">
            {/* Decorative section header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-kwik-orange to-kwik-amber shadow-sm shadow-kwik-orange/20">
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
                  className="flex h-11 items-center gap-2 rounded-xl border-2 border-kwik-orange bg-kwik-orange/5 px-4 font-semibold text-kwik-orange shadow-sm transition-all duration-200 hover:bg-kwik-orange/10 flex-shrink-0"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Add to cart</span>
                </motion.button>

                {/* Buy Now */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBuyNow}
                  className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-kwik-orange to-kwik-amber px-5 font-semibold text-white shadow-lg shadow-kwik-orange/20 transition-all duration-200 hover:shadow-xl hover:brightness-110 flex-shrink-0"
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Buy now</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review photo lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Review photo"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close photo"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AppImage
                src={lightbox.src}
                alt={lightbox.alt}
                className="max-h-[85vh] max-w-[85vw] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
