"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  PackageSearch,
  Store,
} from "lucide-react";
import { motion } from "framer-motion";
import { VendorSoftPanel } from "@/components/dashboard/vendor-dashboard-ui";
import {
  PoolCatalogItem,
  poolSourceName,
  poolSourcePrice,
  poolSuggestedPrice,
} from "@/lib/pool";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { useVendorPoolStore } from "@/stores/vendor-pool-store";
import { vendorCommerceApi } from "@/lib/api-client";
import type { VendorPoolOffer } from "@/lib/types";
import { AppButton, EmptyState, FieldInput, SanitizedHTML, Skeleton, SkeletonText, VendorPageHeader } from "@/lib/ui";
import { kwikToast } from "@/lib/utils";

function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function hasHtml(value?: string | null) {
  return Boolean(value && /<\/?[a-z][\s\S]*>/i.test(value));
}

// SanitizedHTML is used in the DescriptionBlock component below for safe markup rendering.

function ReceiptRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="text-sm font-normal text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function DescriptionBlock({ item }: { item: PoolCatalogItem }) {
  const description = item.description?.trim();
  if (!description) {
    return (
      <p className="text-sm font-normal leading-7 text-muted">
        This product is available for vendor sourcing with source-vendor fulfillment.
      </p>
    );
  }
  if (hasHtml(description)) {
    return (
      <SanitizedHTML
        html={description}
        className="pool-description-html text-sm font-normal leading-7 text-muted"
      />
    );
  }
  return <p className="whitespace-pre-line text-sm font-normal leading-7 text-muted">{description}</p>;
}

