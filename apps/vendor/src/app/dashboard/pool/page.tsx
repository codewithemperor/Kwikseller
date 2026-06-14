"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  PackageSearch,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { VendorSoftPanel } from "@/components/dashboard/vendor-dashboard-ui";
import { KwiksellerLoader } from "@/components/kwikseller-loader";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import {
  poolItemRouteKey,
  poolSourceName,
  poolSourcePrice,
} from "@/lib/pool";
import { formatCurrency } from "@/lib/vendor-format";
import { useVendorPoolStore, type VendorPoolSourceFilter } from "@/stores/vendor-pool-store";
import { AppButton, FieldInput, FieldSelect } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { VendorProductCard } from "@/components/vendor-product-card";

const sourceFilters: Array<{ label: string; value: VendorPoolSourceFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Kwikseller", value: "ADMIN_POOL" },
  { label: "Vendors", value: "VENDOR_PRODUCT" },
];

export default function VendorPoolPage() {
  const router = useRouter();
  const {
    catalog,
    categories,
    search,
    sourceType,
    categoryId,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchPool,
    refreshPool,
    loadMore,
  } = useVendorPoolStore();
  const [showFilters, setShowFilters] = React.useState(false);
  const [draftSearch, setDraftSearch] = React.useState(search);
  const [draftSource, setDraftSource] = React.useState<VendorPoolSourceFilter>(sourceType);
  const [draftCategory, setDraftCategory] = React.useState(categoryId);

  React.useEffect(() => {
    fetchPool().catch(() => undefined);
  }, [fetchPool]);

  React.useEffect(() => {
    setDraftSearch(search);
    setDraftSource(sourceType);
    setDraftCategory(categoryId);
  }, [categoryId, search, sourceType]);

  const applyFilters = async () => {
    try {
      await refreshPool({
        search: draftSearch,
        sourceType: draftSource,
        categoryId: draftCategory,
      });
    } catch (loadError) {
      kwikToast.error(loadError instanceof Error ? loadError.message : "Pool catalog could not load");
    }
  };

  const clearFilters = async () => {
    setDraftSearch("");
    setDraftSource("ALL");
    setDraftCategory("ALL");
    try {
      await refreshPool({ search: "", sourceType: "ALL", categoryId: "ALL" });
    } catch (loadError) {
      kwikToast.error(loadError instanceof Error ? loadError.message : "Pool catalog could not load");
    }
  };

  const refreshCatalog = async () => {
    try {
      await refreshPool();
    } catch (loadError) {
      kwikToast.error(loadError instanceof Error ? loadError.message : "Pool catalog could not load");
    }
  };

  const hasActiveFilters = Boolean(search || sourceType !== "ALL" || categoryId !== "ALL");
  const showInitialLoader = isLoading && !catalog.length;

  return (
    <div className="safe-container space-y-5">
      <section className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight text-foreground md:text-2xl">
            Pool
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-normal leading-6 text-muted-foreground">
            Browse source products from Kwikseller and other vendors. Open a product first, review the source details, then add it to your store.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AppButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowFilters((value) => !value)}
            aria-label="Search Pool"
            className="h-10 w-10 rounded-full p-0"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </AppButton>
          <AppButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={refreshCatalog}
            disabled={isLoading}
            aria-label="Refresh Pool"
            className="h-10 w-10 rounded-full p-0"
          >
            <RefreshCw className={isLoading ? "h-[18px] w-[18px] animate-spin" : "h-[18px] w-[18px]"} strokeWidth={1.5} />
          </AppButton>
        </div>
      </section>

      {showFilters ? (
        <VendorSoftPanel>
          <div className="space-y-3">
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Source">
              {sourceFilters.map((item) => {
                const active = draftSource === item.value;
                return (
                  <AppButton
                    key={item.value}
                    type="button"
                    size="sm"
                    variant={active ? "primary" : "ghost"}
                    onClick={() => setDraftSource(item.value)}
                    className="h-8 rounded-full"
                  >
                    {item.label}
                  </AppButton>
                );
              })}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(118px,0.55fr)_40px] items-end gap-2">
              <FieldInput
                aria-label="Search Pool"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search products or vendors"
                className="premium-search px-4 dark:bg-white/8"
              />
              <FieldSelect
                aria-label="Category"
                value={draftCategory}
                onChange={(event) => setDraftCategory(event.target.value)}
                className="h-10 rounded-full border-0 bg-[#F3F4F6] px-3 text-sm dark:bg-white/8"
              >
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </FieldSelect>
              <AppButton
                type="button"
                size="sm"
                onClick={applyFilters}
                disabled={isLoading}
                aria-label="Search"
                className="h-10 w-10 rounded-full p-0"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </AppButton>
            </div>
            {hasActiveFilters ? (
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-fit"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
                Clear filters
              </AppButton>
            ) : null}
          </div>
        </VendorSoftPanel>
      ) : null}

      {showInitialLoader ? (
        <KwiksellerLoader />
      ) : error && !catalog.length ? (
        <VendorSoftPanel>
          <VendorEmptyState
            title="Pool catalog could not load"
            text={`${error}. Refresh the catalog or sign in again if your session expired.`}
          />
        </VendorSoftPanel>
      ) : catalog.length ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.map((item) => {
              const image = Array.isArray(item.images) ? item.images[0] : undefined;
              const href = `/dashboard/pool/product/${poolItemRouteKey(item)}`;
              return (
                <VendorProductCard
                  key={`${item.sourceType}-${item.id}`}
                  name={item.name}
                  image={image}
                  store={poolSourceName(item)}
                  category={item.category || "Pool product"}
                  price={poolSourcePrice(item)}
                  statusLabel={item.alreadySelected ? "Selected" : undefined}
                  stockLabel="Source price"
                  canDelete={false}
                  onOpen={() => router.push(href)}
                  onEdit={() => router.push(href)}
                />
              );
            })}
          </section>
          {hasMore ? (
            <div className="flex justify-center">
              <AppButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => loadMore().catch((loadError) => kwikToast.error(loadError instanceof Error ? loadError.message : "Pool catalog could not load"))}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </AppButton>
            </div>
          ) : null}
        </>
      ) : (
        <VendorSoftPanel>
          <VendorEmptyState
            title="No Pool products found"
            text={
              hasActiveFilters
                ? "Pool products are loaded, but your current search or filters hide them."
                : "There are no Pool products available right now. Check back after Kwikseller or vendors publish products to the Pool."
            }
            action={
              hasActiveFilters ? (
                <AppButton type="button" variant="secondary" onClick={clearFilters}>
                  Clear filters
                </AppButton>
              ) : undefined
            }
          />
        </VendorSoftPanel>
      )}

      <AppButton
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        className="fixed bottom-20 right-4 z-30 h-10 w-10 rounded-full p-0"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={1.5} />
      </AppButton>
    </div>
  );
}
