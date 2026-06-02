"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Filter,
  PackageSearch,
  Search,
  Store,
  X,
} from "lucide-react";
import {
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import {
  PoolCatalogItem,
  poolItemRouteKey,
  poolSourceName,
  poolSourcePrice,
} from "@/lib/pool";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { PoolSourceType } from "@kwikseller/types";
import { AppButton, FieldInput, FieldSelect } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";

type SourceFilter = "ALL" | PoolSourceType;

const PAGE_SIZE = 12;

export default function VendorPoolPage() {
  const [catalog, setCatalog] = React.useState<PoolCatalogItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadPool = React.useCallback(async (serverSearch?: string, nextCategoryFilter = categoryFilter) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await vendorCommerceApi.listPoolCatalog({
        search: serverSearch?.trim() || undefined,
        categoryId: nextCategoryFilter === "ALL" ? undefined : nextCategoryFilter,
        limit: 500,
      });
      const items = unwrapApiData<PoolCatalogItem[]>(response.data);
      setCatalog(Array.isArray(items) ? items : []);
      setVisibleCount(PAGE_SIZE);
    } catch (error) {
      setCatalog([]);
      const message = error instanceof Error ? error.message : "Pool catalog is not available yet";
      setLoadError(message);
      kwikToast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  React.useEffect(() => {
    loadPool();
  }, [loadPool]);

  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, string>();
    catalog.forEach((item) => {
      const id = item.categoryId || item.category || "";
      if (id) categoryMap.set(id, item.category || "Uncategorized");
    });
    return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
  }, [catalog]);

  const filteredCatalog = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesSource = sourceFilter === "ALL" || item.sourceType === sourceFilter;
      const matchesCategory = categoryFilter === "ALL" || item.categoryId === categoryFilter || item.category === categoryFilter;
      const matchesSearch = !query || [item.name, item.description, item.sourceStoreName, item.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return matchesSource && matchesCategory && matchesSearch;
    });
  }, [catalog, categoryFilter, search, sourceFilter]);

  const visibleCatalog = filteredCatalog.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCatalog.length;

  const clearFilters = () => {
    setSearch("");
    setSourceFilter("ALL");
    setCategoryFilter("ALL");
    loadPool("", "ALL");
  };

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Pool"
        description="Browse source products from Kwikseller and other vendors. Open a product first, review the source details, then add it to your store."
        action={
          <AppButton type="button" variant="secondary" onClick={() => loadPool(search)} isLoading={isLoading} loadingLabel="Loading">
            <PackageSearch className="h-4 w-4" />
            Refresh
          </AppButton>
        }
      />

      <VendorSoftPanel>
        <div className="grid gap-3 lg:grid-cols-[1fr_170px_220px_auto] lg:items-end">
          <FieldInput
            label="Search Pool"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") loadPool(search);
            }}
            placeholder="Search products or source vendors"
            className="h-12 rounded-2xl bg-surface"
          />
          <FieldSelect
            label="Source"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
            className="h-12 rounded-2xl bg-surface"
          >
            <option value="ALL">All sources</option>
            <option value="ADMIN_POOL">Kwikseller</option>
            <option value="VENDOR_PRODUCT">Vendors</option>
          </FieldSelect>
          <FieldSelect
            label="Category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-12 rounded-2xl bg-surface"
          >
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </FieldSelect>
          <div className="flex gap-2">
            <AppButton type="button" size="lg" onClick={() => loadPool(search)}>
              <Search className="h-4 w-4" />
              Search
            </AppButton>
            {search || sourceFilter !== "ALL" || categoryFilter !== "ALL" ? (
              <AppButton type="button" size="lg" variant="secondary" onClick={clearFilters} aria-label="Clear filters">
                <X className="h-4 w-4" />
              </AppButton>
            ) : null}
          </div>
        </div>
      </VendorSoftPanel>

      {isLoading ? (
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-[24px] bg-background" />
          ))}
        </section>
      ) : loadError ? (
        <VendorSoftPanel>
          <VendorEmptyState
            title="Pool catalog could not load"
            text={`${loadError}. Refresh the catalog or sign in again if your session expired.`}
          />
        </VendorSoftPanel>
      ) : visibleCatalog.length ? (
        <>
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {visibleCatalog.map((item) => {
              const image = Array.isArray(item.images) ? item.images[0] : undefined;
              return (
                <Link
                  key={`${item.sourceType}-${item.id}`}
                  href={`/dashboard/pool/product/${poolItemRouteKey(item)}`}
                  className="group flex min-h-[300px] flex-col overflow-hidden rounded-[24px] border border-border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] bg-surface">
                    {image ? (
                      <img src={image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <PackageSearch className="h-9 w-9" />
                      </div>
                    )}
                    {item.alreadySelected ? (
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="line-clamp-2 font-heading text-base font-semibold text-foreground">
                      {item.name}
                    </h2>
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Store className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{poolSourceName(item)}</span>
                    </p>
                    <div className="mt-auto pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Source price
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="font-heading text-lg font-semibold text-foreground">
                          {formatCurrency(poolSourcePrice(item))}
                        </p>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
          {hasMore ? (
            <div className="flex justify-center">
              <AppButton type="button" variant="secondary" size="lg" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Load more
              </AppButton>
            </div>
          ) : null}
        </>
      ) : (
        <VendorSoftPanel>
          <VendorEmptyState
            title="No Pool products found"
            text={
              catalog.length
                ? "Pool products are loaded, but your current search or filters hide them."
                : "There are no Pool products available right now. Check back after Kwikseller or vendors publish products to the Pool."
            }
            action={
              search || sourceFilter !== "ALL" || categoryFilter !== "ALL" ? (
                <AppButton type="button" variant="secondary" onClick={clearFilters}>
                  <Filter className="h-4 w-4" />
                  Clear filters
                </AppButton>
              ) : undefined
            }
          />
        </VendorSoftPanel>
      )}
    </div>
  );
}