export default function VendorPoolProductPage() {
  const params = useParams<{ productKey: string }>();
  const router = useRouter();
  const productKey = Array.isArray(params.productKey) ? params.productKey[0] : params.productKey;
  const { fetchPool, findByRouteKey, markSelected } = useVendorPoolStore();
  const [item, setItem] = React.useState<PoolCatalogItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [salePrice, setSalePrice] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        await fetchPool();
        let found = findByRouteKey(productKey);
        if (!found) {
          await fetchPool({ force: true, reset: true });
          found = findByRouteKey(productKey);
        }
        if (!active) return;
        setItem(found ?? null);
        if (found) setSalePrice(poolSuggestedPrice(found));
      } catch {
        if (active) kwikToast.error("Could not load Pool product");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadProduct();
    return () => {
      active = false;
    };
  }, [fetchPool, findByRouteKey, productKey]);

  const saveSelection = async () => {
    if (!item) return;
    const basePrice = poolSourcePrice(item);
    const sourceType = item.sourceType ?? "ADMIN_POOL";
    const minimumSalePrice = sourceType === "VENDOR_PRODUCT"
      ? Math.max(basePrice, Number(item.suggestedRetailPrice ?? basePrice))
      : basePrice;
    if (Number(salePrice) < minimumSalePrice) {
      kwikToast.error("Sale price cannot be lower than the minimum source price");
      return;
    }

    setIsSaving(true);
    try {
      const poolProductId = sourceType === "ADMIN_POOL" ? item.id : undefined;
      const sourceProductId = sourceType === "VENDOR_PRODUCT" ? item.sourceProductId ?? item.id : undefined;
      if (sourceType === "ADMIN_POOL" && !poolProductId) {
        kwikToast.error("Pool product reference is missing");
        return;
      }
      if (sourceType === "VENDOR_PRODUCT" && !sourceProductId) {
        kwikToast.error("Source product reference is missing");
        return;
      }
      const payload = {
        sourceType,
        poolProductId,
        sourceProductId,
        retailPrice: Number(salePrice),
      };
      const response = item.linkedOfferId
        ? await vendorCommerceApi.updatePoolSelection(item.linkedOfferId, {
            retailPrice: Number(salePrice),
            status: "ACTIVE",
            isActive: true,
          })
        : await vendorCommerceApi.createPoolSelection(payload);
      const offer = unwrapApiData<VendorPoolOffer>(response.data);
      const updates = { alreadySelected: true, linkedOfferId: offer.id, linkedProductId: offer.productId };
      setItem((current) => current ? { ...current, ...updates } : current);
      markSelected(item.id, updates);
      kwikToast.success(item.linkedOfferId ? "Pool selection updated" : "Product added to your store");
      router.push("/dashboard/products");
    } catch (error) {
      kwikToast.error(apiErrorMessage(error, "Could not save Pool selection"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="safe-container space-y-5" aria-busy="true" aria-live="polite">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <Skeleton className="h-[420px] w-full rounded-lg" />
            <SkeletonText lines={3} />
            <SkeletonText lines={4} />
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </section>
      </div>
    );
  }

  if (!item) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="safe-container space-y-5"
      >
        <VendorSoftPanel>
          <EmptyState
            variant="error"
            title="Pool product not found"
            description="This product is no longer available in the Pool catalog."
            action={{ label: "Back to Pool", onClick: () => router.push("/dashboard/pool") }}
          />
        </VendorSoftPanel>
      </motion.div>
    );
  }

  const image = Array.isArray(item.images) ? item.images[0] : undefined;
  const basePrice = poolSourcePrice(item);
  const minimumSalePrice = item.sourceType === "VENDOR_PRODUCT"
    ? Math.max(basePrice, Number(item.suggestedRetailPrice ?? basePrice))
    : basePrice;
  const margin = Math.max(0, Number(salePrice) - basePrice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container space-y-5"
    >
      <Link
        href="/dashboard/pool"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        Back to Pool
      </Link>

      <VendorPageHeader
        title={item.name}
        description="Review source details and price rules before adding this product to your storefront."
      />

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="overflow-hidden bg-default-100">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={item.name} className="h-[48vh] min-h-[280px] w-full object-cover md:h-[420px]" />
            ) : (
              <div className="flex h-[48vh] min-h-[280px] items-center justify-center text-muted-foreground md:h-[420px]">
                <PackageSearch className="h-12 w-12" strokeWidth={1.2} />
              </div>
            )}
          </div>

          <VendorSoftPanel title="Description">
            <DescriptionBlock item={item} />
          </VendorSoftPanel>

          <VendorSoftPanel
            title="Source vendor"
            description="This section shows where the product is sourced from and who owns fulfillment."
          >
            <div className="divide-y-0">
              <ReceiptRow label="Vendor" value={poolSourceName(item)} />
              <ReceiptRow label="Source" value={item.sourceType === "VENDOR_PRODUCT" ? "Vendor product" : "Kwikseller Pool"} />
              <ReceiptRow label="Category" value={item.category || "Uncategorized"} />
              <ReceiptRow label="Fulfillment" value="Source vendor" />
              {item.sourceStoreSlug ? <ReceiptRow label="Store slug" value={item.sourceStoreSlug} /> : null}
            </div>
          </VendorSoftPanel>
        </div>

        <VendorSoftPanel
          title={item.alreadySelected ? "Update storefront price" : "Add to my store"}
          description="Your sale price must be equal to or higher than the source price."
        >
          <div className="space-y-4">
            {item.alreadySelected ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                Already in your storefront
              </div>
            ) : null}

            <div className="rounded-lg border border-kwik-border bg-surface p-4 dark:border-white/10 dark:bg-white/5">
              <ReceiptRow label="Source price" value={formatCurrency(basePrice)} />
              <ReceiptRow label="Suggested" value={formatCurrency(poolSuggestedPrice(item))} />
              <ReceiptRow label="Minimum" value={formatCurrency(minimumSalePrice)} />
              <ReceiptRow label="Margin" value={formatCurrency(margin)} />
            </div>

            <FieldInput
              type="number"
              min={minimumSalePrice}
              label="Your sale price"
              value={salePrice}
              onChange={(event) => setSalePrice(Number(event.target.value))}
              className="h-12 rounded-lg bg-surface dark:bg-white/5"
            />
            <AppButton
              type="button"
              size="lg"
              fullWidth
              onClick={saveSelection}
              disabled={isSaving}
            >
              {item.alreadySelected ? "Update product" : "Add product to store"}
            </AppButton>
          </div>
        </VendorSoftPanel>
      </section>
    </motion.div>
  );
}
