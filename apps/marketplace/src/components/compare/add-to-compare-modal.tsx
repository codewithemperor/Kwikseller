"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, PackageOpen } from "lucide-react";
import { useCompareStore } from "@/stores";
import { kwikToast } from "@/lib/toast";
import { browseProducts } from "@/data/browse-products";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * AddToCompareModal — lets the user pick from the browse catalog to add
 * products to the comparison. Extracted into its own file to keep the
 * compare page bundle small.
 */
export function AddToCompareModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}) {
  const addProduct = useCompareStore((s) => s.addProduct);
  const isInCompare = useCompareStore((s) => s.isInCompare);
  const products = useCompareStore((s) => s.products);

  const availableToAdd = browseProducts.filter((p) => !isInCompare(p.id));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Add a product to compare
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {availableToAdd.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <PackageOpen className="h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    All products are already in the comparison.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {availableToAdd.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          const ok = addProduct({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            comparePrice: p.comparePrice,
                            image: p.image,
                            category: p.category,
                            rating: p.rating,
                            reviews: p.reviewCount,
                            store: p.store,
                            specs: {
                              Category: p.category,
                              Vendor: p.store,
                              "Product type": p.productType ?? "Physical",
                              Source: (p.productSource ?? "VENDOR_STOCK")
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (c) => c.toUpperCase()),
                            },
                          });
                          if (ok) {
                            kwikToast.success(`${p.name} added to comparison`);
                            if (products.length + 1 >= 4) onClose();
                            onAdded?.();
                          } else {
                            kwikToast.error("Compare is full", "Maximum 4 products.");
                          }
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition hover:border-border hover:bg-gray-50"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatNGN(p.price)} • {p.store}
                          </p>
                        </div>
                        {isInCompare(p.id) ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Plus className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
