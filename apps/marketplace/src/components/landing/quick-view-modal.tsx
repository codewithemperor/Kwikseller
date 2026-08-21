"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  Heart,
  RotateCcw,
  Shield,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@heroui/react";
import { kwikToast } from "@/lib/toast";
import {
  useCartStore,
  useWishlistStore,
  useRecentlyViewedStore,
} from "@/stores";
import {
  ProductGallery,
  PriceDisplay,
  RatingDisplay,
  StockBadge,
  QuantitySelector,
  formatCurrency,
  discountPercent,
} from "@/components/product/shared";
import { ProductVariantSelector } from "@/components/product/product-variant-selector";
import type { MarketplaceProduct, ProductVariant } from "@/data/marketplace-home";

/**
 * Product Quick View — a concise product summary modal.
 *
 * Purpose (spec #20): Fast product evaluation. Shows only the information
 * required to make a quick decision, with a clear path to the full Product
 * Detail page (/products/[id]).
 *
 * Layout (spec #2, #3): Two-column on md+ (gallery | info), stacks on mobile.
 * Uses the reusable ProductGallery (compact variant) for proper image display.
 *
 * No gradients (spec #24). No dummy data (spec #1).
 */
export function QuickViewModal({
  product,
  isOpen,
  onClose,
}: {
  product: MarketplaceProduct | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!product || !isOpen) return null;

  return (
    <AnimatePresence>
      <QuickViewContent key={product.id} product={product} onClose={onClose} />
    </AnimatePresence>
  );
}

function QuickViewContent({
  product,
  onClose,
}: {
  product: MarketplaceProduct;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(
    product.variants?.[0] ?? null,
  );
  const [variantPrice, setVariantPrice] = React.useState(product.price);

  const { toggleItem, isInWishlist } = useWishlistStore();
  const isLiked = isInWishlist(product.id);
  const addItemToCart = useCartStore((s) => s.addItem);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const router = useRouter();

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
    });
    return () => {
      document.body.style.overflow = "";
    };
  }, [product, addRecentlyViewed]);

  // Reset state when product changes
  React.useEffect(() => {
    setQuantity(1);
    setSelectedVariant(product.variants?.[0] ?? null);
    setVariantPrice(product.price);
  }, [product.id, product.variants, product.price]);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setVariantPrice(variant.price);
  };

  const effectiveStock = selectedVariant?.stock ?? product.stock ?? 0;
  const isOutOfStock = effectiveStock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      kwikToast.error("Out of stock", "This product is currently unavailable.");
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItemToCart({
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
    kwikToast.success(`${quantity}× ${product.name} added to cart`);
    onClose();
  };

  const handleViewProduct = () => {
    onClose();
    router.push(`/products/${product.id}`);
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
    kwikToast.success(!isLiked ? "Added to wishlist" : "Removed from wishlist");
  };

  // Concise summary: strip HTML, truncate to ~160 chars (spec #4 — do NOT dump full description)
  const shortSummary = React.useMemo(() => {
    const raw = product.description || "";
    if (!raw) return "";
    const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > 160 ? text.slice(0, 157).trim() + "…" : text;
  }, [product.description]);

  const discount = discountPercent(variantPrice, product.comparePrice);

  // Key product attributes (spec #4)
  const keyAttributes = React.useMemo(() => {
    const attrs: Array<{ label: string; value: string }> = [];
    if (product.store) attrs.push({ label: "Vendor", value: product.store });
    if (product.category) attrs.push({ label: "Category", value: product.category });
    if (product.tag) attrs.push({ label: "Type", value: product.tag });
    if (product.dimensions) attrs.push({ label: "Dimensions", value: product.dimensions });
    return attrs;
  }, [product.store, product.category, product.tag, product.dimensions]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative my-auto grid max-h-[calc(100dvh-1.5rem)] w-full max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg bg-background shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          isIconOnly
          variant="ghost"
          onPress={onClose}
          className="absolute right-3 top-3 z-30 h-9 w-9 rounded-full bg-background/95 shadow-sm"
          aria-label="Close quick view"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Left: Gallery */}
        <div className="bg-neutral-50 p-4 dark:bg-white/5 sm:p-6 md:max-h-[calc(100dvh-2rem)] md:overflow-y-auto">
          <ProductGallery
            images={product.images?.length ? product.images : [product.image]}
            alt={product.name}
            variant="compact"
            aspectRatio="4/5"
          />
        </div>

        {/* Right: Product Information */}
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto p-5 sm:p-6">
          {/* Vendor */}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kwik-orange">
            {product.store || "Verified vendor"}
          </p>

          {/* Title */}
          <h2 className="mt-2 text-xl font-bold leading-tight text-kwik-dark dark:text-white sm:text-2xl">
            {product.name}
          </h2>

          {/* Rating + Stock */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingDisplay rating={product.rating} reviewCount={product.reviewCount} size="sm" />
            <StockBadge stock={effectiveStock} variant="badge" />
          </div>

          {/* Price */}
          <div className="mt-4">
            <PriceDisplay
              price={variantPrice}
              comparePrice={product.comparePrice}
              size="xl"
              showDiscount
            />
            {discount > 0 && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                You save {formatCurrency((product.comparePrice ?? 0) - variantPrice)}
              </p>
            )}
          </div>

          {/* Short summary (spec #4 — NOT the full description) */}
          {shortSummary && (
            <p className="mt-4 text-sm leading-6 text-kwik-gray dark:text-white/65">
              {shortSummary}
            </p>
          )}

          {/* Key product attributes (spec #4) */}
          {keyAttributes.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-4 dark:border-white/10">
              {keyAttributes.map((attr) => (
                <div key={attr.label}>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-kwik-muted dark:text-white/45">
                    {attr.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-kwik-dark dark:text-white">
                    {attr.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* Variant selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-4">
              <ProductVariantSelector
                variants={product.variants}
                onVariantSelect={handleVariantSelect}
                selectedVariant={selectedVariant}
              />
            </div>
          )}

          {/* Quantity */}
          <div className="mt-4">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={Math.max(1, effectiveStock)}
              disabled={isOutOfStock}
              label="Quantity"
            />
          </div>

          {/* Trust badges */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: Truck, label: "Fast delivery" },
              { icon: Shield, label: "Secure payment" },
              { icon: RotateCcw, label: "Easy returns" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-2.5 text-center dark:border-white/10"
              >
                <Icon className="h-4 w-4 text-kwik-orange" />
                <span className="text-[11px] font-medium text-kwik-dark-medium dark:text-white/65">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 space-y-2.5">
            <div className="grid grid-cols-[1fr_auto] gap-2.5">
              <Button
                onPress={handleAddToCart}
                isDisabled={isOutOfStock}
                className="h-12 min-w-0 rounded-xl bg-kwik-orange px-4 font-semibold text-white hover:bg-kwik-orange-hover disabled:opacity-50"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
              </Button>
              <Button
                isIconOnly
                variant="outline"
                onPress={handleWishlistToggle}
                className="h-12 w-12 rounded-xl border-border"
                aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isLiked ? "fill-current text-kwik-orange" : "text-kwik-dark-medium"
                  }`}
                />
              </Button>
            </div>

            {/* View Full Product — clear button, not just an icon (spec #20) */}
            <Button
              onPress={handleViewProduct}
              variant="outline"
              className="h-11 w-full rounded-xl border-border text-sm font-semibold text-kwik-dark dark:text-white"
            >
              <Eye className="mr-2 h-4 w-4" />
              View full product details
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
