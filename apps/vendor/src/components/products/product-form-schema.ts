import { z } from "zod";

/**
 * Product form schema (RHF + zod).
 *
 * Shared between the New Product and Edit Product flows. The form stores
 * images as `ImageUploadValue[]` (object form) so the shared `ImageUpload`
 * component can manage drag-reordering + main-image selection. The parent
 * `onSubmit` handler is responsible for collapsing images to `string[]`
 * before calling the API.
 */

const imageValueSchema = z.object({
  id: z.string(),
  url: z.string(),
  file: z.any().optional(),
  isMain: z.boolean().optional(),
});

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  options: z.string().optional(),
  priceOverride: z.number().min(0).optional(),
  stockOverride: z.number().int().min(0).optional(),
  sku: z.string().optional(),
});

export const productFormSchema = z.object({
  name: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .max(160, "Product name is too long"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description is too long"),
  categoryId: z
    .string({ error: "Please select a category" })
    .min(1, "Please select a category"),
  price: z
    .number({ error: "Price is required" })
    .min(1, "Price must be at least 1"),
  comparePrice: z.number().optional(),
  stock: z
    .number({ error: "Stock is required" })
    .min(0, "Stock cannot be negative"),
  lowStockThreshold: z
    .number({ error: "Low stock threshold is required" })
    .min(0, "Low stock threshold cannot be negative"),
  sku: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  images: z
    .array(imageValueSchema)
    .min(1, "At least one product image is required"),
  variants: z.array(variantSchema).optional(),
  // Pool fields
  poolEnabled: z.boolean().default(false),
  poolBasePrice: z.number().min(0).optional(),
  poolMinSalePrice: z.number().min(0).optional(),
  poolMaxSelectableQuantity: z.number().int().min(1).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductVariant = z.infer<typeof variantSchema>;

export const PRODUCT_CATEGORIES = [
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
] as const;

export const PRODUCT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
