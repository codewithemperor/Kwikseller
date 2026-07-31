/**
 * Mock home feed data.
 *
 * Used as a graceful fallback when the live API (`marketplaceApi.getHomeFeed`)
 * is unreachable — e.g. in preview/staging environments without a backend, or
 * during a network blip. This keeps the homepage rich and explorable instead of
 * showing a bare "could not load" screen.
 *
 * Content reflects KWIKSELLER's African-marketplace positioning.
 */
import type { MarketplaceProduct } from "./marketplace-home";
import type {
  HomeFeedResponse,
  PoolOffer,
  PoolCampaign,
} from "@/stores/home-feed-store";

// ─── Banners ────────────────────────────────────────────────────────────────

const heroBanners: HomeFeedResponse["heroBanners"] = [
  {
    id: "b1",
    title: "Shop Africa, Delivered Everywhere",
    subtitle: "Millions of products from verified vendors across 15+ countries.",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80",
    href: "/products",
    badge: "New Season",
  },
  {
    id: "b2",
    title: "KwisCrow Protected Payments",
    subtitle: "Your money stays in escrow until you confirm delivery. Always.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
    href: "/about",
    badge: "Buyer Protection",
  },
  {
    id: "b3",
    title: "Become a Vendor — Sell in Minutes",
    subtitle: "Open your store, quote orders, and get paid on delivery.",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
    href: "/vendor",
    badge: "For Sellers",
  },
];

// ─── Categories ──────────────────────────────────────────────────────────────

const categories: HomeFeedResponse["categories"] = [
  {
    id: "c1",
    name: "Fashion & Apparel",
    slug: "fashion",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80",
    itemCount: 18420,
  },
  {
    id: "c2",
    name: "Electronics",
    slug: "electronics",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80",
    itemCount: 9874,
  },
  {
    id: "c3",
    name: "Health & Beauty",
    slug: "beauty",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
    itemCount: 7321,
  },
  {
    id: "c4",
    name: "Home & Living",
    slug: "home-living",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=600&q=80",
    itemCount: 11203,
  },
  {
    id: "c5",
    name: "Food & Groceries",
    slug: "food",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    itemCount: 6540,
  },
  {
    id: "c6",
    name: "Automobiles",
    slug: "automobiles",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
    itemCount: 2104,
  },
];

// ─── Brands ──────────────────────────────────────────────────────────────────

const brands: HomeFeedResponse["brands"] = [
  { id: "br1", name: "Zara Collection", image: null, productCount: 1240 },
  { id: "br2", name: "TechHub Africa", image: null, productCount: 980 },
  { id: "br3", name: "Glow Beauty", image: null, productCount: 760 },
  { id: "br4", name: "FreshMart", image: null, productCount: 1530 },
  { id: "br5", name: "HomeVibe", image: null, productCount: 642 },
  { id: "br6", name: "AutoParts NG", image: null, productCount: 410 },
];

// ─── Products ────────────────────────────────────────────────────────────────

function product(p: Partial<MarketplaceProduct> & { id: string; name: string; price: number; image: string; store: string; category: string }): MarketplaceProduct {
  return {
    slug: p.id,
    rating: 4.5,
    reviewCount: 120,
    productType: "PHYSICAL",
    productSource: "VENDOR_STOCK",
    requiresShipping: true,
    trackInventory: true,
    ...p,
  };
}

const featuredProducts: MarketplaceProduct[] = [
  product({
    id: "p1",
    name: "Ankara Print Maxi Dress",
    price: 18500,
    comparePrice: 24000,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
    store: "Zara's Collection",
    storeSlug: "zara-collection",
    category: "Fashion",
    rating: 4.8,
    reviewCount: 214,
    tag: "Bestseller",
    isNew: true,
  }),
  product({
    id: "p2",
    name: "Wireless Bluetooth Earbuds Pro",
    price: 32000,
    comparePrice: 45000,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80",
    store: "TechHub Africa",
    storeSlug: "techhub-africa",
    category: "Electronics",
    rating: 4.6,
    reviewCount: 540,
    tag: "Hot",
  }),
  product({
    id: "p3",
    name: "Shea Butter Glow Set",
    price: 12500,
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=600&q=80",
    store: "Glow Beauty Bar",
    storeSlug: "glow-beauty-bar",
    category: "Beauty",
    rating: 4.9,
    reviewCount: 312,
    tag: "Natural",
  }),
  product({
    id: "p4",
    name: "Handwoven Storage Basket",
    price: 8900,
    comparePrice: 12000,
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80",
    store: "HomeVibe Decor",
    storeSlug: "homevibe-decor",
    category: "Home & Living",
    rating: 4.7,
    reviewCount: 98,
  }),
  product({
    id: "p5",
    name: "Smart Fitness Watch",
    price: 28500,
    comparePrice: 38000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    store: "TechHub Africa",
    storeSlug: "techhub-africa",
    category: "Electronics",
    rating: 4.5,
    reviewCount: 420,
    tag: "Trending",
  }),
  product({
    id: "p6",
    name: "African Print Sneakers",
    price: 22000,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
    store: "Zara's Collection",
    storeSlug: "zara-collection",
    category: "Fashion",
    rating: 4.6,
    reviewCount: 187,
    isNew: true,
  }),
];

