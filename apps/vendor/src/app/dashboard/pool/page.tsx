"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUp,
  ChevronRight,
  PackageSearch,
  RefreshCw,
  Search,
  Store,
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

const sourceFilters: Array<{ label: string; value: VendorPoolSourceFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Kwikseller", value: "ADMIN_POOL" },
  { label: "Vendors", value: "VENDOR_PRODUCT" },
];

export default function VendorPoolPage() {
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
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-label="Search Pool"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-[#111827] transition hover:bg-white hover:ring-1 hover:ring-[#E5E7EB] dark:bg-white/8 dark:text-white"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={refreshCatalog}
            disabled={isLoading}
            aria-label="Refresh Pool"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-[#111827] transition hover:bg-white hover:ring-1 hover:ring-[#E5E7EB] disabled:opacity-60 dark:bg-white/8 dark:text-white"
          >
            <RefreshCw className={isLoading ? "h-[18px] w-[18px] animate-spin" : "h-[18px] w-[18px]"} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {showFilters ? (
        <VendorSoftPanel>
          <div className="space-y-3">
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Source">
              {sourceFilters.map((item) => {
                const active = draftSource === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDraftSource(item.value)}
                    className={`filter-tab ${
                      active
                        ? "filter-tab-active"
                        : ""
                    }`}
                  >
                    {item.label}
                  </button>
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
              <button
                type="button"
                onClick={applyFilters}
                disabled={isLoading}
                aria-label="Search"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-white transition hover:bg-[#1F2937] disabled:opacity-60"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
                Clear filters
              </button>
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
          <section className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
            {catalog.map((item) => {
              const image = Array.isArray(item.images) ? item.images[0] : undefined;
              return (
                <Link
                  key={`${item.sourceType}-${item.id}`}
                  href={`/dashboard/pool/product/${poolItemRouteKey(item)}`}
                  className="group premium-card grid grid-cols-[76px_minmax(0,1fr)_28px] items-center gap-3 p-2 transition hover:border-[#D1D5DB] md:flex md:min-h-[292px] md:flex-col md:items-stretch md:gap-0 md:p-0"
                >
                  <div className="relative h-[76px] w-[76px] overflow-hidden rounded-lg bg-[#F7F8FA] md:aspect-[3/4] md:h-auto md:w-full md:rounded-none">
                    {image ? (
                      <img src={image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <PackageSearch className="h-8 w-8" strokeWidth={1.2} />
                      </div>
                    )}
                    {item.alreadySelected ? (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-[#111827] px-2 py-0.5 text-[10px] font-medium text-white md:left-3 md:top-3">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 md:flex md:flex-1 md:flex-col md:p-4">
                    <h2 className="product-title-clamp text-sm font-normal text-[#111827] dark:text-white md:text-sm">
                      {item.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-xs font-normal text-[#6B7280] md:mt-2">
                      <Store className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span className="line-clamp-1">{poolSourceName(item)}</span>
                    </p>
                    <div className="mt-2 md:mt-auto md:pt-4">
                      <p className="hidden text-[11px] font-medium uppercase tracking-wide text-[#6B7280] md:block">
                        Source price
                      </p>
                      <div className="md:mt-1 md:flex md:items-center md:justify-between md:gap-3">
                        <p className="text-base font-semibold leading-tight text-[#111827] dark:text-white md:text-base">
                          {formatCurrency(poolSourcePrice(item))}
                        </p>
                        <span className="hidden h-8 w-8 items-center justify-center rounded-full text-[#111827] transition group-hover:bg-[#111827] group-hover:text-white md:flex">
                          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-[#111827] transition group-hover:bg-[#111827] group-hover:text-white md:hidden">
                    <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </Link>
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

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        className="fixed bottom-20 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111827] transition hover:border-[#111827] dark:bg-[#10131a] dark:text-white"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
