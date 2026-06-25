"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, Pencil, Star, Trash2 } from "lucide-react";
import {
  AppButton,
  AppImage,
  PriceDisplay,
  VendorStatusBadge,
} from "@kwikseller/ui";

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
  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative flex w-full cursor-pointer flex-col rounded-2xl border border-kwik-border bg-surface p-3 transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      <div className="relative aspect-[3/4] min-h-[148px] overflow-hidden rounded-xl bg-default-100 sm:min-h-[190px] md:aspect-[4/5]">
        <AppImage
          src={image}
          alt={name}
          fallbackVariant="product"
          fallbackHint={name}
          className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"
          objectFit="cover"
        />

        <div className="absolute left-2 top-2 flex max-w-[calc(100%-56px)] flex-wrap gap-1.5">
          {statusLabel && (
            <VendorStatusBadge
              status={statusLabel}
              size="sm"
              className="border border-border bg-background/95 shadow-sm backdrop-blur"
            />
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
            {selected ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border border-current" />
            )}
          </AppButton>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col space-y-3">
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {name}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="line-clamp-1">{category || store}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-kwik-star text-kwik-star" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <PriceDisplay
              price={price}
              comparePrice={comparePrice}
              size="md"
              showDiscount={false}
              className="flex-col items-start gap-0.5"
            />
            {stockLabel && (
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                {stockLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit ? (
              <AppButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                className="h-8 w-8 rounded-md p-0 text-accent hover:bg-accent/10"
                aria-label="Edit product"
              >
                <Pencil className="h-3.5 w-3.5" />
              </AppButton>
            ) : (
              <AppButton
                type="button"
                size="sm"
                variant="ghost"
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
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 rounded-md p-0 text-danger hover:bg-danger/10"
                aria-label="Delete product"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
