/**
 * Browse-page product catalog.
 *
 * Used by the /products listing page so users can search, filter by
 * category, and sort. Mirrors the MarketplaceProduct shape so the same
 * cards/components work.
 */
import type { MarketplaceProduct } from "./marketplace-home";

export interface BrowseProduct extends MarketplaceProduct {
  /** Total units sold — used by the "Most popular" sort. */
  salesCount: number;
  /** Date added (ISO) — used by the "Newest" sort. */
  dateAdded: string;
  /** Stock available — used to show low-stock badges. */
  stock: number;
}

type P = Partial<BrowseProduct> &
  Pick<BrowseProduct, "id" | "name" | "price" | "image" | "store" | "category">;

function make(p: P): BrowseProduct {
  return {
    slug: p.id,
    rating: 4.5,
    reviewCount: 120,
    productType: "PHYSICAL",
    productSource: "VENDOR_STOCK",
    requiresShipping: true,
    trackInventory: true,
    salesCount: 100,
    dateAdded: "2025-06-01",
    stock: 50,
    ...p,
  } as BrowseProduct;
}

export const browseProducts: BrowseProduct[] = [
  // ── Fashion ──
  make({ id: "bp-1", name: "Ankara Print Maxi Dress", price: 18500, comparePrice: 24000, image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80", store: "Zara's Collection", storeSlug: "zara-collection", category: "Fashion", rating: 4.8, reviewCount: 214, tag: "Bestseller", isNew: true, salesCount: 1840, dateAdded: "2025-07-10", stock: 32 }),
  make({ id: "bp-2", name: "African Print Sneakers", price: 22000, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80", store: "Zara's Collection", storeSlug: "zara-collection", category: "Fashion", rating: 4.6, reviewCount: 187, isNew: true, salesCount: 920, dateAdded: "2025-07-08", stock: 18 }),
  make({ id: "bp-3", name: "Designer Sunglasses", price: 16500, comparePrice: 22000, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80", store: "Zara's Collection", storeSlug: "zara-collection", category: "Fashion", rating: 4.4, reviewCount: 156, salesCount: 640, dateAdded: "2025-06-20", stock: 45 }),
  make({ id: "bp-4", name: "Linen Summer Shirt", price: 9800, comparePrice: 14000, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80", store: "Glow Beauty Bar", storeSlug: "glow-beauty-bar", category: "Fashion", rating: 4.5, reviewCount: 98, salesCount: 410, dateAdded: "2025-06-15", stock: 7 }),
  make({ id: "bp-5", name: "Handwoven Straw Hat", price: 6500, image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80", store: "HomeVibe Decor", storeSlug: "homevibe-decor", category: "Fashion", rating: 4.3, reviewCount: 64, salesCount: 230, dateAdded: "2025-05-28", stock: 60 }),

  // ── Electronics ──
  make({ id: "bp-6", name: "Wireless Bluetooth Earbuds Pro", price: 32000, comparePrice: 45000, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80", store: "TechHub Africa", storeSlug: "techhub-africa", category: "Electronics", rating: 4.6, reviewCount: 540, tag: "Hot", salesCount: 3120, dateAdded: "2025-07-12", stock: 25 }),
  make({ id: "bp-7", name: "Smart Fitness Watch", price: 28500, comparePrice: 38000, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", store: "TechHub Africa", storeSlug: "techhub-africa", category: "Electronics", rating: 4.5, reviewCount: 420, tag: "Trending", salesCount: 2100, dateAdded: "2025-07-05", stock: 40 }),
  make({ id: "bp-8", name: "Mechanical Keyboard RGB", price: 34000, comparePrice: 42000, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80", store: "TechHub Africa", storeSlug: "techhub-africa", category: "Electronics", rating: 4.8, reviewCount: 389, salesCount: 1450, dateAdded: "2025-06-25", stock: 12 }),
  make({ id: "bp-9", name: "Bluetooth Speaker", price: 11500, comparePrice: 21000, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80", store: "TechHub Africa", storeSlug: "techhub-africa", category: "Electronics", rating: 4.4, reviewCount: 210, salesCount: 880, dateAdded: "2025-06-18", stock: 33 }),
  make({ id: "bp-10", name: "Power Bank 20000mAh", price: 14500, comparePrice: 26000, image: "https://images.unsplash.com/photo-1609592424823-2a0d2d1e8a8a?auto=format&fit=crop&w=600&q=80", store: "TechHub Africa", storeSlug: "techhub-africa", category: "Electronics", rating: 4.7, reviewCount: 612, tag: "Bestseller", salesCount: 4200, dateAdded: "2025-07-01", stock: 5 }),

  // ── Beauty ──
  make({ id: "bp-11", name: "Shea Butter Glow Set", price: 12500, image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=600&q=80", store: "Glow Beauty Bar", storeSlug: "glow-beauty-bar", category: "Beauty", rating: 4.9, reviewCount: 312, tag: "Natural", salesCount: 1670, dateAdded: "2025-07-09", stock: 48 }),
  make({ id: "bp-12", name: "Skincare Bundle", price: 9800, comparePrice: 17500, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80", store: "Glow Beauty Bar", storeSlug: "glow-beauty-bar", category: "Beauty", rating: 4.6, reviewCount: 245, salesCount: 980, dateAdded: "2025-06-22", stock: 22 }),
  make({ id: "bp-13", name: "Natural Hair Care Kit", price: 15500, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80", store: "Glow Beauty Bar", storeSlug: "glow-beauty-bar", category: "Beauty", rating: 4.5, reviewCount: 178, isNew: true, salesCount: 540, dateAdded: "2025-07-11", stock: 30 }),

  // ── Home & Living ──
  make({ id: "bp-14", name: "Handwoven Storage Basket", price: 8900, comparePrice: 12000, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80", store: "HomeVibe Decor", storeSlug: "homevibe-decor", category: "Home & Living", rating: 4.7, reviewCount: 98, salesCount: 320, dateAdded: "2025-06-10", stock: 28 }),
  make({ id: "bp-15", name: "Yoga Mat Premium", price: 9500, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80", store: "HomeVibe Decor", storeSlug: "homevibe-decor", category: "Home & Living", rating: 4.7, reviewCount: 203, salesCount: 760, dateAdded: "2025-06-12", stock: 41 }),
  make({ id: "bp-16", name: "Scented Candle Trio", price: 7200, image: "https://images.unsplash.com/photo-1602874801006-1d5b95044413?auto=format&fit=crop&w=600&q=80", store: "HomeVibe Decor", storeSlug: "homevibe-decor", category: "Home & Living", rating: 4.6, reviewCount: 112, salesCount: 410, dateAdded: "2025-05-30", stock: 55 }),
  make({ id: "bp-17", name: "Ceramic Plant Pots (Set of 3)", price: 13400, comparePrice: 18000, image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80", store: "HomeVibe Decor", storeSlug: "homevibe-decor", category: "Home & Living", rating: 4.5, reviewCount: 87, isNew: true, salesCount: 290, dateAdded: "2025-07-13", stock: 19 }),

  // ── Food ──
  make({ id: "bp-18", name: "Organic Honey 1L", price: 6500, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80", store: "FreshMart Express", storeSlug: "freshmart-express", category: "Food", rating: 4.9, reviewCount: 640, tag: "Bestseller", salesCount: 2800, dateAdded: "2025-06-28", stock: 70 }),
  make({ id: "bp-19", name: "Premium Coffee Beans 500g", price: 8200, comparePrice: 11000, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80", store: "FreshMart Express", storeSlug: "freshmart-express", category: "Food", rating: 4.7, reviewCount: 189, salesCount: 720, dateAdded: "2025-06-19", stock: 36 }),
  make({ id: "bp-20", name: "Spice Gift Collection", price: 11800, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80", store: "FreshMart Express", storeSlug: "freshmart-express", category: "Food", rating: 4.6, reviewCount: 134, isNew: true, salesCount: 380, dateAdded: "2025-07-14", stock: 24 }),

  // ── Automobiles ──
  make({ id: "bp-21", name: "Car Phone Mount", price: 4500, comparePrice: 7000, image: "https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?auto=format&fit=crop&w=600&q=80", store: "AutoParts NG", storeSlug: "autoparts-ng", category: "Automobiles", rating: 4.3, reviewCount: 87, salesCount: 540, dateAdded: "2025-06-05", stock: 80 }),
  make({ id: "bp-22", name: "Car Air Freshener Pack", price: 3200, image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80", store: "AutoParts NG", storeSlug: "autoparts-ng", category: "Automobiles", rating: 4.2, reviewCount: 56, salesCount: 210, dateAdded: "2025-05-25", stock: 120 }),
  make({ id: "bp-23", name: "LED Car Headlight Bulbs", price: 18900, comparePrice: 26000, image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80", store: "AutoParts NG", storeSlug: "autoparts-ng", category: "Automobiles", rating: 4.5, reviewCount: 142, tag: "Hot", salesCount: 670, dateAdded: "2025-06-14", stock: 15 }),
];

/** Distinct category list derived from the catalog. */
export const browseCategories: { label: string; value: string }[] = [
  { label: "All Categories", value: "all" },
  ...Array.from(new Set(browseProducts.map((p) => p.category))).map((c) => ({
    label: c,
    value: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  })),
];

/** Distinct store list derived from the catalog. */
export const browseStores: { label: string; value: string }[] = [
  { label: "All Vendors", value: "all" },
  ...Array.from(
    new Map(
      browseProducts.map((p) => [p.storeSlug ?? p.store, p.store]),
    ).entries(),
  ).map(([value, label]) => ({ label, value })),
];

export type SortOption =
  | "popular"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Most Popular", value: "popular" },
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" },
];
