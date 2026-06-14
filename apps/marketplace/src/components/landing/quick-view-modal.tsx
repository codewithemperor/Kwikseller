"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  X,
} from "lucide-react";
import { Button, Chip } from "@heroui/react";
import { kwikToast } from "@kwikseller/utils";
import {
  useCartStore,
  useWishlistStore,
  useRecentlyViewedStore,
} from "@/stores";
import { AppImage } from "@/components/ui/app-image";
import type { MarketplaceProduct } from "@/data/marketplace-home";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function ProductDescription({ description }: { description: string }) {
  const className =
    "mt-5 text-sm leading-6 text-kwik-gray dark:text-white/65 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-kwik-dark [&_h1]:dark:text-white [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-kwik-dark [&_h2]:dark:text-white [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:ml-5 [&_ul]:list-disc [&_li]:mb-1";

  if (hasHtmlMarkup(description)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: description }} />;
  }

  return <p className={className}>{description}</p>;
}

function QuickViewContent({
  product,
  onClose,
}: {
  product: MarketplaceProduct;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isLiked = isInWishlist(product.id);
  const addItemToCart = useCartStore((s) => s.addItem);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const router = useRouter();

  React.useEffect(() => {
    document.body.style.overflow = "hidden";

    // Track as recently viewed when modal opens
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

  const handleAddToCart = () => {
    for (let index = 0; index < quantity; index += 1) {
      addItemToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice,
        image: product.image,
        store: product.store,
        productType: product.productType,
        productSource: product.productSource,
        requiresShipping: product.requiresShipping,
      });
    }

    kwikToast.success(`${quantity}x ${product.name} added to cart`);
    onClose();
  };

  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative my-auto grid max-h-[calc(100dvh-1.5rem)] w-full max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto rounded-lg bg-white shadow-2xl dark:bg-[#07111f] sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-5xl md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          isIconOnly
          variant="ghost"
          onPress={onClose}
          className="absolute right-3 top-3 z-20 h-10 min-w-10 rounded-full bg-white/95 shadow-sm dark:bg-[#07111f]/95"
          aria-label="Close quick view"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden pb-5 sm:pb-6  md:pb-7">
          <div className="relative min-h-[255px] bg-neutral-100 dark:bg-white/5 sm:min-h-[360px] md:min-h-[520px]">
            <AppImage
              src={product.image}
              alt={product.name}
              className="h-full w-full"
              objectFit="cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:hidden" />

            <div className="absolute left-4 top-4 z-10 flex gap-2">
              {discount > 0 && (
                <Chip className="bg-red-600 text-white">-{discount}%</Chip>
              )}
              {product.isNew && (
                <Chip className="bg-green-800 text-white">New</Chip>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6  md:p-7 ">
            <div className="border-b border-kwik-border/70 pb-5 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kwik-orange">
                {product.store || "Verified vendor"}
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-kwik-dark dark:text-white sm:text-3xl">
                {product.name}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-kwik-gray-light dark:text-white/55">
                <span className="inline-flex items-center gap-1 rounded-full bg-kwik-star/10 px-2.5 py-1 font-semibold text-kwik-dark dark:text-white">
                  <Star className="h-4 w-4 fill-kwik-star text-kwik-star" />
                  {product.rating.toFixed(1)}
                </span>
                <span>
                  {product.reviewCount}{" "}
                  {product.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>

            <div className="mt-5 border-b border-kwik-border/70 pb-5 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kwik-muted">
                Price
              </p>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <span className="block break-words text-3xl font-bold leading-none text-kwik-dark dark:text-white">
                    {formatCurrency(product.price)}
                  </span>
                  {product.comparePrice && (
                    <span className="mt-1 block text-sm text-kwik-muted line-through">
                      {formatCurrency(product.comparePrice)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    Save {discount}%
                  </span>
                )}
              </div>
            </div>

            <ProductDescription
              description={
                product.description ??
                "A well-rated marketplace product from a trusted seller, with secure payment and reliable delivery support."
              }
            />

            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: Truck, label: "Fast delivery" },
                { icon: Shield, label: "Secure payment" },
                { icon: RotateCcw, label: "Easy returns" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-lg border border-neutral-200 bg-white p-3 text-center dark:border-white/10 dark:bg-white/5"
                >
                  <Icon className="mx-auto h-4 w-4 text-kwik-orange" />
                  <p className="mt-2 text-xs font-medium text-kwik-dark-medium dark:text-white/70">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-kwik-border px-4 py-3 dark:border-white/10">
              <span className="text-sm font-semibold text-kwik-dark dark:text-white">
                Quantity
              </span>
              <div className="flex items-center gap-2 rounded-lg bg-kwik-bg-surface px-1.5 py-1 dark:bg-white/5">
                <Button
                  isIconOnly
                  variant="ghost"
                  className="h-8 min-w-8 rounded-lg"
                  onPress={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-kwik-dark dark:text-white">
                  {quantity}
                </span>
                <Button
                  isIconOnly
                  variant="ghost"
                  className="h-8 min-w-8 rounded-lg"
                  onPress={() => setQuantity((value) => value + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)_3rem_3rem] gap-2 sm:gap-3">
              <Button
                variant="primary"
                onPress={handleAddToCart}
                className="h-12 min-w-0 rounded-xl bg-kwik-orange px-3 font-semibold text-white hover:bg-kwik-orange-hover"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
              </Button>
              <Button
                isIconOnly
                variant="outline"
                onPress={() => {
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
                    !isLiked ? "Added to wishlist" : "Removed from wishlist",
                  );
                }}
                className="h-12 w-full min-w-0 rounded-xl border-kwik-border sm:min-w-12"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isLiked
                      ? "fill-current text-kwik-orange"
                      : "text-kwik-dark-medium"
                  }`}
                />
              </Button>
              <Button
                isIconOnly
                variant="outline"
                onPress={() => {
                  onClose();
                  router.push(`/products/${String(product.id)}`);
                }}
                className="h-12 w-full min-w-0 rounded-xl border-kwik-border sm:min-w-12"
                aria-label="View product details"
              >
                <Eye className="h-5 w-5 text-kwik-dark-medium" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
