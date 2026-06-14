"use client";

import React from "react";
import { Check, ChevronRight, Pencil, Star, Trash2 } from "lucide-react";
import { AppButton } from "@kwikseller/ui";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function discountPct(price: number, compare?: number) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export type VendorProductCardProps = {
  name: string;
  image?: string;
  store?: string;
  category?: string;
  price: number;
  comparePrice?: number;
  rating?: number;
  statusLabel?: string;
  stockLabel?: string;
  selected?: boolean;
  canDelete?: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
};

export function VendorProductCard({
  name,
  image,
  store = "Vendor product",
  category,
  price,
  comparePrice,
  rating = 0,
  statusLabel,
  stockLabel,
  selected,
  canDelete = true,
  onOpen,
  onEdit,
  onDelete,
  onSelect,
}: VendorProductCardProps) {
  const discount = discountPct(price, comparePrice);

  return (
    <article
      className="group relative flex w-full cursor-pointer flex-col border-b border-neutral-200 pb-4 dark:border-white/10"
      onClick={onOpen}
    >
      <div className="relative aspect-[3/4] min-h-[148px] overflow-hidden bg-neutral-100 dark:bg-white/5 sm:min-h-[190px] md:aspect-[4/5]">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-kwik-bg-light text-kwik-muted dark:bg-white/5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">No image</span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex max-w-[calc(100%-56px)] flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#111827] shadow-sm dark:bg-[#111827]/90 dark:text-white">
              -{discount}%
            </span>
          )}
          {statusLabel && (
            <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#111827] shadow-sm dark:bg-[#111827]/90 dark:text-white">
              {statusLabel}
            </span>
          )}
        </div>

        {onSelect && (
          <AppButton
            type="button"
            size="sm"
            variant={selected ? "primary" : "secondary"}
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 shadow-sm"
            aria-label={selected ? "Deselect product" : "Select product"}
          >
            {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
          </AppButton>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col space-y-3">
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-kwik-dark dark:text-white">{name}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-kwik-muted dark:text-white/55">
            <span className="line-clamp-1">{category || store}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            {comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through dark:text-white/45">{formatPrice(comparePrice)}</p>
            )}
            <p className="text-base font-bold text-kwik-dark dark:text-white">{formatPrice(price)}</p>
            {stockLabel && <p className="mt-0.5 text-[10px] font-medium text-kwik-muted dark:text-white/45">{stockLabel}</p>}
          </div>
          <div className="flex items-center gap-2">
            {onEdit ? (
              <AppButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                className="h-8 w-8 rounded-md border-white/10 bg-[#0b4aa2] p-0 text-white hover:bg-[#083879] dark:bg-white/10 dark:hover:bg-white/15"
                aria-label="Edit product"
              >
                <Pencil className="h-3.5 w-3.5" />
              </AppButton>
            ) : (
              <AppButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen();
                }}
                className="h-8 w-8 rounded-md p-0"
                aria-label="Open product"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </AppButton>
            )}
            {canDelete && onDelete && (
              <AppButton
                type="button"
                size="sm"
                variant="danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 rounded-md p-0"
                aria-label="Delete product"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
