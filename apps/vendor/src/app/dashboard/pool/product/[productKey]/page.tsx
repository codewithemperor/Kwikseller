"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  PackageSearch,
  Store,
} from "lucide-react";
import {
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { KwiksellerLoader } from "@/components/kwikseller-loader";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import {
  PoolCatalogItem,
  poolSourceName,
  poolSourcePrice,
  poolSuggestedPrice,
} from "@/lib/pool";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { useVendorPoolStore } from "@/stores/vendor-pool-store";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { VendorPoolOffer } from "@kwikseller/types";
import { AppButton, FieldInput } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";

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

function sanitizeDescriptionHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function ReceiptRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function DescriptionBlock({ item }: { item: PoolCatalogItem }) {
  const description = item.description?.trim();
  if (!description) {
    return (
      <p className="text-sm leading-7 text-muted-foreground">
        This product is available for vendor sourcing with source-vendor fulfillment.
      </p>
    );
  }
  if (hasHtml(description)) {
    return (
      <div
        className="pool-description-html text-sm leading-7 text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(description) }}
      />
    );
  }
  return <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{description}</p>;
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
    return <KwiksellerLoader />;
  }

  if (!item) {
    return (
      <VendorSoftPanel>
        <VendorEmptyState
          title="Pool product not found"
          text="This product is no longer available in the Pool catalog."
          action={
            <Link
              href="/dashboard/pool"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-accent-foreground"
            >
              Back to Pool
            </Link>
          }
        />
      </VendorSoftPanel>
    );
  }

  const image = Array.isArray(item.images) ? item.images[0] : undefined;
  const basePrice = poolSourcePrice(item);
  const minimumSalePrice = item.sourceType === "VENDOR_PRODUCT"
    ? Math.max(basePrice, Number(item.suggestedRetailPrice ?? basePrice))
    : basePrice;
  const margin = Math.max(0, Number(salePrice) - basePrice);

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/pool"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pool
      </Link>

      <VendorPageHeader
        title={item.name}
        description="Review source details and price rules before adding this product to your storefront."
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[22px] border border-border bg-surface">
            {image ? (
              <img src={image} alt={item.name} className="aspect-[16/8] h-full w-full object-cover md:aspect-[16/6]" />
            ) : (
              <div className="flex aspect-[16/8] items-center justify-center text-muted-foreground md:aspect-[16/6]">
                <PackageSearch className="h-12 w-12" />
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
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Already in your storefront
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-white p-4 dark:bg-white/5">
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
              className="h-12 rounded-2xl bg-white dark:bg-white/5"
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
      {isSaving ? <KwiksellerLoader overlay /> : null}
    </div>
  );
}
