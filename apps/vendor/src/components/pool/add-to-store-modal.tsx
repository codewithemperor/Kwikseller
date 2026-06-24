"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, TrendingUp } from "lucide-react";
import {
  AppButton,
  AppModal,
  AppImage,
  FieldInput,
} from "@kwikseller/ui";
import { cn, formatCurrency } from "@kwikseller/utils";
import type { PoolCatalogItem } from "@/lib/pool";

export interface AddToStoreModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  poolProduct: PoolCatalogItem | null;
  onSubmit: (data: { retailPrice: number; markup: number }) => Promise<void>;
  isSubmitting?: boolean;
}

const PLATFORM_FEE_RATE = 0.05;

export function AddToStoreModal({
  isOpen,
  onOpenChange,
  poolProduct,
  onSubmit,
  isSubmitting = false,
}: AddToStoreModalProps) {
  const [markup, setMarkup] = React.useState("30");
  const [maxQuantity, setMaxQuantity] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setMarkup("30");
      setMaxQuantity("");
    }
  }, [isOpen]);

  if (!poolProduct) return null;

  const wholesale = Number(poolProduct.sourceBasePrice ?? poolProduct.wholesalePrice ?? 0);
  const markupNum = Number(markup) || 0;
  const retailPrice = Math.round(wholesale * (1 + markupNum / 100));
  const platformFee = Math.round(retailPrice * PLATFORM_FEE_RATE);
  const vendorEarnings = retailPrice - platformFee;
  const minSalePrice = Number((poolProduct as any).poolMinSalePrice ?? 0);
  const belowMinimum = minSalePrice > 0 && retailPrice < minSalePrice;

  const handleSubmit = async () => {
    if (belowMinimum) return;
    await onSubmit({ retailPrice, markup: markupNum });
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Add to Your Store"
      description="Set your retail price and start selling this pool product."
      className="max-w-2xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          <AppButton variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={belowMinimum}
          >
            <Store className="h-4 w-4" />
            Add to Store
          </AppButton>
        </div>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Left: product info */}
        <div className="space-y-3">
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-default-100">
            <AppImage
              src={poolProduct.images?.[0] ?? (poolProduct as any).image}
              alt={poolProduct.name}
              fallbackVariant="product"
              fallbackHint={poolProduct.name}
              className="h-full w-full"
              objectFit="cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{poolProduct.name}</p>
            {poolProduct.description && (
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{poolProduct.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Source: <span className="font-medium text-foreground">
                {poolProduct.sourceType === "VENDOR_PRODUCT" ? poolProduct.sourceStoreName ?? "Vendor" : "Kwikseller"}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Wholesale: <span className="font-bold text-foreground">{formatCurrency(wholesale)}</span>
            </p>
          </div>
        </div>

        {/* Right: pricing editor */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Wholesale price (read-only)</label>
            <div className="mt-1 rounded-lg border border-kwik-border bg-default-100 px-3 py-2.5 text-sm font-bold text-foreground">
              {formatCurrency(wholesale)}
            </div>
          </div>

          <FieldInput
            type="number"
            label="Your markup (%)"
            placeholder="30"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
          />

          {/* Retail price display */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <p className="text-xs text-muted-foreground">Your retail price</p>
            <p className="mt-1 text-2xl font-bold text-accent">{formatCurrency(retailPrice)}</p>
            {belowMinimum && (
              <p className="mt-2 text-xs font-semibold text-danger">
                ⚠️ Price must be at least {formatCurrency(minSalePrice)}
              </p>
            )}
          </div>

          {/* Commission breakdown */}
          <div className="rounded-xl border border-kwik-border bg-surface p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              Commission breakdown
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sale price</span>
                <span className="font-medium text-foreground">{formatCurrency(retailPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (5%)</span>
                <span className="font-medium text-danger">-{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between border-t border-kwik-border pt-1.5">
                <span className="font-semibold text-foreground">Your earnings</span>
                <span className="font-bold text-success">{formatCurrency(vendorEarnings)}</span>
              </div>
            </div>
          </div>

          <FieldInput
            type="number"
            label="Max quantity (optional)"
            placeholder="50"
            value={maxQuantity}
            onChange={(e) => setMaxQuantity(e.target.value)}
          />
        </div>
      </div>
    </AppModal>
  );
}

export default AddToStoreModal;
