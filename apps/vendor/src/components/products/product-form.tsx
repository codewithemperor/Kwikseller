"use client";

import React from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AppButton,
  AppSwitch,
  FieldInput,
  ImageUpload,
  NumberInput,
  SelectInput,
  Skeleton,
  SkeletonText,
  TextareaInput,
  TextInput,
  VendorPageHeader,
  type ImageUploadValue,
} from "@/lib/ui";
import { formatCurrency, kwikToast } from "@/lib/utils";
import { uploadApi, vendorCommerceApi } from "@/lib/api-client";
import type { Product } from "@/lib/types";
import { unwrapApiData } from "@/lib/vendor-format";
import {
  productFormSchema,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS_OPTIONS,
  type ProductFormValues,
  type ProductVariant,
} from "./product-form-schema";

export type { ProductFormValues } from "./product-form-schema";

const TABS = [
  { key: "basic", label: "Basic" },
  { key: "pricing", label: "Pricing" },
  { key: "inventory", label: "Inventory" },
  { key: "images", label: "Images" },
  { key: "variants", label: "Variants" },
  { key: "visibility", label: "Visibility" },
  { key: "pool", label: "Pool" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export interface ProductFormProps {
  /** When provided, the form loads this product as defaultValues (edit mode). */
  productId?: string;
  /** Called with the validated form values. Parent decides create vs update. */
  onSubmit: (data: ProductFormValues) => Promise<void>;
  /** Submitting state — controls the bottom button spinner. */
  isSubmitting?: boolean;
  /** Page header title. */
  title?: string;
  /** Page header description. */
  description?: string;
  /** Submit button label. */
  submitLabel?: string;
}

const NEW_PRODUCT_DEFAULTS: ProductFormValues = {
  name: "",
  description: "",
  categoryId: "",
  price: 0,
  comparePrice: undefined,
  stock: 0,
  lowStockThreshold: 10,
  sku: "",
  status: "DRAFT",
  images: [],
  variants: [],
  poolEnabled: false,
  poolBasePrice: undefined,
  poolMinSalePrice: undefined,
  poolMaxSelectableQuantity: undefined,
};

const categoryOptions = PRODUCT_CATEGORIES.map((c) => ({ id: c, label: c }));
const statusOptions = PRODUCT_STATUS_OPTIONS.map((s) => ({
  id: s.value,
  label: s.label,
}));

function productToFormValues(product: Product): ProductFormValues {
  const imageList = Array.isArray(product.images) ? product.images : [];
  const images: ImageUploadValue[] = imageList.map((img, idx) => {
    const url = typeof img === "string" ? img : img.url;
    return { id: `${idx}-${url}`, url, isMain: idx === 0 };
  });
  const inventory = product.inventoryItems?.[0];
  const stock = inventory?.available ?? product.stock ?? 0;
  const lowStockThreshold = product.lowStock ?? inventory?.lowStockThreshold ?? 10;
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    categoryId: product.categoryId ?? product.category?.name ?? "",
    price: Number(product.price ?? 0),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    stock: Number(stock),
    lowStockThreshold: Number(lowStockThreshold),
    sku: product.sku ?? "",
    status: product.status === "PENDING" ? "DRAFT" : product.status,
    images,
    variants: [],
    poolEnabled: false,
    poolBasePrice: undefined,
    poolMinSalePrice: undefined,
    poolMaxSelectableQuantity: undefined,
  };
}

function uploadedUrl(response: unknown): string {
  const data = unwrapApiData<{ secureUrl?: string; url?: string }>(response);
  const nested = (data as { data?: { secureUrl?: string; url?: string } })?.data;
  return data?.secureUrl || data?.url || nested?.secureUrl || nested?.url || "";
}

/**
 * ProductForm — single-file RHF + zod form for creating / editing a vendor product.
 *
 * 5 tabs (Basic, Pricing, Inventory, Images, Visibility) are rendered inline
 * using the shared @/lib/ui RHF inputs. When `productId` is provided,
 * the product is fetched via `vendorCommerceApi.listProducts` and used as
 * defaultValues (edit mode).
 */
export function ProductForm({
  productId,
  onSubmit,
  isSubmitting = false,
  title,
  description,
  submitLabel,
}: ProductFormProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("basic");
  const isEditMode = !!productId;

  const productQuery = useQuery({
    queryKey: ["vendor-product", productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await vendorCommerceApi.listProducts();
      const products = unwrapApiData<Product[]>(response.data);
      const list = Array.isArray(products) ? products : [];
      return list.find((p) => p.id === productId) ?? null;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  const isLoadingProduct = isEditMode && productQuery.isLoading;
  const productNotFound = isEditMode && !productQuery.isLoading && !productQuery.data;

  const defaults = React.useMemo<ProductFormValues>(() => {
    if (isEditMode && productQuery.data) return productToFormValues(productQuery.data);
    return NEW_PRODUCT_DEFAULTS;
  }, [isEditMode, productQuery.data]);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm<ProductFormValues>({
    // Cast around a type-level skew between @hookform/resolvers (resolves
    // zod@3.25's v4/core → _zod.version.minor = 0) and the app's zod@4.4
    // (minor = 4). Runtime is unaffected — zodResolver detects zod4 schemas
    // via the _zod property.
    resolver: zodResolver(productFormSchema as never) as never,
    defaultValues: defaults,
    values: isEditMode && productQuery.data ? defaults : undefined,
    mode: "onTouched",
  });

  const poolEnabled = useWatch({ control, name: "poolEnabled" });

  const handleUpload = React.useCallback(async (file: File): Promise<string> => {
    const response: unknown = await uploadApi.productImage(file);
    const url = uploadedUrl(response);
    if (!url) throw new Error("Upload succeeded but no image URL was returned");
    return url;
  }, []);

  const tabHasError: Record<TabKey, boolean> = {
    basic: !!(errors.name || errors.description || errors.categoryId),
    pricing: !!(errors.price || errors.comparePrice),
    inventory: !!(errors.stock || errors.lowStockThreshold || errors.sku),
    images: !!errors.images,
    variants: !!(errors.variants && Array.isArray(errors.variants) && errors.variants.length > 0),
    visibility: !!errors.status,
    pool: false,
  };

  if (isLoadingProduct) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="safe-container pb-24"
      >
        <VendorPageHeader
          title={title ?? "Edit Product"}
          description={description}
          breadcrumbs={[{ label: "Products", href: "/dashboard/products" }, { label: "Edit Product" }]}
        />
        <div className="mt-6 max-w-3xl space-y-4">
          <SkeletonText lines={2} />
          <Skeleton className="h-11 w-full" />
          <SkeletonText lines={3} />
          <Skeleton className="h-24 w-full" />
        </div>
      </motion.div>
    );
  }

  if (productNotFound) {
    return (
      <div className="safe-container py-20 text-center">
        <p className="text-lg font-semibold text-foreground">Product not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The product you are looking for does not exist or has been removed.
        </p>
        <a
          href="/dashboard/products"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-accent"
        >
          Back to Products
        </a>
      </div>
    );
  }

  const onValid = async (values: ProductFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Could not save product");
    }
  };

  const onInvalid = () => {
    const order: TabKey[] = ["basic", "pricing", "inventory", "images", "variants", "visibility", "pool"];
    const first = order.find((t) => tabHasError[t]);
    if (first) setActiveTab(first);
    kwikToast.error("Please fix the highlighted fields before saving");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container pb-24"
    >
      <VendorPageHeader
        title={title ?? (isEditMode ? "Edit Product" : "Add Product")}
        description={description ?? (isEditMode ? "Update product details, pricing, and inventory." : "Add a new product to your store.")}
        breadcrumbs={[{ label: "Products", href: "/dashboard/products" }, { label: isEditMode ? "Edit Product" : "Add Product" }]}
        actions={isDirty ? (
          <span className="hidden text-xs font-medium text-amber-600 dark:text-amber-400 lg:inline">
            Unsaved changes
          </span>
        ) : undefined}
      />

      {/* Tab Navigation */}
      <div className="mt-6 mb-6 border-b border-kwik-border">
        <div className="-mb-px flex gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:border-accent hover:text-foreground"
              }`}
            >
              {tab.label}
              {tabHasError[tab.key] && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-danger align-middle" aria-hidden />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl space-y-5">
        {activeTab === "basic" && (
          <>
            <TextInput control={control} name="name" label="Product name" placeholder="e.g. Premium Cotton T-Shirt" isRequired />
            <TextareaInput control={control} name="description" label="Description" placeholder="Describe your product in detail — features, materials, what's included..." rows={6} maxLength={5000} showCount isRequired />
            <SelectInput control={control} name="categoryId" label="Category" placeholder="Select a category" options={categoryOptions} isRequired />
          </>
        )}

        {activeTab === "pricing" && <PricingTab control={control} />}

        {activeTab === "inventory" && (
          <>
            <NumberInput control={control} name="stock" label="Stock quantity" description="Current available units in your inventory" placeholder="0" min={0} isRequired />
            <NumberInput control={control} name="lowStockThreshold" label="Low stock threshold" description="You'll be alerted when stock drops to this level" placeholder="10" min={0} isRequired />
            <TextInput control={control} name="sku" label="SKU (Stock Keeping Unit)" placeholder="e.g. PROD-001" description="Unique identifier for this product in your inventory" />
          </>
        )}

        {activeTab === "images" && (
          <Controller
            control={control}
            name="images"
            render={({ field, fieldState: { error } }) => (
              <div className="space-y-2">
                <ImageUpload
                  images={Array.isArray(field.value) ? field.value : []}
                  onChange={field.onChange}
                  maxImages={5}
                  maxSizeMB={5}
                  enableReorder
                  onUpload={handleUpload}
                />
                <p className="text-xs text-muted-foreground">
                  Drag to reorder. The first image will be used as the main product image.
                </p>
                {error?.message && <p className="text-xs font-semibold text-danger">{error.message}</p>}
              </div>
            )}
          />
        )}

        {activeTab === "visibility" && (
          <>
            <SelectInput
              control={control}
              name="status"
              label="Visibility status"
              placeholder="Select a status"
              options={statusOptions}
              description="Controls whether customers can see and buy this product"
              isRequired
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => {
                const isActive = field.value === "ACTIVE";
                return (
                  <div className="rounded-xl border border-kwik-border bg-default-100 p-4">
                    <AppSwitch
                      isSelected={isActive}
                      onChange={(sel) =>
                        setValue("status", sel ? "ACTIVE" : "DRAFT", { shouldDirty: true, shouldValidate: true })
                      }
                      label={isActive ? "Product is live" : "Product is hidden"}
                      description={
                        isActive
                          ? "Customers can find and purchase this product on your storefront."
                          : "Toggle on to publish this product — it will appear on your storefront."
                      }
                    />
                  </div>
                );
              }}
            />
          </>
        )}

        {activeTab === "variants" && (
          <Controller
            control={control}
            name="variants"
            render={({ field }) => {
              const variants: ProductVariant[] = Array.isArray(field.value) ? field.value : [];
              const addVariant = () => {
                field.onChange([
                  ...variants,
                  { id: `new-${Date.now()}`, name: "", options: "", priceOverride: undefined, stockOverride: undefined, sku: "" },
                ]);
              };
              const updateVariant = (idx: number, patch: Partial<ProductVariant>) => {
                const next = variants.map((v, i) => (i === idx ? { ...v, ...patch } : v));
                field.onChange(next);
              };
              const removeVariant = (idx: number) => {
                field.onChange(variants.filter((_, i) => i !== idx));
              };
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Product Variants</p>
                      <p className="text-xs text-muted-foreground">Add size, color, or material variants with optional price/stock overrides.</p>
                    </div>
                    <AppButton type="button" variant="secondary" size="sm" onClick={addVariant}>+ Add Variant</AppButton>
                  </div>
                  {variants.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-kwik-border p-8 text-center">
                      <p className="text-sm text-muted-foreground">No variants yet. Add one if this product comes in different sizes, colors, or materials.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {variants.map((variant, idx) => (
                        <div key={variant.id ?? idx} className="rounded-xl border border-kwik-border bg-surface p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <FieldInput label="Variant name" placeholder="e.g. Size" value={variant.name} onChange={(e) => updateVariant(idx, { name: e.target.value })} />
                            <FieldInput label="Options (comma-separated)" placeholder="e.g. Small, Medium, Large" value={variant.options ?? ""} onChange={(e) => updateVariant(idx, { options: e.target.value })} />
                            <FieldInput type="number" label="Price override (₦)" placeholder="Leave empty for default" value={variant.priceOverride ?? ""} onChange={(e) => updateVariant(idx, { priceOverride: e.target.value ? Number(e.target.value) : undefined })} />
                            <FieldInput type="number" label="Stock override" placeholder="Leave empty for default" value={variant.stockOverride ?? ""} onChange={(e) => updateVariant(idx, { stockOverride: e.target.value ? Number(e.target.value) : undefined })} />
                            <FieldInput label="Variant SKU" placeholder="e.g. PROD-001-RED-M" value={variant.sku ?? ""} onChange={(e) => updateVariant(idx, { sku: e.target.value })} />
                          </div>
                          <button type="button" onClick={() => removeVariant(idx)} className="mt-3 text-xs font-semibold text-danger hover:underline">Remove variant</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}

        {activeTab === "pool" && (
          <>
            <Controller
              control={control}
              name="poolEnabled"
              render={({ field }) => (
                <div className="rounded-xl border border-kwik-border bg-default-100 p-4">
                  <AppSwitch
                    isSelected={!!field.value}
                    onChange={field.onChange}
                    label="Enable Pool Sourcing"
                    description="Allow other vendors to source this product from your store via the Pool Marketplace."
                  />
                </div>
              )}
            />
            {poolEnabled && (
              <>
                <NumberInput control={control} name="poolBasePrice" label="Pool base/wholesale price (₦)" description="The price other vendors pay to source this product" placeholder="0" min={0} />
                <NumberInput control={control} name="poolMinSalePrice" label="Minimum sale price (₦)" description="The lowest price a sourcing vendor can sell this for" placeholder="0" min={0} />
                <NumberInput control={control} name="poolMaxSelectableQuantity" label="Max selectable quantity" description="How many units a sourcing vendor can list at once" placeholder="50" min={1} />
              </>
            )}
            {!poolEnabled && (
              <p className="rounded-xl border border-dashed border-kwik-border p-6 text-center text-sm text-muted-foreground">
                Toggle on to make this product available in the Pool Marketplace.
              </p>
            )}
          </>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-kwik-border bg-surface lg:static lg:mt-8 lg:border-t lg:pt-6">
        <div className="safe-container flex items-center justify-between gap-3 py-3 lg:py-0">
          <AppButton type="button" variant="ghost" onClick={() => window.history.back()} className="hidden lg:inline-flex">
            Cancel
          </AppButton>
          <div className="flex w-full gap-2 lg:w-auto">
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => {
                setValue("status", "DRAFT", { shouldDirty: true });
                handleSubmit(onValid, onInvalid)();
              }}
              isLoading={isSubmitting}
              fullWidth
              className="lg:w-auto"
            >
              Save as Draft
            </AppButton>
            <AppButton
              type="button"
              variant="primary"
              onClick={handleSubmit(onValid, onInvalid)}
              isLoading={isSubmitting}
              fullWidth
              className="lg:w-auto"
            >
              {submitLabel ?? (isEditMode ? "Save Changes" : "Create Product")}
            </AppButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Pricing tab (inline, with live sale preview) ─── */

function PricingTab({ control }: { control: Control<ProductFormValues> }) {
  const [price, comparePrice] = useWatch({ control, name: ["price", "comparePrice"] }) as [
    number | undefined,
    number | undefined,
  ];
  const safePrice = Number(price ?? 0);
  const safeCompare = Number(comparePrice ?? 0);
  const hasSale = safeCompare > 0 && safePrice > 0 && safeCompare > safePrice;

  return (
    <>
      <NumberInput
        control={control}
        name="price"
        label="Base price"
        description="The price customers pay"
        placeholder="0"
        min={0}
        isRequired
        startContent={<span className="text-xs font-medium text-muted-foreground">₦</span>}
      />
      <NumberInput
        control={control}
        name="comparePrice"
        label="Compare-at price"
        description="Original price — shows as strikethrough on marketplace"
        placeholder="0"
        min={0}
        startContent={<span className="text-xs font-medium text-muted-foreground">₦</span>}
      />
      {hasSale ? (
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
          <p className="font-semibold">Sale preview</p>
          <p className="mt-1 text-muted-foreground">
            Customers will see{" "}
            <span className="font-medium text-foreground line-through">
              {formatCurrency(safeCompare)}
            </span>{" "}
            crossed out and{" "}
            <span className="font-medium text-accent">{formatCurrency(safePrice)}</span>{" "}
            as the sale price.
          </p>
        </div>
      ) : null}
    </>
  );
}

export default ProductForm;
