"use client";

import React from "react";
import { Boxes, Plus, RefreshCw } from "lucide-react";
import { uploadApi, vendorCommerceApi } from "@kwikseller/api-client";
import type { Product, ProductType } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import { AppButton, AppModal, AppSwitch, FieldInput, FieldSelect, FieldTextarea } from "@kwikseller/ui";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { VendorEmptyState } from "@/components/vendor-empty-state";

const blankForm = {
  name: "",
  description: "",
  price: 0,
  comparePrice: 0,
  sku: "",
  productType: "PHYSICAL" as ProductType,
  initialStock: 0,
  lowStock: 5,
  images: [] as string[],
  poolEnabled: false,
  poolBasePrice: 0,
  poolMinSalePrice: 0,
  poolMaxSelectableQuantity: 0,
};

function uploadedUrl(response: any) {
  const data = unwrapApiData<any>(response.data);
  return data?.secureUrl || data?.url || data?.data?.secureUrl || data?.data?.url || "";
}

export default function VendorProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [form, setForm] = React.useState(blankForm);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

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
        description: form.description || undefined,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        sku: form.sku || undefined,
        productType: form.productType,
        requiresShipping: form.productType === "PHYSICAL",
        trackInventory: form.productType === "PHYSICAL",
        initialStock: form.productType === "PHYSICAL" ? Number(form.initialStock) : undefined,
        lowStock: form.productType === "PHYSICAL" ? Number(form.lowStock) : undefined,
        images: form.images,
        poolEnabled: form.productType === "PHYSICAL" ? form.poolEnabled : false,
        poolBasePrice: form.poolEnabled ? Number(form.poolBasePrice || form.price) : undefined,
        poolMinSalePrice: form.poolEnabled ? Number(form.poolMinSalePrice || form.poolBasePrice || form.price) : undefined,
        poolMaxSelectableQuantity: form.poolEnabled && form.poolMaxSelectableQuantity ? Number(form.poolMaxSelectableQuantity) : undefined,
      });
      kwikToast.success("Product created");
      setForm(blankForm);
      setIsCreateOpen(false);
      loadProducts();
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Product creation failed");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const uploads = await Promise.all(Array.from(files).slice(0, 5).map((file) => uploadApi.productImage(file)));
      const urls = uploads.map(uploadedUrl).filter(Boolean);
      setForm((current) => ({ ...current, images: [...current.images, ...urls].slice(0, 5) }));
      kwikToast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 border border-border bg-background p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Products</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create physical or digital products. Physical items create inventory records for checkout validation.
          </p>
        </div>
        <div className="flex gap-2">
          <AppButton type="button" variant="secondary" onClick={loadProducts} className="h-12">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </AppButton>
          <AppButton type="button" onClick={() => setIsCreateOpen(true)} className="h-12">
            <Plus className="h-4 w-4" />
            Create
          </AppButton>
        </div>
      </section>

      <section className="overflow-hidden border border-border bg-background shadow-sm">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-accent" />
              <h2 className="font-heading text-base font-semibold">Catalog</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{products.length} product{products.length === 1 ? "" : "s"}</p>
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
                        <h3 className="line-clamp-1 font-heading text-base font-semibold text-foreground">{product.name}</h3>
                        <span className="bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-soft-foreground">{product.productType ?? "PHYSICAL"}</span>
                        {product.poolEnabled ? (
                          <span className="bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                            Available in Pool
                          </span>
                        ) : null}
                        {product.productSource === "POOL_RESALE" ? (
                          <span className="bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            Pool sourced
                          </span>
                        ) : null}
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

      <AppModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create product"
        description="Create a draft quickly, then add images, inventory, delivery, and publish details."
      >
        <form onSubmit={createProduct} className="space-y-4">
          <FieldInput required label="Name" value={form.name} onChange={(event) => setForm((v) => ({ ...v, name: event.target.value }))} />
          <FieldTextarea label="Description" value={form.description} onChange={(event) => setForm((v) => ({ ...v, description: event.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <FieldSelect label="Type" value={form.productType} onChange={(event) => setForm((v) => ({ ...v, productType: event.target.value as ProductType }))}>
              <option value="PHYSICAL">Physical</option>
              <option value="DIGITAL">Digital</option>
            </FieldSelect>
            <FieldInput required type="number" min={0} label="Price" value={form.price} onChange={(event) => setForm((v) => ({ ...v, price: Number(event.target.value) }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldInput type="number" min={0} label="Compare price" value={form.comparePrice} onChange={(event) => setForm((v) => ({ ...v, comparePrice: Number(event.target.value) }))} />
            <FieldInput label="SKU" value={form.sku} onChange={(event) => setForm((v) => ({ ...v, sku: event.target.value }))} />
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Product images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => uploadImages(event.target.files)}
              className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:h-10 file:border-0 file:bg-accent file:px-4 file:text-sm file:font-semibold file:text-white"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              {isUploading ? "Uploading..." : `${form.images.length}/5 images added`}
            </span>
          </label>
          {form.images.length ? (
            <div className="grid grid-cols-5 gap-2">
              {form.images.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, images: current.images.filter((image) => image !== url) }))}
                  className="aspect-square overflow-hidden border border-border bg-surface"
                  title="Remove image"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
          {form.productType === "PHYSICAL" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FieldInput type="number" min={0} label="Initial stock" value={form.initialStock} onChange={(event) => setForm((v) => ({ ...v, initialStock: Number(event.target.value) }))} />
                <FieldInput type="number" min={0} label="Low stock alert" value={form.lowStock} onChange={(event) => setForm((v) => ({ ...v, lowStock: Number(event.target.value) }))} />
              </div>
              <div className="border border-border bg-surface/60 p-4">
                <AppSwitch
                  isSelected={form.poolEnabled}
                  onChange={(selected) => setForm((v) => ({
                    ...v,
                    poolEnabled: selected,
                    poolBasePrice: selected && !v.poolBasePrice ? Number(v.price) : v.poolBasePrice,
                    poolMinSalePrice: selected && !v.poolMinSalePrice ? Number(v.price) : v.poolMinSalePrice,
                  }))}
                  label="Make available in Pool"
                  description="Other vendors can select this product and sell it from their own storefront."
                />
                {form.poolEnabled ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <FieldInput
                      type="number"
                      min={0}
                      label="Source price"
                      value={form.poolBasePrice || form.price}
                      onChange={(event) => setForm((v) => ({ ...v, poolBasePrice: Number(event.target.value) }))}
                    />
                    <FieldInput
                      type="number"
                      min={form.poolBasePrice || form.price}
                      label="Minimum sale price"
                      value={form.poolMinSalePrice || form.poolBasePrice || form.price}
                      onChange={(event) => setForm((v) => ({ ...v, poolMinSalePrice: Number(event.target.value) }))}
                    />
                    <FieldInput
                      type="number"
                      min={0}
                      label="Pool quantity"
                      placeholder="Use stock"
                      value={form.poolMaxSelectableQuantity || ""}
                      onChange={(event) => setForm((v) => ({ ...v, poolMaxSelectableQuantity: Number(event.target.value) }))}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}
              <AppButton fullWidth size="lg" isLoading={isSaving || isUploading} loadingLabel={isUploading ? "Uploading images..." : "Saving product..."}>
                <Plus className="h-4 w-4" />
                Create product
              </AppButton>
        </form>
      </AppModal>
    </div>
  );
}
