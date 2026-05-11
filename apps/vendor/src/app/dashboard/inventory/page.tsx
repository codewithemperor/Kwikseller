"use client";

import React from "react";
import { Boxes, PlusCircle } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Product } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

export default function VendorInventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [productId, setProductId] = React.useState("");
  const [quantityDelta, setQuantityDelta] = React.useState(0);
  const [reason, setReason] = React.useState("Manual stock adjustment");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadProducts = React.useCallback(() => {
    setIsLoading(true);
    vendorCommerceApi
      .listProducts()
      .then((response) => {
        const list = unwrapApiData<Product[]>(response.data);
        setProducts(list);
        setProductId((current) => current || list[0]?.id || "");
      })
      .catch(() => kwikToast.error("Could not load inventory"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const submitAdjustment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || quantityDelta === 0) return;
    setIsSaving(true);
    try {
      await vendorCommerceApi.adjustInventory(productId, { quantityDelta, reason });
      kwikToast.success("Inventory adjusted");
      setQuantityDelta(0);
      loadProducts();
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Inventory adjustment failed");
    } finally {
      setIsSaving(false);
    }
  };

  const physicalProducts = products.filter((product) => product.productType !== "DIGITAL");

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Inventory</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Adjust physical product stock. Checkout uses inventory records and reservations, not product card text.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={submitAdjustment} className="border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-semibold">Stock adjustment</h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Product</span>
              <select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                {physicalProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Quantity delta</span>
              <input type="number" value={quantityDelta} onChange={(event) => setQuantityDelta(Number(event.target.value))} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
              <p className="mt-1 text-xs text-muted-foreground">Use positive numbers to add stock, negative numbers to reduce stock.</p>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Reason</span>
              <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
            </label>
            <button disabled={isSaving || !productId || quantityDelta === 0} className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {isSaving ? "Saving..." : "Apply adjustment"}
            </button>
          </div>
        </form>

        <section className="border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <Boxes className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-heading text-base font-semibold">Stock ledger</h2>
              <p className="text-sm text-muted-foreground">Available, reserved, and low-stock thresholds.</p>
            </div>
          </div>
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading inventory...</div>
          ) : physicalProducts.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Available</th><th className="px-4 py-3">Reserved</th><th className="px-4 py-3">Threshold</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {physicalProducts.map((product) => {
                    const inventory = product.inventoryItems?.[0];
                    return (
                      <tr key={product.id}>
                        <td className="px-4 py-3 font-semibold text-foreground">{product.name}</td>
                        <td className="px-4 py-3">{inventory?.available ?? product.stock ?? 0}</td>
                        <td className="px-4 py-3">{inventory?.reserved ?? 0}</td>
                        <td className="px-4 py-3">{inventory?.lowStockThreshold ?? product.lowStock ?? 5}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <VendorEmptyState title="No physical products" text="Create a physical product before managing stock." />
          )}
        </section>
      </section>
    </div>
  );
}
