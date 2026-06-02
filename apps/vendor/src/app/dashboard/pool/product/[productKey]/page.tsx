"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
  PackageSearch,
  Store,
  Truck,
} from "lucide-react";
import {
  VendorMetricCard,
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import {
  PoolCatalogItem,
  matchesPoolRouteKey,
  poolSourceName,
  poolSourcePrice,
  poolSuggestedPrice,
} from "@/lib/pool";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { VendorPoolOffer } from "@kwikseller/types";
import { AppButton, FieldInput } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";

export default function VendorPoolProductPage() {
  const params = useParams<{ productKey: string }>();
  const router = useRouter();
  const productKey = Array.isArray(params.productKey) ? params.productKey[0] : params.productKey;
  const [item, setItem] = React.useState<PoolCatalogItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [salePrice, setSalePrice] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    vendorCommerceApi
      .listPoolCatalog({ limit: 500 })
      .then((response) => {
        if (!active) return;
        const catalog = unwrapApiData<PoolCatalogItem[]>(response.data);
        const found = Array.isArray(catalog)
          ? catalog.find((entry) => matchesPoolRouteKey(entry, productKey))
          : undefined;
        setItem(found ?? null);
        if (found) setSalePrice(poolSuggestedPrice(found));
      })
      .catch(() => kwikToast.error("Could not load Pool product"))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productKey]);

  const saveSelection = async () => {
    if (!item) return;
    const basePrice = poolSourcePrice(item);
    if (Number(salePrice) < basePrice) {
      kwikToast.error("Sale price cannot be lower than the source price");
      return;
    }

    setIsSaving(true);
    try {
      const sourceType = item.sourceType ?? "ADMIN_POOL";
      const payload = {
        sourceType,
        poolProductId: sourceType === "ADMIN_POOL" ? item.id : undefined,
        sourceProductId: sourceType === "VENDOR_PRODUCT" ? item.sourceProductId ?? item.id : undefined,
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
      setItem((current) => current ? { ...current, alreadySelected: true, linkedOfferId: offer.id, linkedProductId: offer.productId } : current);
      kwikToast.success(item.linkedOfferId ? "Pool selection updated" : "Product added to your store");
      router.push("/dashboard/products");
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Could not save Pool selection");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="h-[520px] animate-pulse rounded-[28px] bg-background" />
        <div className="h-[360px] animate-pulse rounded-[28px] bg-background" />
      </div>
    );
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
  const margin = Math.max(0, Number(salePrice) - basePrice);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/pool"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pool
      </Link>

      <VendorPageHeader
        title={item.name}
        description="Review the source product, fulfillment owner, and price rules before adding it to your storefront."
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <VendorSoftPanel>
          <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[24px] bg-surface">
              {image ? (
                <img src={image} alt={item.name} className="aspect-square h-full w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center text-muted-foreground">
                  <PackageSearch className="h-12 w-12" />
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Store className="h-4 w-4" />
                  Source vendor
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
                  {poolSourceName(item)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description || "This product is available for vendor sourcing with source-vendor fulfillment."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <VendorMetricCard
                  label="Source price"
                  value={formatCurrency(basePrice)}
                  icon={PackageCheck}
                  tone="accent"
                />
                <VendorMetricCard
                  label="Suggested"
                  value={formatCurrency(poolSuggestedPrice(item))}
                  icon={PackageSearch}
                />
                <VendorMetricCard
                  label="Fulfillment"
                  value="Source"
                  note="Delivery follows original vendor"
                  icon={Truck}
                  tone="success"
                />
              </div>
            </div>
          </div>
        </VendorSoftPanel>

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
            <FieldInput
              type="number"
              min={basePrice}
              label="Your sale price"
              value={salePrice}
              onChange={(event) => setSalePrice(Number(event.target.value))}
              className="h-12 rounded-2xl bg-surface"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Minimum</p>
                <p className="mt-2 font-heading text-lg font-semibold text-foreground">{formatCurrency(basePrice)}</p>
              </div>
              <div className="rounded-2xl bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Margin</p>
                <p className="mt-2 font-heading text-lg font-semibold text-foreground">{formatCurrency(margin)}</p>
              </div>
            </div>
            <AppButton
              type="button"
              size="lg"
              fullWidth
              onClick={saveSelection}
              isLoading={isSaving}
              loadingLabel="Saving..."
            >
              {item.alreadySelected ? "Update product" : "Add product to store"}
            </AppButton>
          </div>
        </VendorSoftPanel>
      </section>
    </div>
  );
}
