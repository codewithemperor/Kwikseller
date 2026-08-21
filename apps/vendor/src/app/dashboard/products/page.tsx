"use client";

import React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { useVendorPageSearch } from "@/components/vendor-page-context";
import { useVendorProductsStore } from "@/stores/vendor-products-store";
import { uploadApi, vendorCommerceApi } from "@/lib/api-client";
import type { Product, ProductType } from "@/lib/types";
import {
  AppButton,
  AppImage,
  AppModal,
  AppSwitch,
  EmptyState,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  Skeleton,
  VendorMetricCard,
  VendorPageHeader,
  type SearchAutoSuggestItem,
} from "@/lib/ui";
import { kwikToast } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { VendorProductCard as VendorMarketplaceProductCard } from "@/components/vendor-product-card";
import { motion } from "framer-motion";

/* ─── Constants ─── */

const ITEMS_PER_PAGE = 20;

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Health & Beauty",
  "Sports",
  "Food & Drinks",
  "Books",
  "Toys & Games",
  "Automotive",
  "Computers",
  "Phones",
  "Accessories",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

function productSearchItem(product: Product): SearchAutoSuggestItem {
  return {
    id: product.id,
    type: "product",
    text: product.name,
    subtext: `${product.category?.name ?? product.productType ?? "Product"} · ${product.status}`,
    href: `/dashboard/products/${product.id}/edit`,
  };
}

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

const wizardSteps = [
  "Basic Info",
  "Pricing & Stock",
  "Details",
  "Review",
];

/* ─── Helpers ─── */

function uploadedUrl(response: any) {
  const data = unwrapApiData<any>(response.data);
  return data?.secureUrl || data?.url || data?.data?.secureUrl || data?.data?.url || "";
}

function productImageSrc(product: Product): string {
  const first = product.images?.[0];
  if (!first) return "";
  return typeof first === "string" ? first : first.url;
}

function isPoolResaleProduct(product: Product) {
  return product.productSource === "POOL_RESALE";
}

/* ─── Skeleton Card ─── */

function ProductSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-kwik-border bg-surface">
      <Skeleton shape="rectangular" className="aspect-[3/4] w-full rounded-none" />
      <div className="space-y-2 border-t border-kwik-border p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirmation Modal ─── */

function DeleteConfirmModal({
  isOpen,
  product,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!product) return null;
  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Delete Product?" className="sm:max-w-md">
      <div>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to archive <strong className="text-foreground">{product.name}</strong>?
          This will set the product status to Archived. You can restore it later by changing its status back.
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-kwik-border pt-4">
        <AppButton type="button" variant="secondary" onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton type="button" variant="danger" onClick={onConfirm} isLoading={isDeleting} className="bg-red-600 text-white hover:bg-red-700">
          <Trash2 className="h-4 w-4" />
          Delete
        </AppButton>
      </div>
    </AppModal>
  );
}

/* ─── Create Product Wizard Modal ─── */

function CreateProductModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState(blankForm);
  const [step, setStep] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const resetAndClose = () => {
    setForm(blankForm);
    setStep(0);
    onClose();
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
    if (!form.name.trim()) { kwikToast.error("Product name is required"); setStep(0); return; }
    if (Number(form.price) <= 0) { kwikToast.error("Price must be greater than zero"); setStep(1); return; }

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
      resetAndClose();
      onCreated();
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
      const uploads = await Promise.all(Array.from(files).slice(0, 5).map((f) => uploadApi.productImage(f)));
      const urls = uploads.map(uploadedUrl).filter(Boolean);
      setForm((c) => ({ ...c, images: [...c.images, ...urls].slice(0, 5) }));
      kwikToast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppModal isOpen={isOpen} onClose={resetAndClose} title="Add Product" description="Complete the required steps, then confirm." className="sm:max-w-3xl">
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="grid grid-cols-4 gap-2">
          {wizardSteps.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button key={label} type="button" onClick={() => i <= step && setStep(i)} className="flex flex-col items-center gap-2 text-center">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${done ? "border-foreground bg-foreground text-background" : active ? "border-foreground bg-surface text-foreground" : "border-kwik-border bg-surface text-muted-foreground"}`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className="hidden text-xs font-medium text-muted-foreground sm:block">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Step 0 — Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <FieldInput required label="Product name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            <FieldSelect label="Product type" value={form.productType} onChange={(e) => setForm((v) => ({ ...v, productType: e.target.value as ProductType }))}>
              <option value="PHYSICAL">Physical</option>
              <option value="DIGITAL">Digital</option>
            </FieldSelect>
            <FieldTextarea label="Description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
          </div>
        )}

        {/* Step 1 — Pricing & Stock */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldInput required type="number" min={0} label="Price" value={form.price} onChange={(e) => setForm((v) => ({ ...v, price: Number(e.target.value) }))} />
              <FieldInput type="number" min={0} label="Compare price" value={form.comparePrice} onChange={(e) => setForm((v) => ({ ...v, comparePrice: Number(e.target.value) }))} />
            </div>
            {form.productType === "PHYSICAL" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldInput type="number" min={0} label="Initial stock" value={form.initialStock} onChange={(e) => setForm((v) => ({ ...v, initialStock: Number(e.target.value) }))} />
                <FieldInput type="number" min={0} label="Low stock alert" value={form.lowStock} onChange={(e) => setForm((v) => ({ ...v, lowStock: Number(e.target.value) }))} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Digital products default to unlimited delivery.</p>
            )}
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div className="space-y-4">
            <FieldInput label="SKU" value={form.sku} onChange={(e) => setForm((v) => ({ ...v, sku: e.target.value }))} />
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Product images</span>
              <div className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-kwik-border bg-default-100 p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  <span className="text-accent underline">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{`${form.images.length}/5 images added`}</p>
                <input type="file" accept="image/*" multiple onChange={(e) => uploadImages(e.target.files)} className="sr-only" />
              </div>
            </label>
            {form.images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {form.images.map((url) => (
                  <button key={url} type="button" onClick={() => setForm((c) => ({ ...c, images: c.images.filter((img) => img !== url) }))} className="aspect-square overflow-hidden rounded-lg border border-kwik-border bg-default-100" title="Remove image">
                    <AppImage src={url} alt="" className="h-full w-full object-cover" objectFit="cover" />
                  </button>
                ))}
              </div>
            )}
            {form.productType === "PHYSICAL" && (
              <div className="border border-kwik-border p-4">
                <AppSwitch
                  isSelected={form.poolEnabled}
                  onChange={(sel) => setForm((v) => ({
                    ...v,
                    poolEnabled: sel,
                    poolBasePrice: sel && !v.poolBasePrice ? Number(v.price) : v.poolBasePrice,
                    poolMinSalePrice: sel && !v.poolMinSalePrice ? Number(v.price) : v.poolMinSalePrice,
                  }))}
                  label="Make available in Pool"
                  description="Other vendors can select and sell this product."
                />
                {form.poolEnabled && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <FieldInput type="number" min={0} label="Source price" value={form.poolBasePrice || form.price} onChange={(e) => setForm((v) => ({ ...v, poolBasePrice: Number(e.target.value) }))} />
                    <FieldInput type="number" min={form.poolBasePrice || form.price} label="Min sale price" value={form.poolMinSalePrice || form.poolBasePrice || form.price} onChange={(e) => setForm((v) => ({ ...v, poolMinSalePrice: Number(e.target.value) }))} />
                    <FieldInput type="number" min={0} label="Pool quantity" placeholder="Use stock" value={form.poolMaxSelectableQuantity || ""} onChange={(e) => setForm((v) => ({ ...v, poolMaxSelectableQuantity: Number(e.target.value) }))} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border border-kwik-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{form.name || "Untitled product"}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.description || "No description added."}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">Type</p><p className="font-semibold text-foreground">{form.productType}</p></div>
                <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold text-foreground">{formatCurrency(form.price)}</p></div>
                <div><p className="text-xs text-muted-foreground">Images</p><p className="font-semibold text-foreground">{form.images.length}</p></div>
              </div>
            </div>
            {form.poolEnabled && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                This product will be available in Pool at source price {formatCurrency(form.poolBasePrice || form.price)}.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-kwik-border pt-4">
          <AppButton type="button" variant="secondary" disabled={step === 0 || isSaving} onClick={() => setStep((c) => Math.max(0, c - 1))}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </AppButton>
          {step < wizardSteps.length - 1 ? (
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
  );
}

/* ─── Pagination ─── */

function Pagination({
  total,
  page,
  onPageChange,
}: {
  total: number;
  page: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {total > 0 ? start : 0}–{end} of {total} products
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded px-2 text-sm font-medium text-muted-foreground transition hover:bg-default-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-sm text-muted-foreground">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition ${p === page ? "bg-foreground text-background" : "text-muted-foreground hover:bg-default-100"}`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded px-2 text-sm font-medium text-muted-foreground transition hover:bg-default-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function VendorProductsPage() {
  const router = useRouter();
  const { products, isLoading, fetchProducts, refreshProducts } = useVendorProductsStore();

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  // Pagination
  const [page, setPage] = React.useState(1);

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Delete
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Bulk actions
  const [bulkStatus, setBulkStatus] = React.useState("");
  const [isBulkProcessing, setIsBulkProcessing] = React.useState(false);

  React.useEffect(() => {
    fetchProducts().catch((err) => {
      kwikToast.error(err instanceof Error ? err.message : "Could not load vendor products");
    });
  }, [fetchProducts]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, statusFilter]);

  const headerSearchItems = React.useMemo<SearchAutoSuggestItem[]>(() => {
    const categoryItems = CATEGORIES.slice(0, 6).map((category) => ({
      id: category,
      type: "category",
      text: category,
      subtext: "Product category",
    }));
    const statusItems = STATUS_OPTIONS.filter((item) => item.value).map((item) => ({
      id: item.value,
      type: "page",
      text: item.label,
      subtext: "Product status",
    }));
    return [...categoryItems, ...statusItems].slice(0, 8);
  }, []);

  const searchProductsFromHeader = React.useCallback((query: string): SearchAutoSuggestItem[] => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return headerSearchItems;

    const categoryMatches = CATEGORIES
      .filter((category) => category.toLowerCase().includes(normalized))
      .slice(0, 4)
      .map((category) => ({
        id: category,
        type: "category",
        text: category,
        subtext: "Product category",
      }));

    const productMatches = products
      .filter((product) =>
        [
          product.name,
          product.sku,
          product.description,
          product.status,
          product.category?.name,
          product.productType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized)),
      )
      .slice(0, 8 - categoryMatches.length)
      .map(productSearchItem);

    return [...categoryMatches, ...productMatches];
  }, [headerSearchItems, products]);

  const applyHeaderSearch = React.useCallback((query: string) => {
    const normalized = query.trim().toLowerCase();
    const matchedStatus = STATUS_OPTIONS.find((item) => item.value && item.label.toLowerCase() === normalized);
    setStatusFilter(matchedStatus?.value ?? "");
    setSearchQuery(matchedStatus ? "" : query);
    setPage(1);
  }, []);

  useVendorPageSearch(searchProductsFromHeader, applyHeaderSearch, headerSearchItems);

  // Derived data
  const filteredProducts = React.useMemo(() => {
    let result = products;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((p) =>
        [
          p.name,
          p.sku,
          p.description,
          p.status,
          p.category?.name,
          p.productType,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result;
  }, [products, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const selectableProducts = paginatedProducts.filter((product) => !isPoolResaleProduct(product));

  const allSelected = selectableProducts.length > 0 && selectableProducts.every((p) => selectedIds.has(p.id));
  const noneSelected = selectableProducts.every((p) => !selectedIds.has(p.id));

  const stats = React.useMemo(() => ({
    total: products.length,
    physical: products.filter((p) => p.productType !== "DIGITAL").length,
    pool: products.filter((p) => p.poolEnabled || p.productSource === "POOL_RESALE").length,
  }), [products]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (product && isPoolResaleProduct(product)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (isPoolResaleProduct(deleteTarget)) {
      kwikToast.error("Pool-sourced products can only have their selling price changed");
      setDeleteTarget(null);
      return;
    }
    setIsDeleting(true);
    try {
      await vendorCommerceApi.updateProduct(deleteTarget.id, { status: "ARCHIVED" });
      kwikToast.success("Product archived");
      setDeleteTarget(null);
      refreshProducts().catch(() => undefined);
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Failed to archive product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: "delete" | "status" | "category") => {
    if (selectedIds.size === 0) return;
    const ownedSelectedIds = Array.from(selectedIds).filter((id) => {
      const product = products.find((item) => item.id === id);
      return product && !isPoolResaleProduct(product);
    });
    if (ownedSelectedIds.length === 0) {
      kwikToast.error("Pool-sourced products can only have their selling price changed");
      setSelectedIds(new Set());
      return;
    }
    setIsBulkProcessing(true);
    try {
      if (action === "delete") {
        await Promise.all(
          ownedSelectedIds.map((id) => vendorCommerceApi.updateProduct(id, { status: "ARCHIVED" }))
        );
        kwikToast.success(`${ownedSelectedIds.length} products archived`);
      } else if (action === "status" && bulkStatus) {
        await Promise.all(
          ownedSelectedIds.map((id) => vendorCommerceApi.updateProduct(id, { status: bulkStatus as any }))
        );
        kwikToast.success(`Status updated for ${ownedSelectedIds.length} products`);
      }
      setSelectedIds(new Set());
      refreshProducts().catch(() => undefined);
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Bulk action failed");
    } finally {
      setIsBulkProcessing(false);
      setBulkStatus("");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  const hasActiveFilters = searchQuery || statusFilter;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container space-y-5"
    >
      {/* Page Header */}
      <VendorPageHeader
        title="Products"
        description="Create, review, and manage your store products."
        actions={
          <>
          <button
            type="button"
            onClick={() => refreshProducts().catch((e) => kwikToast.error(e instanceof Error ? e.message : "Could not refresh"))}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 px-1 text-sm font-semibold text-foreground transition hover:text-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/products/new/edit")}
            className="inline-flex h-9 items-center gap-2 px-1 text-sm font-semibold text-foreground transition hover:text-accent"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
          </>
        }
      />

      {/* Stats Row */}
      <motion.section
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <VendorMetricCard
            title="Total Catalog"
            value={String(stats.total)}
            description="All owned and Pool-sourced products in your store."
            icon={Package}
            variant="solid"
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <VendorMetricCard
            title="Physical Stock"
            value={String(stats.physical)}
            description="Owned products that require stock and shipping."
            icon={PackagePlus}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <VendorMetricCard
            title="Pool Items"
            value={String(stats.pool)}
            description="Products sourced from Pool with price-only control."
            icon={Check}
          />
        </motion.div>
      </motion.section>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent"
        >
          <X className="h-3.5 w-3.5" />
          Clear product search
        </button>
      ) : null}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <section className="flex flex-col gap-3 border border-border bg-background p-3 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
            <button type="button" onClick={() => setSelectedIds(new Set())} className="text-sm text-muted hover:text-foreground">
              Clear selection
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppButton
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleBulkAction("delete")}
              disabled={isBulkProcessing}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </AppButton>
            <FieldSelect
              value={bulkStatus}
              onChange={(e) => {
                setBulkStatus(e.target.value);
                if (e.target.value) handleBulkAction("status");
              }}
              disabled={isBulkProcessing}
              className="h-8"
              wrapperClassName="mb-0"
            >
              <option value="">Set Status...</option>
              {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </FieldSelect>
          </div>
        </section>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeletonCard key={i} />)}
        </div>
      ) : paginatedProducts.length > 0 ? (
        <>
          <div className="flex items-center gap-3 px-1">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex h-6 w-6 items-center justify-center rounded border border-kwik-border bg-surface text-foreground transition"
              aria-label={allSelected ? "Deselect all" : "Select all"}
            >
              {allSelected ? (
                <span className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
                  <Check className="h-3.5 w-3.5 text-background" />
                </span>
              ) : (
                <span className="h-6 w-6 rounded border border-kwik-border bg-surface" />
              )}
            </button>
            <span className="text-xs text-muted-foreground">Select all on page</span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <VendorMarketplaceProductCard
                key={product.id}
                name={product.name}
                image={productImageSrc(product)}
                store={product.store?.name ?? "Vendor product"}
                category={product.category?.name ?? product.productType ?? "Product"}
                price={Number(product.price ?? 0)}
                comparePrice={product.comparePrice ?? undefined}
                statusLabel={product.status}
                stockLabel={`Stock: ${product.inventoryItems?.[0]?.available ?? product.stock ?? 0}`}
                selected={selectedIds.has(product.id)}
                canDelete={!isPoolResaleProduct(product)}
                onSelect={!isPoolResaleProduct(product) ? () => toggleSelect(product.id) : undefined}
                onOpen={() => router.push(`/dashboard/products/${product.id}/edit`)}
                onEdit={() => router.push(`/dashboard/products/${product.id}/edit`)}
                onDelete={() => setDeleteTarget(product)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          variant={searchQuery || statusFilter ? "search" : "products"}
          title={searchQuery || statusFilter ? "No matching products" : "No products yet"}
          description={searchQuery || statusFilter ? "Try adjusting your search." : "Create your first product to get started."}
          action={!searchQuery && !statusFilter ? {
            label: "Add Product",
            onClick: () => router.push("/dashboard/products/new/edit"),
          } : undefined}
        />
      )}

      {/* Pagination */}
      {filteredProducts.length > ITEMS_PER_PAGE && (
        <Pagination total={filteredProducts.length} page={page} onPageChange={setPage} />
      )}

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </motion.div>
  );
}
