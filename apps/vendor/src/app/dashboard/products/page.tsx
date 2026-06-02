"use client";

import React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  VendorMetricCard,
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { uploadApi, vendorCommerceApi } from "@kwikseller/api-client";
import type { Product, ProductType } from "@kwikseller/types";
import { AppButton, AppModal, AppSwitch, FieldInput, FieldSelect, FieldTextarea } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";

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

const steps = [
  "Basic Information",
  "Pricing & Inventory",
  "Optional Details",
  "Review & Confirm",
];

function uploadedUrl(response: any) {
  const data = unwrapApiData<any>(response.data);
  return data?.secureUrl || data?.url || data?.data?.secureUrl || data?.data?.url || "";
}

function productImage(product: Product) {
  const first = product.images?.[0];
  if (!first) return "";
  return typeof first === "string" ? first : first.url;
}

export default function VendorProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [form, setForm] = React.useState(blankForm);
  const [query, setQuery] = React.useState("");
  const [step, setStep] = React.useState(0);
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

  const filteredProducts = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => [product.name, product.description, product.sku]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }, [products, query]);

  const openCreate = () => {
    setForm(blankForm);
    setStep(0);
    setIsCreateOpen(true);
  };

  const validateStep = (nextStep: number) => {
    if (step === 0 && (!form.name.trim() || !form.productType)) {
      kwikToast.error("Add product name and type first");
      return;
    }
    if (step === 1 && Number(form.price) <= 0) {
      kwikToast.error("Add a valid product price");
      return;
    }
    setStep(nextStep);
  };

  const createProduct = async () => {
    if (!form.name.trim()) {
      kwikToast.error("Product name is required");
      setStep(0);
      return;
    }
    if (Number(form.price) <= 0) {
      kwikToast.error("Product price must be greater than zero");
      setStep(1);
      return;
    }
    if (form.poolEnabled && Number(form.poolMinSalePrice || form.poolBasePrice || form.price) < Number(form.poolBasePrice || form.price)) {
      kwikToast.error("Pool minimum sale price cannot be below source price");
      setStep(1);
      return;
    }

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
      setStep(0);
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

  const physicalProducts = products.filter((product) => product.productType !== "DIGITAL");
  const poolProducts = products.filter((product) => product.poolEnabled || product.productSource === "POOL_RESALE");

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Products"
        description="Create, review, and manage store products. Product creation now follows a focused step flow."
        action={
          <div className="flex gap-2">
            <AppButton type="button" variant="secondary" size="lg" onClick={loadProducts}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </AppButton>
            <AppButton type="button" size="lg" onClick={openCreate}>
              <PackagePlus className="h-4 w-4" />
              Add product
            </AppButton>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <VendorMetricCard label="Catalog" value={String(products.length)} note="Total products" icon={Package} />
        <VendorMetricCard label="Physical stock" value={String(physicalProducts.length)} note="Inventory tracked" icon={PackagePlus} tone="accent" />
        <VendorMetricCard label="Pool items" value={String(poolProducts.length)} note="Available or sourced" icon={Check} tone="success" />
      </section>

      <VendorSoftPanel>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <FieldInput
            aria-label="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, SKU, description"
            className="h-12 rounded-2xl bg-surface"
          />
          <AppButton type="button" variant="secondary" size="lg">
            <Search className="h-4 w-4" />
            Search
          </AppButton>
        </div>
      </VendorSoftPanel>

      <VendorSoftPanel title="Catalog" description={`${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} shown`}>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-[22px] bg-surface" />
            ))}
          </div>
        ) : filteredProducts.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const inventory = product.inventoryItems?.[0];
              const image = productImage(product);
              return (
                <article key={product.id} className="overflow-hidden rounded-[22px] border border-border bg-background shadow-sm">
                  <div className="aspect-[4/3] bg-surface">
                    {image ? (
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-soft-foreground">
                        {product.productType ?? "PHYSICAL"}
                      </span>
                      {product.poolEnabled ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                          Available in Pool
                        </span>
                      ) : null}
                      {product.productSource === "POOL_RESALE" ? (
                        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
                          Pool sourced
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-heading text-lg font-semibold text-foreground">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description || "No description yet."}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</p>
                        <p className="font-heading text-xl font-semibold text-foreground">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available</p>
                        <p className="font-heading text-xl font-semibold text-foreground">{inventory?.available ?? product.stock ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <VendorEmptyState
            title={query ? "No matching products" : "No products yet"}
            text={query ? "Try another search term." : "Create your first vendor stock or digital product to start testing checkout."}
            action={!query ? <AppButton type="button" onClick={openCreate}>Add product</AppButton> : undefined}
          />
        )}
      </VendorSoftPanel>

      <AppModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Product"
        description="Complete the required steps, then confirm."
        className="sm:max-w-3xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((label, index) => {
              const complete = index < step;
              const active = index === step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                      complete
                        ? "border-[#071a2f] bg-[#071a2f] text-white"
                        : active
                          ? "border-[#071a2f] bg-background text-[#071a2f] dark:border-accent dark:text-accent"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {complete ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="hidden text-xs font-semibold text-muted-foreground sm:block">{label}</span>
                </button>
              );
            })}
          </div>

          {step === 0 ? (
            <div className="space-y-4">
              <FieldInput required label="Product name" value={form.name} onChange={(event) => setForm((v) => ({ ...v, name: event.target.value }))} />
              <FieldSelect label="Product type" value={form.productType} onChange={(event) => setForm((v) => ({ ...v, productType: event.target.value as ProductType }))}>
                <option value="PHYSICAL">Physical</option>
                <option value="DIGITAL">Digital</option>
              </FieldSelect>
              <FieldTextarea label="Short description" value={form.description} onChange={(event) => setForm((v) => ({ ...v, description: event.target.value }))} />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldInput required type="number" min={0} label="Price" value={form.price} onChange={(event) => setForm((v) => ({ ...v, price: Number(event.target.value) }))} />
                <FieldInput type="number" min={0} label="Compare price" value={form.comparePrice} onChange={(event) => setForm((v) => ({ ...v, comparePrice: Number(event.target.value) }))} />
              </div>
              {form.productType === "PHYSICAL" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput type="number" min={0} label="Initial stock" value={form.initialStock} onChange={(event) => setForm((v) => ({ ...v, initialStock: Number(event.target.value) }))} />
                  <FieldInput type="number" min={0} label="Low stock alert" value={form.lowStock} onChange={(event) => setForm((v) => ({ ...v, lowStock: Number(event.target.value) }))} />
                </div>
              ) : (
                <div className="rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
                  Digital products default to unlimited delivery unless you later attach license-limited assets.
                </div>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <FieldInput label="SKU" value={form.sku} onChange={(event) => setForm((v) => ({ ...v, sku: event.target.value }))} />
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Product images</span>
                <div className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-surface p-6 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    <span className="text-accent underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isUploading ? "Uploading..." : `${form.images.length}/5 images added`}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => uploadImages(event.target.files)}
                    className="sr-only"
                  />
                </div>
              </label>
              {form.images.length ? (
                <div className="grid grid-cols-5 gap-2">
                  {form.images.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, images: current.images.filter((image) => image !== url) }))}
                      className="aspect-square overflow-hidden rounded-2xl border border-border bg-surface"
                      title="Remove image"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
              {form.productType === "PHYSICAL" ? (
                <div className="rounded-[22px] border border-border bg-surface p-4">
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
                      <FieldInput type="number" min={0} label="Source price" value={form.poolBasePrice || form.price} onChange={(event) => setForm((v) => ({ ...v, poolBasePrice: Number(event.target.value) }))} />
                      <FieldInput type="number" min={form.poolBasePrice || form.price} label="Minimum sale price" value={form.poolMinSalePrice || form.poolBasePrice || form.price} onChange={(event) => setForm((v) => ({ ...v, poolMinSalePrice: Number(event.target.value) }))} />
                      <FieldInput type="number" min={0} label="Pool quantity" placeholder="Use stock" value={form.poolMaxSelectableQuantity || ""} onChange={(event) => setForm((v) => ({ ...v, poolMaxSelectableQuantity: Number(event.target.value) }))} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-foreground">{form.name || "Untitled product"}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.description || "No description added."}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">Type</p><p className="font-semibold text-foreground">{form.productType}</p></div>
                  <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold text-foreground">{formatCurrency(form.price)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Images</p><p className="font-semibold text-foreground">{form.images.length}</p></div>
                </div>
              </div>
              {form.poolEnabled ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                  This product will be available in Pool at source price {formatCurrency(form.poolBasePrice || form.price)}.
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <AppButton type="button" variant="secondary" disabled={step === 0 || isSaving} onClick={() => setStep((current) => Math.max(0, current - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </AppButton>
            {step < steps.length - 1 ? (
              <AppButton type="button" onClick={() => validateStep(step + 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </AppButton>
            ) : (
              <AppButton type="button" isLoading={isSaving || isUploading} loadingLabel={isUploading ? "Uploading..." : "Saving..."} onClick={createProduct}>
                <Plus className="h-4 w-4" />
                Create product
              </AppButton>
            )}
          </div>
        </div>
      </AppModal>
    </div>
  );
}
