"use client";

import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  X,
} from "lucide-react";
import { Button, Chip } from "@heroui/react";
import { kwikToast } from "@kwikseller/utils";
import { useCartStore } from "@/stores";
import type { MarketplaceProduct } from "@/data/marketplace-home";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function QuickViewContent({
  product,
  onClose,
}: {
  product: MarketplaceProduct;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const [isLiked, setIsLiked] = React.useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleAddToCart = () => {
    for (let index = 0; index < quantity; index += 1) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice,
        image: product.image,
        store: product.store,
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-background md:flex-row"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          isIconOnly
          variant="ghost"
          onPress={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/95"
          aria-label="Close quick view"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="relative min-h-[320px] bg-kwik-bg-light md:w-[46%]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
            priority
          />

          <div className="absolute left-4 top-4 flex gap-2">
            {discount > 0 && (
              <Chip className="bg-red-600 text-white">-{discount}%</Chip>
            )}
            {product.isNew && (
              <Chip className="bg-green-800 text-white">New</Chip>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-kwik-orange">
            {product.store}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-kwik-dark">
            {product.name}
          </h2>

          <div className="mt-3 flex items-center gap-2 text-sm text-kwik-gray-light">
            <span className="flex items-center gap-1 font-medium text-kwik-dark">
              <Star className="h-4 w-4 fill-kwik-star text-kwik-star" />
              {product.rating.toFixed(1)}
            </span>
            <span>({product.reviewCount} reviews)</span>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold text-kwik-dark">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-sm text-kwik-muted line-through">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-kwik-gray">
            {product.description ??
              "A well-rated marketplace product from a trusted seller, with secure payment and reliable delivery support."}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: "Fast delivery" },
              { icon: Shield, label: "Secure payment" },
              { icon: RotateCcw, label: "Easy returns" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-2xl bg-kwik-bg-surface p-3 text-center"
              >
                <Icon className="mx-auto h-4 w-4 text-kwik-orange" />
                <p className="mt-2 text-xs font-medium text-kwik-dark-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-semibold text-kwik-dark">
              Quantity
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-kwik-border px-2 py-1">
              <Button
                isIconOnly
                variant="ghost"
                className="h-8 min-w-8 rounded-lg"
                onPress={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-kwik-dark">
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

          <div className="mt-6 grid grid-cols-[1fr_auto_auto] gap-3">
            <Button
              variant="primary"
              onPress={handleAddToCart}
              className="h-12 rounded-xl bg-kwik-orange font-semibold text-white hover:bg-kwik-orange-hover"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to cart
            </Button>
            <Button
              isIconOnly
              variant="outline"
              onPress={() => {
                setIsLiked((value) => !value);
                kwikToast.success(
                  isLiked ? "Removed from wishlist" : "Added to wishlist",
                );
              }}
              className="h-12 min-w-12 rounded-xl border-kwik-border"
            >
              <Heart
                className={`h-5 w-5 ${
                  isLiked ? "fill-current text-kwik-orange" : "text-kwik-dark-medium"
                }`}
              />
            </Button>
            <Button
              isIconOnly
              variant="outline"
              onPress={() => kwikToast.info("Share link copied")}
              className="h-12 min-w-12 rounded-xl border-kwik-border"
            >
              <Share2 className="h-5 w-5 text-kwik-dark-medium" />
            </Button>
          </div>

          <Button
            variant="outline"
            onPress={() => {
              onClose();
              router.push(`/products/${product.id}`);
            }}
            className="mt-3 h-11 rounded-xl border-kwik-border font-semibold text-kwik-dark"
          >
            View more
          </Button>
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
