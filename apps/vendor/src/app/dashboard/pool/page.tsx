"use client";

import React from "react";
import { CheckCircle2, Filter, PackageSearch, Search, Store, X } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { PoolProduct, PoolSourceType, VendorPoolOffer } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { AppButton, AppModal, FieldInput, FieldSelect } from "@kwikseller/ui";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

type PoolCatalogItem = PoolProduct & {
  sourceType?: PoolSourceType;
  sourceProductId?: string;
  sourceStoreId?: string;
  sourceStoreName?: string;
  sourceStoreSlug?: string;
  sourceBasePrice?: number;
  alreadySelected?: boolean;
  linkedOfferId?: string;
  linkedProductId?: string;
};

type SourceFilter = "ALL" | PoolSourceType;

export default function VendorPoolPage() {
  const [catalog, setCatalog] = React.useState<PoolCatalogItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [selectedItem, setSelectedItem] = React.useState<PoolCatalogItem | null>(null);
  const [retailPrice, setRetailPrice] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadPool = React.useCallback(async (serverSearch?: string, nextCategoryFilter = categoryFilter) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await vendorCommerceApi.listPoolCatalog({
        search: serverSearch?.trim() || undefined,
        categoryId: nextCategoryFilter === "ALL" ? undefined : nextCategoryFilter,
      });
      const items = unwrapApiData<PoolCatalogItem[]>(response.data);
      setCatalog(Array.isArray(items) ? items : []);
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
    return Array.from(new Map(catalog.map((item) => [item.categoryId || item.category || "", item.category || "Uncategorized"])).entries())
      .filter(([key]) => key)
      .map(([id, name]) => ({ id, name }));
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

  const openSelection = (item: PoolCatalogItem) => {
    setSelectedItem(item);
    const basePrice = Number(item.sourceBasePrice ?? item.wholesalePrice ?? 0);
    setRetailPrice(Number(item.suggestedRetailPrice ?? basePrice));
  };

  const saveSelection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItem) return;
    const sourceType = selectedItem.sourceType ?? "ADMIN_POOL";
    const basePrice = Number(selectedItem.sourceBasePrice ?? selectedItem.wholesalePrice ?? 0);
    if (Number(retailPrice) < basePrice) {
      kwikToast.error("Sale price cannot be lower than the source price");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        sourceType,
        poolProductId: sourceType === "ADMIN_POOL" ? selectedItem.id : undefined,
        sourceProductId: sourceType === "VENDOR_PRODUCT" ? selectedItem.sourceProductId ?? selectedItem.id : undefined,
        retailPrice: Number(retailPrice),
      };
      const response = selectedItem.linkedOfferId
        ? await vendorCommerceApi.updatePoolSelection(selectedItem.linkedOfferId, { retailPrice: Number(retailPrice), status: "ACTIVE", isActive: true })
        : await vendorCommerceApi.createPoolSelection(payload);
      const offer = unwrapApiData<VendorPoolOffer>(response.data);
      kwikToast.success(selectedItem.linkedOfferId ? "Pool selection updated" : "Product added to your storefront");
      setSelectedItem(null);
      setCatalog((current) => current.map((item) => {
        const isSame =
          sourceType === "ADMIN_POOL"
            ? item.sourceType === "ADMIN_POOL" && item.id === selectedItem.id
            : item.sourceType === "VENDOR_PRODUCT" && (item.sourceProductId ?? item.id) === (selectedItem.sourceProductId ?? selectedItem.id);
        return isSame
          ? { ...item, alreadySelected: true, linkedOfferId: offer.id, linkedProductId: offer.productId }
          : item;
      }));
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Could not save Pool selection");
    } finally {
      setIsSaving(false);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSourceFilter("ALL");
    setCategoryFilter("ALL");
    loadPool("", "ALL");
  };

  return (
    <div className="space-y-6">
      <section className="border border-border bg-background p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Pool catalog</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Browse products from Kwikseller and verified vendors, set your sale price, and publish selected items to your store.
            </p>
          </div>
          <AppButton type="button" variant="secondary" onClick={() => loadPool(search)} isLoading={isLoading} loadingLabel="Loading">
            <PackageSearch className="h-4 w-4" />
            Refresh
          </AppButton>
        </div>
      </section>

      <section className="grid gap-3 border border-border bg-background p-4 lg:grid-cols-[1fr_180px_220px_auto] lg:items-end">
        <FieldInput
          label="Search Pool"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") loadPool(search);
          }}
          placeholder="Search products or source vendors"
        />
        <FieldSelect label="Source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}>
          <option value="ALL">All sources</option>
          <option value="ADMIN_POOL">Kwikseller</option>
          <option value="VENDOR_PRODUCT">Vendors</option>
        </FieldSelect>
        <FieldSelect label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="ALL">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </FieldSelect>
        <div className="flex gap-2">
          <AppButton type="button" onClick={() => loadPool(search)}>
            <Search className="h-4 w-4" />
            Search
          </AppButton>
          {search ? (
            <AppButton type="button" variant="secondary" onClick={clearSearch} aria-label="Clear search">
              <X className="h-4 w-4" />
            </AppButton>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse border border-border bg-surface" />
          ))}
        </section>
      ) : loadError ? (
        <VendorEmptyState
          title="Pool catalog could not load"
          text={`${loadError}. Please refresh the catalog or sign in again if your session expired.`}
        />
      ) : filteredCatalog.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCatalog.map((item) => {
            const image = Array.isArray(item.images) ? item.images[0] : undefined;
            const basePrice = Number(item.sourceBasePrice ?? item.wholesalePrice ?? 0);
            const sourceName = item.sourceType === "VENDOR_PRODUCT" ? item.sourceStoreName ?? "Vendor source" : "Kwikseller";
            return (
              <article key={`${item.sourceType}-${item.id}`} className="flex min-h-[260px] flex-col border border-border bg-background">
                <div className="aspect-[4/3] bg-surface">
                  {image ? <img src={image} alt={item.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-heading text-base font-semibold text-foreground">{item.name}</h2>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Store className="h-3.5 w-3.5" />
                        {sourceName}
                      </p>
                    </div>
                    {item.alreadySelected ? (
                      <span className="inline-flex shrink-0 items-center gap-1 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description || "Ready to add to your storefront with source-vendor fulfillment."}</p>
                  <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source price</p>
                      <p className="font-heading text-lg font-semibold text-foreground">{formatCurrency(basePrice)}</p>
                    </div>
                    <AppButton type="button" onClick={() => openSelection(item)} className="self-end">
                      <Filter className="h-4 w-4" />
                      {item.alreadySelected ? "Update" : "Select"}
                    </AppButton>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="border border-border bg-background p-6">
          <VendorEmptyState
            title="No Pool products found"
            text={
              catalog.length
                ? "There are Pool products loaded, but your current search or filters hide them."
                : "There are no Pool products available right now. Check back after Kwikseller or vendors publish products to the Pool."
            }
          />
          {search || sourceFilter !== "ALL" || categoryFilter !== "ALL" ? (
            <div className="mt-5 flex justify-center">
              <AppButton type="button" variant="secondary" onClick={clearSearch}>
                Clear filters
              </AppButton>
            </div>
          ) : null}
        </div>
      )}

      <AppModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.alreadySelected ? "Update Pool selection" : "Select Pool product"}
        description="Set the price customers will pay in your storefront."
      >
        {selectedItem ? (
          <form onSubmit={saveSelection} className="space-y-4">
            <div className="border border-border bg-surface/60 p-4">
              <h3 className="font-heading text-base font-semibold text-foreground">{selectedItem.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Source price: {formatCurrency(Number(selectedItem.sourceBasePrice ?? selectedItem.wholesalePrice ?? 0))}
              </p>
            </div>
            <FieldInput
              required
              type="number"
              min={Number(selectedItem.sourceBasePrice ?? selectedItem.wholesalePrice ?? 0)}
              label="Your sale price"
              value={retailPrice}
              onChange={(event) => setRetailPrice(Number(event.target.value))}
            />
            <div className="border border-border bg-background p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Estimated margin</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(Math.max(0, Number(retailPrice) - Number(selectedItem.sourceBasePrice ?? selectedItem.wholesalePrice ?? 0)))}
                </span>
              </div>
            </div>
            <AppButton fullWidth size="lg" isLoading={isSaving} loadingLabel="Saving selection...">
              {selectedItem.alreadySelected ? "Update selection" : "Add to my storefront"}
            </AppButton>
          </form>
        ) : null}
      </AppModal>
    </div>
  );
}
