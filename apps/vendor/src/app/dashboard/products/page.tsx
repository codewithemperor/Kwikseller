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
  X,
} from "lucide-react";
import {
  VendorPageHeader,
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { KwiksellerLoader } from "@/components/kwikseller-loader";
import { VendorEmptyState } from "@/components/vendor-empty-state";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { useVendorProductsStore } from "@/stores/vendor-products-store";
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

function ProductStatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: "blue" | "orange" | "green";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-400/12 dark:text-blue-200 dark:border-blue-400/20",
    orange: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-400/12 dark:text-orange-200 dark:border-orange-400/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-400/12 dark:text-emerald-200 dark:border-emerald-400/20",
  }[tone];

  return (
    <article className={`rounded-[22px] border p-5 ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold opacity-85">{label}</p>
          <p className="mt-3 font-heading text-4xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm font-medium opacity-80">{note}</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-current dark:bg-white/10">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export default function VendorProductsPage() {
  const { products, isLoading, fetchProducts, refreshProducts } = useVendorProductsStore();
  const [form, setForm] = React.useState(blankForm);
  const [query, setQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  React.useEffect(() => {
    fetchProducts().catch((error) => {
      kwikToast.error(error instanceof Error ? error.message : "Could not load vendor products");
    });
  }, [fetchProducts]);

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
      refreshProducts().catch(() => undefined);
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
            <button
              type="button"
              onClick={() => setShowSearch((value) => !value)}
              aria-label={showSearch ? "Hide product search" : "Search products"}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-foreground transition hover:border-accent hover:text-accent dark:bg-white/5"
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <AppButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => refreshProducts().catch((error) => kwikToast.error(error instanceof Error ? error.message : "Could not load vendor products"))}
              disabled={isLoading}
            >
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

      {showSearch ? (
        <VendorSoftPanel>
          <form
            className="grid grid-cols-[minmax(0,1fr)_52px] items-end gap-2"
            onSubmit={(event) => event.preventDefault()}
          >
            <FieldInput
              aria-label="Search products"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, SKU, description"
              className="h-12 rounded-2xl bg-white dark:bg-white/5"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition hover:brightness-105"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </VendorSoftPanel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <ProductStatCard label="Catalog" value={String(products.length)} note="Total products" icon={Package} tone="blue" />
        <ProductStatCard label="Physical stock" value={String(physicalProducts.length)} note="Inventory tracked" icon={PackagePlus} tone="orange" />
        <ProductStatCard label="Pool items" value={String(poolProducts.length)} note="Available or sourced" icon={Check} tone="green" />
      </section>

      <VendorSoftPanel title="Catalog" description={`${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} shown`}>
        {isLoading ? (
          <KwiksellerLoader />
        ) : filteredProducts.length ? (
          <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const inventory = product.inventoryItems?.[0];
              const image = productImage(product);
              return (
                <article key={product.id} className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[22px] border border-border bg-background p-2 md:block md:p-0">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-surface md:aspect-[4/3] md:h-auto md:w-full md:rounded-none">
                    {image ? (
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 md:p-4">
                    <div className="hidden flex-wrap gap-2 md:flex">
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
                    <h3 className="line-clamp-1 font-heading text-sm font-semibold text-foreground md:mt-3 md:line-clamp-2 md:text-lg">{product.name}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground md:mt-2 md:line-clamp-2 md:text-sm md:leading-6">{product.description || product.productType || "No description yet."}</p>
                    <div className="mt-2 flex items-center gap-3 md:mt-4 md:items-end md:justify-between">
                      <div>
                        <p className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">Price</p>
                        <p className="font-heading text-base font-semibold text-foreground md:text-xl">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available</p>
                        <p className="font-heading text-base font-semibold text-foreground md:text-xl">{inventory?.available ?? product.stock ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground md:hidden">
                    <ChevronRight className="h-4 w-4" />
                  </span>
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
                    {`${form.images.length}/5 images added`}
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
              <AppButton type="button" disabled={isSaving || isUploading} onClick={createProduct}>
                <Plus className="h-4 w-4" />
                Create product
              </AppButton>
            )}
          </div>
        </div>
      </AppModal>
      {isSaving || isUploading ? <KwiksellerLoader overlay /> : null}
    </div>
  );
}
