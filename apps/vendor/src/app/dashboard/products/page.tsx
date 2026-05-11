"use client";

import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Product, ProductType } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

const blankForm = {
  name: "",
  description: "",
  price: 0,
  productType: "PHYSICAL" as ProductType,
  initialStock: 0,
};

export default function VendorProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [form, setForm] = React.useState(blankForm);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadProducts = React.useCallback(() => {
    setIsLoading(true);
    vendorCommerceApi
      .listProducts()
      .then((response) => setProducts(unwrapApiData<Product[]>(response.data)))
      .catch(() => kwikToast.error("Could not load vendor products"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await vendorCommerceApi.createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        productType: form.productType,
        requiresShipping: form.productType === "PHYSICAL",
        trackInventory: form.productType === "PHYSICAL",
        initialStock: form.productType === "PHYSICAL" ? Number(form.initialStock) : undefined,
      });
      kwikToast.success("Product created");
      setForm(blankForm);
      loadProducts();
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Product creation failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Products</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create physical or digital products. Physical items create inventory records for checkout validation.
          </p>
        </div>
        <button onClick={loadProducts} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={createProduct} className="border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-semibold">Create product</h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Name</span>
              <input required value={form.name} onChange={(event) => setForm((v) => ({ ...v, name: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Description</span>
              <textarea required value={form.description} onChange={(event) => setForm((v) => ({ ...v, description: event.target.value }))} rows={4} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Type</span>
                <select value={form.productType} onChange={(event) => setForm((v) => ({ ...v, productType: event.target.value as ProductType }))} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                  <option value="PHYSICAL">Physical</option>
                  <option value="DIGITAL">Digital</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Price</span>
                <input type="number" min={0} value={form.price} onChange={(event) => setForm((v) => ({ ...v, price: Number(event.target.value) }))} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
            </div>
            {form.productType === "PHYSICAL" && (
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Initial stock</span>
                <input type="number" min={0} value={form.initialStock} onChange={(event) => setForm((v) => ({ ...v, initialStock: Number(event.target.value) }))} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
            )}
            <button disabled={isSaving} className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {isSaving ? "Saving..." : "Create product"}
            </button>
          </div>
        </form>

        <section className="border border-border bg-background">
          <div className="border-b border-border p-4">
            <h2 className="font-heading text-base font-semibold">Catalog</h2>
            <p className="text-sm text-muted-foreground">{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>
          {isLoading ? (
            <div className="grid gap-3 p-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse bg-surface" />)}</div>
          ) : products.length ? (
            <div className="divide-y divide-border">
              {products.map((product) => {
                const inventory = product.inventoryItems?.[0];
                return (
                  <article key={product.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        <span className="bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground">{product.productType ?? "PHYSICAL"}</span>
                        <span className="bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground">{product.productSource ?? "VENDOR_STOCK"}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <div className="md:text-right">
                      <p className="font-bold text-foreground">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-muted-foreground">Available: {inventory?.available ?? product.stock ?? 0}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <VendorEmptyState title="No products yet" text="Create your first vendor stock or digital product to start testing checkout." />
          )}
        </section>
      </section>
    </div>
  );
}
