"use client";

import React from "react";
import { Users } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { PoolProduct, VendorPoolOffer } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

export default function VendorPoolPage() {
  const [catalog, setCatalog] = React.useState<PoolProduct[]>([]);
  const [offers, setOffers] = React.useState<VendorPoolOffer[]>([]);
  const [selected, setSelected] = React.useState("");
  const [retailPrice, setRetailPrice] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadPool = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [catalogResponse, dashboardResponse] = await Promise.all([
        vendorCommerceApi.listPoolCatalog(),
        vendorCommerceApi.getDashboard(),
      ]);
      const catalogList = unwrapApiData<PoolProduct[]>(catalogResponse.data);
      const dashboard = unwrapApiData<{ poolOffers?: VendorPoolOffer[] }>(dashboardResponse.data);
      setCatalog(catalogList);
      setOffers(dashboard.poolOffers ?? []);
      setSelected((current) => current || catalogList[0]?.id || "");
      setRetailPrice((current) => current || Number(catalogList[0]?.suggestedRetailPrice ?? catalogList[0]?.wholesalePrice ?? 0));
    } catch {
      kwikToast.error("Could not load Pool catalog");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPool();
  }, [loadPool]);

  const selectedProduct = catalog.find((item) => item.id === selected);

  const optIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      await vendorCommerceApi.createPoolOffer({
        poolProductId: selectedProduct.id,
        retailPrice: Number(retailPrice),
        markup: Math.max(0, Number(retailPrice) - Number(selectedProduct.wholesalePrice ?? 0)),
      });
      kwikToast.success("Pool product published to your storefront");
      loadPool();
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Pool opt-in failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Pool catalog</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Opt into admin Pool products, set retail markup, and publish resale products to your storefront.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={optIn} className="border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-semibold">Create Pool offer</h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Pool product</span>
              <select
                value={selected}
                onChange={(event) => {
                  const next = catalog.find((item) => item.id === event.target.value);
                  setSelected(event.target.value);
                  setRetailPrice(Number(next?.suggestedRetailPrice ?? next?.wholesalePrice ?? 0));
                }}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            {selectedProduct && (
              <div className="border border-border p-3 text-sm leading-6 text-muted-foreground">
                <p className="font-semibold text-foreground">{selectedProduct.name}</p>
                <p>Wholesale: {formatCurrency(selectedProduct.wholesalePrice)}</p>
                <p>Type: {selectedProduct.productType}</p>
              </div>
            )}
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Your retail price</span>
              <input type="number" min={0} value={retailPrice} onChange={(event) => setRetailPrice(Number(event.target.value))} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
            </label>
            <button disabled={isSaving || !selectedProduct} className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {isSaving ? "Publishing..." : "Publish Pool offer"}
            </button>
          </div>
        </form>

        <section className="border border-border bg-background">
          <div className="border-b border-border p-4">
            <h2 className="font-heading text-base font-semibold">Your Pool offers</h2>
            <p className="text-sm text-muted-foreground">{offers.length} active or draft offer{offers.length === 1 ? "" : "s"}</p>
          </div>
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading Pool data...</div>
          ) : offers.length ? (
            <div className="divide-y divide-border">
              {offers.map((offer) => (
                <article key={offer.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <h3 className="font-semibold text-foreground">{offer.poolProduct?.name ?? offer.poolProductId}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Status: {offer.status}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="font-bold text-foreground">{formatCurrency(offer.retailPrice)}</p>
                    <p className="text-xs text-muted-foreground">Markup: {formatCurrency(offer.markup)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <VendorEmptyState title="No Pool offers yet" text="Choose a Pool catalog product and publish it with your markup." />
          )}
        </section>
      </section>
    </div>
  );
}
