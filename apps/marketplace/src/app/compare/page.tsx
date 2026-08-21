"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Scale,
  X,
  Star,
  Trash2,
  ShoppingCart,
  Heart,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useCompareStore } from "@/stores";
import { useCartStore, useWishlistStore } from "@/stores";
import { kwikToast } from "@/lib/toast";
import { AddToCompareModal } from "@/components/compare/add-to-compare-modal";
import { cn } from "@/lib/utils";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ComparePage() {
  const router = useRouter();
  const products = useCompareStore((s) => s.products);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clearAll = useCompareStore((s) => s.clearAll);

  const addItemToCart = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const wishlistItems = useWishlistStore((s) => s.items);
  const addWishlistItem = useWishlistStore((s) => s.addItem);
  const removeWishlistItem = useWishlistStore((s) => s.removeItem);

  const [showAddModal, setShowAddModal] = useState(false);

  const allSpecKeys = useMemo(() => {
    const keys: string[] = [];
    for (const p of products) {
      for (const k of Object.keys(p.specs)) {
        if (!keys.includes(k)) keys.push(k);
      }
    }
    return keys;
  }, [products]);

  const lowestPriceId = useMemo(() => {
    if (products.length < 2) return null;
    return products.reduce((min, p) => (p.price < min.price ? p : min)).id;
  }, [products]);

  const highestRatingId = useMemo(() => {
    if (products.length < 2) return null;
    return products.reduce((max, p) => (p.rating > max.rating ? p : max)).id;
  }, [products]);

  function handleAddToCart(p: (typeof products)[number]) {
    addItemToCart({
      productId: p.id,
      name: p.name,
      price: p.price,
      comparePrice: p.comparePrice,
      image: p.image,
      store: p.store,
    });
    kwikToast.success("Added to cart", `${p.name} is in your cart.`);
    setCartOpen(true);
  }

  function handleWishlist(p: (typeof products)[number]) {
    const existing = wishlistItems.find((w) => w.id === p.id);
    if (existing) {
      removeWishlistItem(p.id);
    } else {
      addWishlistItem({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.comparePrice,
        image: p.image,
        rating: p.rating,
        category: p.category,
      });
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <section className="kwik-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container mx-auto max-w-7xl px-4 py-5 relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              Side-by-side comparison
            </p>
            <h1 className="mt-1 font-heading text-xl font-bold text-white md:text-2xl">
              Compare Products
            </h1>
            <p className="mt-1 text-sm text-white/85">
              Compare up to 4 products by price, rating, specs, and vendor.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-kwik-border-light bg-kwik-bg-surface py-20 text-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-kwik-orange/5 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-kwik-orange-tint">
                <Scale className="h-8 w-8 text-kwik-orange" />
              </div>
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
              No products to compare yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-kwik-muted">
              Add products to see a side-by-side comparison of prices, ratings,
              and specifications.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-kwik-gradient px-5 text-sm font-semibold text-white shadow-md shadow-kwik-orange/20 hover:opacity-95"
              >
                <Plus className="h-4 w-4" /> Add products
              </button>
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-kwik-border-light bg-background px-5 text-sm font-semibold text-foreground hover:border-kwik-orange/50 hover:text-kwik-orange"
              >
                Browse all <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-kwik-muted">
                Comparing{" "}
                <span className="font-semibold text-foreground">
                  {products.length}
                </span>{" "}
                of 4 products
              </p>
              <div className="flex gap-2">
                {products.length < 4 ? (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-kwik-border-light bg-background px-3 text-sm font-medium text-foreground hover:border-kwik-orange/50 hover:text-kwik-orange"
                  >
                    <Plus className="h-4 w-4" /> Add product
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    clearAll();
                    kwikToast.info("Compare cleared");
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-kwik-border-light bg-background px-3 text-sm font-medium text-kwik-gray hover:text-kwik-red hover:border-kwik-red/30"
                >
                  <Trash2 className="h-4 w-4" /> Clear all
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-kwik-border-light bg-kwik-bg-surface shadow-sm">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-kwik-border-light">
                    <th className="sticky left-0 z-10 w-32 bg-kwik-bg-surface p-4 text-left text-[11px] font-semibold uppercase tracking-wide text-kwik-muted">
                      Product
                    </th>
                    {products.map((p) => (
                      <th key={p.id} className="border-l border-kwik-border-light p-4 align-top">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => removeProduct(p.id)}
                            aria-label={`Remove ${p.name}`}
                            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-kwik-muted shadow-sm transition hover:bg-kwik-red/10 hover:text-kwik-red"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <div className="aspect-square overflow-hidden rounded-lg border border-kwik-border-light bg-kwik-bg-light">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
                            {p.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-kwik-muted">{p.store}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="Price">
                    {products.map((p) => (
                      <td key={p.id} className="border-l border-kwik-border-light p-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-heading text-base font-bold", p.id === lowestPriceId ? "text-kwik-green" : "text-foreground")}>
                            {formatNGN(p.price)}
                          </span>
                          {p.id === lowestPriceId ? (
                            <span className="rounded-full bg-kwik-green/10 px-1.5 py-0.5 text-[10px] font-bold text-kwik-green">Best price</span>
                          ) : null}
                        </div>
                        {p.comparePrice && p.comparePrice > p.price ? (
                          <span className="text-xs text-kwik-muted line-through">{formatNGN(p.comparePrice)}</span>
                        ) : null}
                      </td>
                    ))}
                  </Row>

                  <Row label="Rating">
                    {products.map((p) => (
                      <td key={p.id} className="border-l border-kwik-border-light p-4">
                        <div className="flex items-center gap-1.5">
                          <Star className={cn("h-4 w-4", p.id === highestRatingId ? "fill-kwik-amber text-kwik-amber" : "fill-kwik-muted text-kwik-muted")} />
                          <span className="text-sm font-semibold text-foreground">{p.rating.toFixed(1)}</span>
                          <span className="text-xs text-kwik-muted">({p.reviews})</span>
                          {p.id === highestRatingId ? (
                            <span className="rounded-full bg-kwik-amber/10 px-1.5 py-0.5 text-[10px] font-bold text-kwik-amber">Top rated</span>
                          ) : null}
                        </div>
                      </td>
                    ))}
                  </Row>

                  <Row label="Category">
                    {products.map((p) => (
                      <td key={p.id} className="border-l border-kwik-border-light p-4 text-sm text-foreground">{p.category}</td>
                    ))}
                  </Row>

                  <Row label="Vendor">
                    {products.map((p) => (
                      <td key={p.id} className="border-l border-kwik-border-light p-4 text-sm text-foreground">{p.store}</td>
                    ))}
                  </Row>

                  {allSpecKeys.map((specKey) => (
                    <Row key={specKey} label={specKey}>
                      {products.map((p) => (
                        <td key={p.id} className="border-l border-kwik-border-light p-4 text-sm text-foreground">
                          {p.specs[specKey] ?? <span className="text-kwik-muted">—</span>}
                        </td>
                      ))}
                    </Row>
                  ))}

                  <Row label="Actions">
                    {products.map((p) => {
                      const isWishlisted = wishlistItems.some((w) => w.id === p.id);
                      return (
                        <td key={p.id} className="border-l border-kwik-border-light p-4">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p)}
                              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-kwik-orange text-xs font-semibold text-white shadow-sm shadow-kwik-orange/20 hover:bg-kwik-orange-hover"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" /> Add to cart
                            </button>
                            <button
                              type="button"
                              onClick={() => handleWishlist(p)}
                              className={cn(
                                "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors",
                                isWishlisted
                                  ? "border-kwik-red/30 bg-kwik-red/5 text-kwik-red"
                                  : "border-kwik-border-light bg-background text-kwik-gray hover:text-kwik-red hover:border-kwik-red/30",
                              )}
                            >
                              <Heart className={cn("h-3.5 w-3.5", isWishlisted && "fill-current")} />
                              {isWishlisted ? "Wishlisted" : "Wishlist"}
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/products/${p.id}`)}
                              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-kwik-border-light bg-background text-xs font-semibold text-kwik-orange hover:bg-kwik-orange-tint"
                            >
                              View details <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </Row>
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <AddToCompareModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-kwik-border-light last:border-b-0 hover:bg-kwik-bg-light/40">
      <td className="sticky left-0 z-10 w-32 bg-kwik-bg-surface p-4 text-[11px] font-semibold uppercase tracking-wide text-kwik-muted">
        {label}
      </td>
      {children}
    </tr>
  );
}
