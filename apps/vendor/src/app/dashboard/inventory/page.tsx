"use client";

import React from "react";
import { Boxes, PlusCircle } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Product } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { AppButton, AppModal, FieldInput, FieldSelect } from "@kwikseller/ui";
import { unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

export default function VendorInventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [productId, setProductId] = React.useState("");
  const [quantityDelta, setQuantityDelta] = React.useState(0);
  const [reason, setReason] = React.useState("Manual stock adjustment");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Inventory</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Adjust physical product stock. Checkout uses inventory records and reservations, not product card text.
        </p>
          </div>
          <AppButton type="button" onClick={() => setIsAdjustOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Adjust stock
          </AppButton>
        </div>
      </section>

      <section>
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

      <AppModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Stock adjustment"
        description="Use positive numbers to add stock and negative numbers to reduce available stock."
      >
        <form
          onSubmit={(event) => {
            submitAdjustment(event);
            setIsAdjustOpen(false);
          }}
          className="space-y-4"
        >
          <FieldSelect label="Product" value={productId} onChange={(event) => setProductId(event.target.value)}>
            {physicalProducts.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </FieldSelect>
          <FieldInput type="number" label="Quantity delta" value={quantityDelta} onChange={(event) => setQuantityDelta(Number(event.target.value))} />
          <FieldInput label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          <AppButton fullWidth disabled={isSaving || !productId || quantityDelta === 0} isLoading={isSaving}>
            Apply adjustment
          </AppButton>
        </form>
      </AppModal>
    </div>
  );
}
