"use client";

import React from "react";
import {
  ChevronRight,
  ImageIcon,
  Loader2,
  Upload,
  X,
  GripVertical,
} from "lucide-react";
import { formatCurrency, unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi, uploadApi } from "@kwikseller/api-client";
import type { ProductType, ProductStatus } from "@kwikseller/types";
import {
  AppButton,
  AppModal,
  AppSwitch,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  Skeleton,
  SkeletonText,
  VendorPageHeader,
} from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import Link from "next/link";
import { use } from "react";
import { motion } from "framer-motion";

/* ─── Constants ─── */

const CATEGORIES = [
  "Fashion & Apparel",
  "Electronics & Gadgets",
  "Food & Beverages",
  "Health & Beauty",
  "Home & Living",
  "Sports & Fitness",
  "Books & Stationery",
  "Automotive",
  "Baby & Kids",
  "Agriculture",
  "Services",
  "Other",
];

const TABS = [
  { key: "basic", label: "Basic Info" },
  { key: "pricing", label: "Pricing" },
  { key: "inventory", label: "Inventory" },
  { key: "images", label: "Images" },
  { key: "visibility", label: "Visibility" },
] as const;

type TabKey = typeof TABS[number]["key"];

function generateSku(name: string): string {
  const prefix = name
    .slice(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const suffix = Date.now().toString(36).slice(-6).toUpperCase();
  return `${prefix}-${suffix}`;
}

/* ─── Helpers ─── */

function uploadedUrl(response: any) {
  const data = unwrapApiData<any>(response.data);
  return (
    data?.secureUrl ||
    data?.url ||
    data?.data?.secureUrl ||
    data?.data?.url ||
    ""
  );
}

/* ─── Page ─── */

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Tab state
  const [activeTab, setActiveTab] = React.useState<TabKey>("basic");

  // Form state - Basic Info
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [sku, setSku] = React.useState("");

  // Form state - Pricing
  const [price, setPrice] = React.useState(0);
  const [comparePrice, setComparePrice] = React.useState(0);
  const [costPrice, setCostPrice] = React.useState(0);
  const [currency, setCurrency] = React.useState("NGN");
  const [taxable, setTaxable] = React.useState(false);

  // Form state - Inventory
  const [stock, setStock] = React.useState(0);
  const [lowStock, setLowStock] = React.useState(5);
  const [allowBackorders, setAllowBackorders] = React.useState(false);
  const [trackInventory, setTrackInventory] = React.useState(true);
  const [unlimitedStock, setUnlimitedStock] = React.useState(false);

  // Form state - Images
  const [images, setImages] = React.useState<string[]>([]);
  const [mainImageAlt, setMainImageAlt] = React.useState("");

  // Form state - Visibility
  const [status, setStatus] = React.useState<ProductStatus>("ACTIVE");
  const [featured, setFeatured] = React.useState(false);
  const [publishDate, setPublishDate] = React.useState("");

  // Pool settings
  const [poolEnabled, setPoolEnabled] = React.useState(false);
  const [poolBasePrice, setPoolBasePrice] = React.useState(0);
  const [poolMinSalePrice, setPoolMinSalePrice] = React.useState(0);
  const [poolMaxSelectableQuantity, setPoolMaxSelectableQuantity] =
    React.useState(0);

  // Product type (set on load, not in tabs)
  const [productType, setProductType] = React.useState<ProductType>("PHYSICAL");
  const [productSource, setProductSource] = React.useState("VENDOR_STOCK");

  // UI state
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [productFound, setProductFound] = React.useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);

  // Dirty tracking
  const initialDataRef = React.useRef<string>("");

  const buildFormDataString = React.useCallback(() => {
    return JSON.stringify({
      name,
      description,
      category,
      tags,
      sku,
      price,
      comparePrice,
      costPrice,
      currency,
      taxable,
      stock,
      lowStock,
      allowBackorders,
      trackInventory,
      unlimitedStock,
      images,
      mainImageAlt,
      status,
      featured,
      publishDate,
      poolEnabled,
      poolBasePrice,
      poolMinSalePrice,
      poolMaxSelectableQuantity,
      productSource,
    });
  }, [
    name,
    description,
    category,
    tags,
    sku,
    price,
    comparePrice,
    costPrice,
    currency,
    taxable,
    stock,
    lowStock,
    allowBackorders,
    trackInventory,
    unlimitedStock,
    images,
    mainImageAlt,
    status,
    featured,
    publishDate,
    poolEnabled,
    poolBasePrice,
    poolMinSalePrice,
    poolMaxSelectableQuantity,
    productSource,
  ]);

  const isDirty = React.useMemo(() => {
    return buildFormDataString() !== initialDataRef.current;
  }, [buildFormDataString]);

  // Persist to localStorage on tab change
  const persistToLocalStorage = React.useCallback(() => {
    try {
      const data = {
        activeTab,
        name,
        description,
        category,
        tags,
        sku,
        price,
        comparePrice,
        costPrice,
        currency,
        taxable,
        stock,
        lowStock,
        allowBackorders,
        trackInventory,
        unlimitedStock,
        images,
        mainImageAlt,
        status,
        featured,
        publishDate,
        poolEnabled,
        poolBasePrice,
        poolMinSalePrice,
        poolMaxSelectableQuantity,
        productSource,
      };
      localStorage.setItem(
        `kwikseller_product_edit_${id}`,
        JSON.stringify(data)
      );
    } catch {
      // localStorage may not be available
    }
  }, [
    id,
    activeTab,
    name,
    description,
    category,
    tags,
    sku,
    price,
    comparePrice,
    costPrice,
    currency,
    taxable,
    stock,
    lowStock,
    allowBackorders,
    trackInventory,
    unlimitedStock,
    images,
    mainImageAlt,
    status,
    featured,
    publishDate,
    poolEnabled,
    poolBasePrice,
    poolMinSalePrice,
    poolMaxSelectableQuantity,
    productSource,
  ]);

  // Load product
  React.useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);

      // Try localStorage first
      try {
        const saved = localStorage.getItem(`kwikseller_product_edit_${id}`);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.name) {
            setActiveTab(data.activeTab || "basic");
            setName(data.name || "");
            setDescription(data.description || "");
            setCategory(data.category || "");
            setTags(data.tags || []);
            setSku(data.sku || "");
            setPrice(data.price || 0);
            setComparePrice(data.comparePrice || 0);
            setCostPrice(data.costPrice || 0);
            setCurrency(data.currency || "NGN");
            setTaxable(data.taxable || false);
            setStock(data.stock || 0);
            setLowStock(data.lowStock || 5);
            setAllowBackorders(data.allowBackorders || false);
            setTrackInventory(data.trackInventory ?? true);
            setUnlimitedStock(data.unlimitedStock || false);
            setImages(data.images || []);
            setMainImageAlt(data.mainImageAlt || "");
            setStatus(data.status || "ACTIVE");
            setFeatured(data.featured || false);
            setPublishDate(data.publishDate || "");
            setPoolEnabled(data.poolEnabled || false);
            setPoolBasePrice(data.poolBasePrice || 0);
            setPoolMinSalePrice(data.poolMinSalePrice || 0);
            setPoolMaxSelectableQuantity(data.poolMaxSelectableQuantity || 0);
            setProductSource(data.productSource || "VENDOR_STOCK");
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // continue loading from API
      }

      try {
        const response = await vendorCommerceApi.listProducts();
        const products = unwrapApiData<any[]>(response.data);
        const product = Array.isArray(products)
          ? products.find((p: any) => p.id === id)
          : null;

        if (!product) {
          setProductFound(false);
          setIsLoading(false);
          return;
        }

        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(product.price || 0);
        setComparePrice(product.comparePrice || 0);
        setSku(product.sku || "");
        setProductType(product.productType || "PHYSICAL");
        setProductSource(product.productSource || "VENDOR_STOCK");
        setStatus(product.status || "ACTIVE");
        setStock(product.stock || product.inventoryItems?.[0]?.available || 0);
        setLowStock(product.lowStock || 5);
        setTrackInventory(product.trackInventory ?? true);

        const productImages = product.images || [];
        const imageUrls = productImages.map((img: any) =>
          typeof img === "string" ? img : img.url
        );
        setImages(imageUrls);

        setPoolEnabled(product.poolEnabled || false);
        setPoolBasePrice(product.poolBasePrice || 0);
        setPoolMinSalePrice(product.poolMinSalePrice || 0);
        setPoolMaxSelectableQuantity(product.poolMaxSelectableQuantity || 0);

        // Store initial data for dirty tracking after load
        setTimeout(() => {
          initialDataRef.current = buildFormDataString();
        }, 0);
      } catch (error) {
        kwikToast.error(
          error instanceof Error ? error.message : "Could not load product"
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Persist on tab change
  React.useEffect(() => {
    if (!isLoading) {
      persistToLocalStorage();
    }
  }, [activeTab, isLoading, persistToLocalStorage]);

  // Tag handling
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Image handling
  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const uploads = await Promise.all(
        Array.from(files)
          .slice(0, 5 - images.length)
          .map((f) => uploadApi.productImage(f))
      );
      const urls = uploads.map(uploadedUrl).filter(Boolean);
      setImages((prev) => [...prev, ...urls].slice(0, 5));
      kwikToast.success(
        `${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`
      );
    } catch (error) {
      kwikToast.error(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  // Save handler
  const handleSave = async (saveAsDraft = false) => {
    if (!name.trim()) {
      kwikToast.error("Product name is required");
      return;
    }
    if (Number(price) <= 0) {
      kwikToast.error("Price must be greater than zero");
      return;
    }

    setIsSaving(true);
    try {
      if (productSource === "POOL_RESALE") {
        await vendorCommerceApi.updateProduct(id, {
          price: Number(price),
        });
        kwikToast.success("Selling price updated");
        try {
          localStorage.removeItem(`kwikseller_product_edit_${id}`);
        } catch {
          // ignore
        }
        return;
      }

      await vendorCommerceApi.updateProduct(id, {
        name: name.trim(),
        description: description || undefined,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        sku: sku || undefined,
        productType,
        status: saveAsDraft ? "DRAFT" : status,
        images,
        poolEnabled: productType === "PHYSICAL" ? poolEnabled : false,
        poolBasePrice: poolEnabled ? Number(poolBasePrice || price) : undefined,
        poolMinSalePrice: poolEnabled
          ? Number(poolMinSalePrice || poolBasePrice || price)
          : undefined,
        poolMaxSelectableQuantity:
          poolEnabled && poolMaxSelectableQuantity
            ? Number(poolMaxSelectableQuantity)
            : undefined,
      });
      kwikToast.success("Product updated successfully");
      // Clear localStorage on successful save
      try {
        localStorage.removeItem(`kwikseller_product_edit_${id}`);
      } catch {
        // ignore
      }
    } catch (error) {
      kwikToast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Warn on navigation if dirty
  const handleCancel = () => {
    if (isDirty) {
      setIsCancelModalOpen(true);
      return;
    }
    try {
      localStorage.removeItem(`kwikseller_product_edit_${id}`);
    } catch {
      // ignore
    }
    window.location.href = "/dashboard/products";
  };

  const confirmCancel = () => {
    try {
      localStorage.removeItem(`kwikseller_product_edit_${id}`);
    } catch {
      // ignore
    }
    window.location.href = "/dashboard/products";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="safe-container pb-24">
        <VendorPageHeader
          title="Edit Product"
          description="Update product details, pricing, and inventory."
          breadcrumbs={[
            { label: "Products", href: "/dashboard/products" },
            { label: "Edit Product" },
          ]}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
          <div className="space-y-4 sm:col-span-2 lg:col-span-2">
            <SkeletonText lines={2} />
            <Skeleton className="h-11 w-full" />
            <SkeletonText lines={3} />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!productFound) {
    return (
      <div className="safe-container py-20 text-center">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="mt-4 text-lg font-semibold text-foreground">
          Product not found
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/dashboard/products"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  if (productSource === "POOL_RESALE") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="safe-container max-w-2xl pb-24"
      >
        <VendorPageHeader
          title="Edit selling price"
          description="This is a Pool-sourced product. You do not own the source listing, so only your marketplace selling price can be changed."
          breadcrumbs={[
            { label: "Products", href: "/dashboard/products" },
            { label: "Edit selling price" },
          ]}
        />
        <section className="mt-6 rounded-2xl border border-kwik-border bg-surface p-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
              <p className="mt-1 text-base font-semibold text-foreground">{name}</p>
            </div>
            <FieldInput
              required
              type="number"
              min={1}
              label="Your selling price"
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              placeholder="0"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Source details, inventory, images, and fulfillment settings stay managed by the original Pool owner.
            </p>
          </div>
        </section>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <AppButton type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </AppButton>
          <AppButton
            type="button"
            variant="primary"
            onClick={() => handleSave(false)}
            isLoading={isSaving}
          >
            Save selling price
          </AppButton>
        </div>
        <AppModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Discard changes?"
          description="You have unsaved changes. Leaving now will lose them."
          className="sm:max-w-md"
        >
          <div className="flex items-center justify-end gap-3">
            <AppButton type="button" variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
              Keep editing
            </AppButton>
            <AppButton type="button" variant="danger" onClick={confirmCancel}>
              Discard & leave
            </AppButton>
          </div>
        </AppModal>
      </motion.div>
    );
  }

  /* ─── Tab content renderers ─── */

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="sm:col-span-2">
        <FieldInput
          required
          label="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter product name"
        />
      </div>
      <div className="sm:col-span-2">
        <FieldTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Describe your product in detail..."
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {description.length} / 2000 characters
        </p>
      </div>
      <FieldSelect
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Select a category</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </FieldSelect>
      <div className="sm:col-span-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Tags</span>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-kwik-border bg-surface px-3 py-2 min-h-[44px]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-default-100 px-2 py-0.5 text-xs font-medium text-foreground"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={
                tags.length === 0
                  ? "Type and press Enter to add tags"
                  : "Add another"
              }
              className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Up to 10 tags. Press Enter to add.
          </p>
        </label>
      </div>
      <FieldInput
        label="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        placeholder="e.g. PROD-001"
      />
      {!sku && name && (
        <button
          type="button"
          onClick={() => setSku(generateSku(name))}
          className="text-xs text-muted-foreground underline hover:text-foreground transition"
        >
          Auto-generate SKU from product name
        </button>
      )}
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-4">
      <FieldInput
        required
        type="number"
        min={0}
        label="Base price"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        placeholder="0"
      />
      <div>
        <FieldInput
          type="number"
          min={0}
          label="Compare-at / Sale price"
          value={comparePrice}
          onChange={(e) => setComparePrice(Number(e.target.value))}
          placeholder="0"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Shows strikethrough on marketplace
        </p>
      </div>
      <div>
        <FieldInput
          type="number"
          min={0}
          label="Cost price"
          value={costPrice}
          onChange={(e) => setCostPrice(Number(e.target.value))}
          placeholder="0"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Hidden from customers - for profit tracking
        </p>
      </div>
      <FieldSelect
        label="Currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
        <option value="NGN">Nigerian Naira (NGN)</option>
        <option value="USD">US Dollar (USD)</option>
      </FieldSelect>
      <AppSwitch
        isSelected={taxable}
        onChange={setTaxable}
        label="Taxable"
        description="Apply tax to this product"
      />
      {price > 0 && comparePrice > 0 && comparePrice < price && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          Customers will see {formatCurrency(comparePrice)} crossed out and{" "}
          {formatCurrency(price)} as the sale price.
        </div>
      )}
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-4">
      {productType === "DIGITAL" ? (
        <div className="space-y-4">
          <AppSwitch
            isSelected={unlimitedStock}
            onChange={setUnlimitedStock}
            label="Unlimited stock"
            description="Digital products typically have unlimited availability"
          />
          {!unlimitedStock && (
            <FieldInput
              type="number"
              min={0}
              label="Available licenses / copies"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AppSwitch
            isSelected={trackInventory}
            onChange={setTrackInventory}
            label="Track inventory"
            description="Keep track of stock levels"
          />
          {trackInventory && !unlimitedStock && (
            <>
              <FieldInput
                type="number"
                min={0}
                label="Stock quantity"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
              />
              <FieldInput
                type="number"
                min={0}
                label="Low stock threshold"
                value={lowStock}
                onChange={(e) => setLowStock(Number(e.target.value))}
              />
            </>
          )}
          <AppSwitch
            isSelected={unlimitedStock}
            onChange={setUnlimitedStock}
            label="Unlimited stock"
            description="For items with no stock limit"
          />
          <AppSwitch
            isSelected={allowBackorders}
            onChange={setAllowBackorders}
            label="Allow backorders"
            description="Customers can order even when out of stock"
          />
        </div>
      )}
    </div>
  );

  const renderImages = () => (
    <div className="space-y-4">
      {/* Main image upload */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Main Image
        </p>
        <label className="block">
          <div className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-kwik-border bg-default-100 p-6 text-center transition hover:border-accent">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : images.length > 0 ? (
              <div className="relative h-full w-full">
                <img
                  src={images[0]}
                  alt="Main product"
                  className="max-h-40 w-auto mx-auto object-contain"
                />
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG up to 5MB
                </p>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="sr-only"
              onChange={(e) => uploadImages(e.target.files)}
            />
          </div>
        </label>
      </div>

      {/* Alt text for main image */}
      <FieldInput
        label="Alt text for main image"
        value={mainImageAlt}
        onChange={(e) => setMainImageAlt(e.target.value)}
        placeholder="Describe the image for accessibility"
      />

      {/* Gallery images */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Gallery Images ({images.length}/5)
        </p>
        {images.length > 1 ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.slice(1).map((url, idx) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-md border border-kwik-border bg-default-100"
              >
                {/* Drag handle */}
                <div className="absolute left-1 top-1 z-10 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                  <GripVertical className="h-4 w-4" />
                </div>
                <img
                  src={url}
                  alt={mainImageAlt || `Gallery image ${idx + 2}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-md border border-dashed border-kwik-border bg-default-100 transition hover:border-accent">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  className="sr-only"
                  onChange={(e) => uploadImages(e.target.files)}
                />
              </label>
            )}
          </div>
        ) : images.length <= 1 && images.length < 5 ? (
          <label className="flex min-h-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-kwik-border bg-default-100 transition hover:border-accent">
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Add gallery images (up to {5 - images.length} more)
              </p>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              className="sr-only"
              onChange={(e) => uploadImages(e.target.files)}
            />
          </label>
        ) : null}
      </div>
    </div>
  );

  const renderVisibility = () => (
    <div className="space-y-4">
      <FieldSelect
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as ProductStatus)}
      >
        <option value="ACTIVE">Active</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </FieldSelect>
      <AppSwitch
        isSelected={featured}
        onChange={setFeatured}
        label="Featured product"
        description="Shows in featured products section on your storefront"
      />
      <div>
        <FieldInput
          type="date"
          label="Schedule publish date (optional)"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Leave empty to publish immediately when status is Active
        </p>
      </div>
    </div>
  );

  const tabContent: Record<TabKey, () => React.ReactNode> = {
    basic: renderBasicInfo,
    pricing: renderPricing,
    inventory: renderInventory,
    images: renderImages,
    visibility: renderVisibility,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container pb-24"
    >
      {/* Page Header */}
      <VendorPageHeader
        title="Edit Product"
        description="Update product details, pricing, and inventory."
        breadcrumbs={[
          { label: "Products", href: "/dashboard/products" },
          { label: "Edit Product" },
        ]}
        actions={
          <div className="hidden lg:flex gap-2">
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => setProductType(productType)}
              disabled
            >
              {productType === "PHYSICAL" ? "Physical" : "Digital"} Product
            </AppButton>
            {isDirty && (
              <span className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="mt-6 border-b border-kwik-border mb-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
        {tabContent[activeTab]()}
      </div>

      {/* Pool Settings (shown if PHYSICAL type) */}
      {productType === "PHYSICAL" && (
        <section className="border-t border-kwik-border mt-10 pt-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Pool Settings
          </h2>
          <div className="space-y-4">
            <AppSwitch
              isSelected={poolEnabled}
              onChange={(sel) => {
                setPoolEnabled(sel);
                if (sel && !poolBasePrice) setPoolBasePrice(price);
                if (sel && !poolMinSalePrice) setPoolMinSalePrice(price);
              }}
              label="Make available in Pool"
              description="Other vendors can select and sell this product from their storefront."
            />
            {poolEnabled && (
              <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
                <FieldInput
                  type="number"
                  min={0}
                  label="Source price"
                  value={poolBasePrice || price}
                  onChange={(e) =>
                    setPoolBasePrice(Number(e.target.value))
                  }
                />
                <FieldInput
                  type="number"
                  min={poolBasePrice || price}
                  label="Min sale price"
                  value={poolMinSalePrice || poolBasePrice || price}
                  onChange={(e) =>
                    setPoolMinSalePrice(Number(e.target.value))
                  }
                />
                <FieldInput
                  type="number"
                  min={0}
                  label="Pool quantity"
                  placeholder="Use stock"
                  value={poolMaxSelectableQuantity || ""}
                  onChange={(e) =>
                    setPoolMaxSelectableQuantity(Number(e.target.value))
                  }
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-kwik-border bg-surface lg:static lg:border-t lg:mt-8 lg:pt-6">
        <div className="safe-container flex items-center justify-between gap-3 py-3 lg:py-0">
          <AppButton
            type="button"
            variant="ghost"
            onClick={handleCancel}
            className="hidden lg:inline-flex"
          >
            Cancel
          </AppButton>
          <div className="flex w-full gap-2 lg:w-auto">
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => handleSave(true)}
              isLoading={isSaving}
              fullWidth
              className="lg:w-auto"
            >
              Save as Draft
            </AppButton>
            <AppButton
              type="button"
              variant="primary"
              onClick={() => handleSave(false)}
              isLoading={isSaving}
              fullWidth
              className="lg:w-auto"
            >
              Save Changes
            </AppButton>
          </div>
        </div>
      </div>

      <AppModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Discard changes?"
        description="You have unsaved changes. Leaving now will lose them."
        className="sm:max-w-md"
      >
        <div className="flex items-center justify-end gap-3">
          <AppButton type="button" variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
            Keep editing
          </AppButton>
          <AppButton type="button" variant="danger" onClick={confirmCancel}>
            Discard & leave
          </AppButton>
        </div>
      </AppModal>
    </motion.div>
  );
}
