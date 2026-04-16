"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Eye,
  Truck,
  Shield,
  RotateCcw,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Button, Chip, Card } from "@heroui/react";
import { useCartStore } from "@/stores";
import { kwikToast } from "@kwikseller/utils";
import { cn } from "@kwikseller/ui";

// ─── Data ────────────────────────────────────────────────────────

const featuredProduct = {
  id: "spotlight-featured",
  name: "Premium Ankara Print Collection",
  store: "Lagos Fabrics Co.",
  price: 8500,
  comparePrice: 12000,
  image:
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=400&fit=crop",
  rating: 4.8,
  reviews: 156,
  description:
    "Handcrafted Ankara prints made from premium African fabrics. Each piece is unique with vibrant patterns that celebrate African heritage.",
};

const sideProducts = [
  {
    id: "spotlight-2",
    name: "Wireless Bluetooth Speaker",
    store: "TechHub NG",
    price: 15000,
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 89,
  },
  {
    id: "spotlight-3",
    name: "Organic Shea Butter Set",
    store: "Natural Glow",
    price: 4200,
    image:
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=300&fit=crop",
    rating: 4.7,
    reviews: 64,
  },
  {
    id: "spotlight-4",
    name: "Handmade Leather Bag",
    store: "CraftHub Africa",
    price: 22000,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop",
    rating: 4.8,
    reviews: 112,
  },
];

const featureBadges = [
  { icon: Truck, label: "Free Delivery" },
  { icon: Shield, label: "Escrow Protected" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: BadgeCheck, label: "Authentic" },
];

// ─── Helpers ─────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-3.5 h-3.5",
              i < Math.floor(rating)
                ? "fill-warning text-warning"
                : i < rating
                  ? "fill-warning/50 text-warning"
                  : "fill-default-200 text-default-200",
            )}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{rating}</span>
      <span className="text-sm text-default-400">({count})</span>
    </div>
  );
}

// ─── Featured Product Card ───────────────────────────────────────

function FeaturedProductCard() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      productId: featuredProduct.id,
      name: featuredProduct.name,
      price: featuredProduct.price,
      comparePrice: featuredProduct.comparePrice,
      image: featuredProduct.image,
      store: featuredProduct.store,
    });
    kwikToast.success(`${featuredProduct.name} added to cart!`);
  };

  const handleQuickView = () => {
    kwikToast.info("Quick view coming soon!");
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -40 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="border-none shadow-clean hover-lift rounded-2xl overflow-hidden">
        {/* Product Image */}
        <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden">
          <img
            src={featuredProduct.image}
            alt={featuredProduct.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20" />

          {/* Featured Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg kwik-gradient">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 md:p-8">
          {/* Store Name */}
          <p className="text-xs text-accent font-medium mb-1">
            {featuredProduct.store}
          </p>

          {/* Product Name */}
          <h3 className="text-xl sm:text-2xl font-bold mb-3 leading-tight">
            {featuredProduct.name}
          </h3>

          {/* Rating */}
          <div className="mb-4">
            <StarRating
              rating={featuredProduct.rating}
              count={featuredProduct.reviews}
            />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-accent">
              {formatCurrency(featuredProduct.price)}
            </span>
            <span className="text-base text-default-400 line-through">
              {formatCurrency(featuredProduct.comparePrice)}
            </span>
            <Chip size="sm" variant="soft" color="danger" className="ml-1">
              Save{" "}
              {Math.round(
                ((featuredProduct.comparePrice - featuredProduct.price) /
                  featuredProduct.comparePrice) *
                  100,
              )}
              %
            </Chip>
          </div>

          {/* Description */}
          <p className="text-sm text-default-500 leading-relaxed mb-5">
            {featuredProduct.description}
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            {featureBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 bg-default-50 rounded-xl"
              >
                <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-xs font-medium text-default-600">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 font-semibold kwik-shadow"
              onPress={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            <Button size="lg" variant="outline" onPress={handleQuickView}>
              <Eye className="w-4 h-4 mr-2" />
              Quick View
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Side Product Card ──────────────────────────────────────────

function SideProductCard({
  product,
  index,
}: {
  product: (typeof sideProducts)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      store: product.store,
    });
    kwikToast.success(`${product.name} added to cart!`);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
    >
      <Card className="border-none shadow-clean hover-lift rounded-2xl overflow-hidden group cursor-pointer">
        <div className="flex flex-row sm:flex-row md:flex-col">
          {/* Image */}
          <div className="relative w-28 sm:w-32 md:w-full h-24 sm:h-28 md:h-44 flex-shrink-0 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Hover add-to-cart overlay (desktop card layout) */}
            <button
              onClick={handleAddToCart}
              className="hidden md:flex absolute inset-0 items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200"
              aria-label={`Add ${product.name} to cart`}
            >
              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 shadow-lg">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 p-3 sm:p-4 md:p-4 flex flex-col justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-accent font-medium mb-0.5">
                {product.store}
              </p>
              <h4 className="text-sm sm:text-base font-semibold line-clamp-2 mb-2 leading-snug">
                {product.name}
              </h4>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-0.5 mb-1.5">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span className="text-xs font-medium">{product.rating}</span>
              <span className="text-xs text-default-400">
                ({product.reviews})
              </span>
            </div>

            {/* Price + Add button */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-base sm:text-lg font-bold text-accent">
                {formatCurrency(product.price)}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="w-8 h-8 min-w-8 text-accent hover:bg-accent/10"
                onPress={() => {
                  addItem({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    store: product.store,
                  });
                  kwikToast.success(`${product.name} added to cart!`);
                }}
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────

export function ProductSpotlight() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section className="py-16 md:py-20 bg-default-50 relative">
      {/* Pattern overlay */}
      <div className="absolute inset-0 pattern-subtle pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <Chip variant="soft" className="mb-4">
            <Sparkles className="w-4 h-4 mr-1" />
            Editor&apos;s Pick
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Product Spotlight
          </h2>
          <p className="text-default-500 max-w-xl mx-auto text-sm md:text-base">
            Hand-picked products our editors love — quality, style, and value
            you can trust.
          </p>
        </motion.div>

        {/* Two-Column Layout: Featured (7/12) + Side (5/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Featured Product — Left */}
          <div className="lg:col-span-7">
            <FeaturedProductCard />
          </div>

          {/* Side Products — Right */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5">
            {sideProducts.map((product, index) => (
              <SideProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
