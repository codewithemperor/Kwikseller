import { z } from "zod";

// ==================== PRODUCT SCHEMA ====================

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  comparePrice: z.number().min(0).optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  isFeatured: z.boolean(),
  tags: z.array(z.string()),
  images: z.array(z.string()),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ==================== CATEGORY SCHEMA ====================

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ==================== BRAND SCHEMA ====================

export const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  isActive: z.boolean(),
});

export type BrandFormData = z.infer<typeof brandSchema>;

// ==================== BANNER SCHEMA ====================

export const bannerSchema = z.object({
  title: z.string().min(1, "Banner title is required").max(200),
  imageUrl: z.string().min(1, "Banner image is required"),
  linkUrl: z.string().optional(),
  position: z.enum([
    "HOME_HERO",
    "HOME_SIDEBAR",
    "CATEGORY_TOP",
    "PRODUCT_PAGE",
  ]),
  isActive: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type BannerFormData = z.infer<typeof bannerSchema>;

// ==================== DEAL SCHEMA ====================

export const dealSchema = z.object({
  title: z.string().min(1, "Deal title is required").max(200),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(0, "Discount must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  productIds: z.array(z.string()),
  categoryIds: z.array(z.string()),
});

export type DealFormData = z.infer<typeof dealSchema>;

// ==================== COUPON SCHEMA ====================

export const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .max(20)
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, "")),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(0, "Discount must be positive"),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CouponFormData = z.infer<typeof couponSchema>;