const dealProducts: MarketplaceProduct[] = [
  product({
    id: "d1",
    name: "Flash Deal: Power Bank 20000mAh",
    price: 14500,
    comparePrice: 26000,
    image: "https://images.unsplash.com/photo-1609592424823-2a0d2d1e8a8a?auto=format&fit=crop&w=600&q=80",
    store: "TechHub Africa",
    storeSlug: "techhub-africa",
    category: "Electronics",
    tag: "-44%",
  }),
  product({
    id: "d2",
    name: "Flash Deal: Skincare Bundle",
    price: 9800,
    comparePrice: 17500,
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80",
    store: "Glow Beauty Bar",
    storeSlug: "glow-beauty-bar",
    category: "Beauty",
    tag: "-44%",
  }),
  product({
    id: "d3",
    name: "Flash Deal: Bluetooth Speaker",
    price: 11500,
    comparePrice: 21000,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80",
    store: "TechHub Africa",
    storeSlug: "techhub-africa",
    category: "Electronics",
    tag: "-45%",
  }),
  product({
    id: "d4",
    name: "Flash Deal: Linen Shirt",
    price: 7900,
    comparePrice: 14000,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
    store: "Zara's Collection",
    storeSlug: "zara-collection",
    category: "Fashion",
    tag: "-44%",
  }),
];

const trendingProducts: MarketplaceProduct[] = [
  product({
    id: "t1",
    name: "Organic Honey 1L",
    price: 6500,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
    store: "FreshMart Express",
    storeSlug: "freshmart-express",
    category: "Food",
    rating: 4.9,
    reviewCount: 640,
  }),
  product({
    id: "t2",
    name: "Designer Sunglasses",
    price: 16500,
    comparePrice: 22000,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80",
    store: "Zara's Collection",
    storeSlug: "zara-collection",
    category: "Fashion",
    rating: 4.4,
    reviewCount: 156,
  }),
  product({
    id: "t3",
    name: "Yoga Mat Premium",
    price: 9500,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80",
    store: "HomeVibe Decor",
    storeSlug: "homevibe-decor",
    category: "Home & Living",
    rating: 4.7,
    reviewCount: 203,
  }),
  product({
    id: "t4",
    name: "Mechanical Keyboard RGB",
    price: 34000,
    comparePrice: 42000,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    store: "TechHub Africa",
    storeSlug: "techhub-africa",
    category: "Electronics",
    rating: 4.8,
    reviewCount: 389,
  }),
  product({
    id: "t5",
    name: "Scented Candle Trio",
    price: 7200,
    image: "https://images.unsplash.com/photo-1602874801006-1d5b95044413?auto=format&fit=crop&w=600&q=80",
    store: "HomeVibe Decor",
    storeSlug: "homevibe-decor",
    category: "Home & Living",
    rating: 4.6,
    reviewCount: 112,
  }),
  product({
    id: "t6",
    name: "Car Phone Mount",
    price: 4500,
    comparePrice: 7000,
    image: "https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?auto=format&fit=crop&w=600&q=80",
    store: "AutoParts NG",
    storeSlug: "autoparts-ng",
    category: "Automobiles",
    rating: 4.3,
    reviewCount: 87,
  }),
];

// ─── Pool offers & campaigns (group-buy / resale) ───────────────────────────

const poolOffers: PoolOffer[] = [
  {
    id: "po1",
    retailPrice: 18500,
    markup: 15,
    product: {
      id: "po1p",
      name: "Bulk Ankara Fabric (10yd)",
      price: 14500,
      images: [{ url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80", isMain: true }],
      category: { name: "Fashion" },
    },
    store: { name: "Lagos Textile Co." },
  },
  {
    id: "po2",
    retailPrice: 32000,
    markup: 12,
    product: {
      id: "po2p",
      name: "Wholesale Earbuds (50 pcs)",
      price: 26500,
      images: [{ url: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80", isMain: true }],
      category: { name: "Electronics" },
    },
    store: { name: "Import Hub" },
  },
];

const poolCampaigns: PoolCampaign[] = [
  {
    id: "pc1",
    title: "Group Buy: Stainless Cookware Set",
    targetQuantity: 100,
    committedQuantity: 64,
    unitPrice: 24000,
    status: "ACTIVE",
    poolProduct: { name: "Stainless Cookware Set (10pc)" },
  },
  {
    id: "pc2",
    title: "Group Buy: School Backpacks",
    targetQuantity: 200,
    committedQuantity: 178,
    unitPrice: 8500,
    status: "ACTIVE",
    poolProduct: { name: "Durable School Backpack" },
  },
];

export const mockHomeFeed: HomeFeedResponse = {
  heroBanners,
  categories,
  brands,
  featuredProducts,
  dealProducts,
  trendingProducts,
};

export const mockPoolOffers: PoolOffer[] = poolOffers;
export const mockPoolCampaigns: PoolCampaign[] = poolCampaigns;
