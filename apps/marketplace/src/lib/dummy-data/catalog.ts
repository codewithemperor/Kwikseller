/**
 * Dummy catalog dataset for the marketplace.
 *
 * Served ONLY by the in-app route handlers at /api/v1/* when
 * NEXT_PUBLIC_USE_DUMMY_DATA=true. In production this module is never
 * imported (the route handlers gate on the env flag and dynamic-import
 * this module only when dummy mode is active).
 *
 * Shapes mirror the API contracts in `@/lib/api` and `@kwikseller/api-client`
 * so the same frontend code works against the real NestJS backend unchanged.
 */

export interface DummyStore {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  location: string;
  isVerified: boolean;
  createdAt: string;
  // ─── Storefront enrichment (cycle 6) ───────────────────────────
  // All optional so existing seed entries keep working if omitted.
  responseTimeHours?: number;     // typical vendor reply time
  fulfillmentHours?: number;      // typical order processing time
  responseRatePct?: number;       // % of messages answered
  returnPolicyDays?: number;      // buyer return window
  storeHours?: { day: string; open: string; close: string; closed?: boolean }[];
  socialLinks?: { type: "instagram" | "twitter" | "facebook" | "whatsapp" | "tiktok"; url: string }[];
  totalSales?: number;            // lifetime order count
  badges?: string[];              // e.g. ["Top Seller", "Fast Responder"]
  contactEmail?: string;
  phone?: string;
}

export interface DummyCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  imageUrl: string;
  icon?: string;
  isActive: boolean;
  position: number;
  _count?: { products: number };
}

export interface DummyBrand {
  id: string;
  name: string;
  slug: string;
  image: string;
  status: boolean;
  _count?: { products: number };
  // ── Enrichment (cycle 7) ────────────────────────────────────────────────
  story?: string;
  tagline?: string;
  foundedYear?: number;
  country?: string;
  headquarters?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  totalSales?: number;
  followCount?: number;
  verified?: boolean;
  badges?: string[];
  categories?: string[];
  socialLinks?: { type: string; url: string }[];
  coverImage?: string;
}

export interface DummyProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stock: number;
  status: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  categoryId: string;
  brandId: string;
  storeId: string;
  store: { id: string; name: string; slug: string; logoUrl?: string; location?: string };
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; image?: string };
  images: { id: string; url: string; alt?: string; isMain: boolean; position: number }[];
  variants: { id: string; name: string; options: string; price: number; stock: number }[];
  tags: { productId: string; tagId: string; tag?: { id: string; name: string } }[];
  createdAt: string;
  updatedAt: string;
}

export interface DummyBanner {
  id: string;
  title?: string;
  subTitle?: string;
  image: string;
  url?: string;
  bannerType: string;
  resourceType?: string;
  resourceId?: string;
  backgroundColor?: string;
  buttonText?: string;
  position: number;
  isActive: boolean;
}

export interface DummyDeal {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  dealType: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  products?: { id: string; dealPrice: number; product: DummyProduct }[];
}

// ─── Stores ────────────────────────────────────────────────────────────────

export const stores: DummyStore[] = [
  {
    id: "store-zara",
    name: "Zara's Collection",
    slug: "zara-collection",
    description: "Premium African fashion — Ankara, ready-to-wear and accessories crafted in Lagos.",
    logoUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    rating: 4.8,
    reviewCount: 1240,
    productCount: 86,
    location: "Lagos, Nigeria",
    isVerified: true,
    createdAt: "2024-03-12T10:00:00.000Z",
    responseTimeHours: 2,
    fulfillmentHours: 6,
    responseRatePct: 98,
    returnPolicyDays: 14,
    totalSales: 8420,
    contactEmail: "hello@zarascollection.ng",
    phone: "+234 802 555 0142",
    badges: ["Top Seller", "Fast Responder", "KwisCrow Verified"],
    storeHours: [
      { day: "Mon", open: "09:00", close: "18:00" },
      { day: "Tue", open: "09:00", close: "18:00" },
      { day: "Wed", open: "09:00", close: "18:00" },
      { day: "Thu", open: "09:00", close: "18:00" },
      { day: "Fri", open: "09:00", close: "18:00" },
      { day: "Sat", open: "10:00", close: "16:00" },
      { day: "Sun", open: "00:00", close: "00:00", closed: true },
    ],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/zarascollection" },
      { type: "whatsapp", url: "https://wa.me/2348025550142" },
      { type: "tiktok", url: "https://tiktok.com/@zarascollection" },
    ],
  },
  {
    id: "store-techhub",
    name: "TechHub Africa",
    slug: "techhub-africa",
    description: "Genuine electronics, gadgets and accessories with warranty and fast delivery.",
    logoUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1600&q=80",
    rating: 4.7,
    reviewCount: 2890,
    productCount: 142,
    location: "Abuja, Nigeria",
    isVerified: true,
    createdAt: "2024-01-20T10:00:00.000Z",
    responseTimeHours: 1,
    fulfillmentHours: 4,
    responseRatePct: 99,
    returnPolicyDays: 7,
    totalSales: 15320,
    contactEmail: "support@techhub.africa",
    phone: "+234 805 555 0199",
    badges: ["Top Seller", "Warranty Included", "Fast Responder"],
    storeHours: [
      { day: "Mon", open: "08:00", close: "20:00" },
      { day: "Tue", open: "08:00", close: "20:00" },
      { day: "Wed", open: "08:00", close: "20:00" },
      { day: "Thu", open: "08:00", close: "20:00" },
      { day: "Fri", open: "08:00", close: "20:00" },
      { day: "Sat", open: "09:00", close: "18:00" },
      { day: "Sun", open: "12:00", close: "16:00" },
    ],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/techhubafrica" },
      { type: "twitter", url: "https://twitter.com/techhubafrica" },
      { type: "whatsapp", url: "https://wa.me/2348055550199" },
    ],
  },
  {
    id: "store-glow",
    name: "Glow Beauty Bar",
    slug: "glow-beauty-bar",
    description: "Natural skincare, hair care and beauty products made with African botanicals.",
    logoUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=1600&q=80",
    rating: 4.9,
    reviewCount: 1567,
    productCount: 64,
    location: "Port Harcourt, Nigeria",
    isVerified: true,
    createdAt: "2024-05-02T10:00:00.000Z",
    responseTimeHours: 3,
    fulfillmentHours: 8,
    responseRatePct: 96,
    returnPolicyDays: 30,
    totalSales: 6210,
    contactEmail: "care@glowbeautybar.ng",
    phone: "+234 807 555 0111",
    badges: ["Eco-Friendly", "Cruelty-Free", "Top Rated"],
    storeHours: [
      { day: "Mon", open: "10:00", close: "19:00" },
      { day: "Tue", open: "10:00", close: "19:00" },
      { day: "Wed", open: "10:00", close: "19:00" },
      { day: "Thu", open: "10:00", close: "19:00" },
      { day: "Fri", open: "10:00", close: "19:00" },
      { day: "Sat", open: "11:00", close: "17:00" },
      { day: "Sun", open: "00:00", close: "00:00", closed: true },
    ],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/glowbeautybar" },
      { type: "tiktok", url: "https://tiktok.com/@glowbeautybar" },
      { type: "facebook", url: "https://facebook.com/glowbeautybar" },
    ],
  },
  {
    id: "store-homevibe",
    name: "HomeVibe Decor",
    slug: "homevibe-decor",
    description: "Handcrafted home decor, storage and wellness essentials for modern African homes.",
    logoUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=1600&q=80",
    rating: 4.6,
    reviewCount: 642,
    productCount: 98,
    location: "Ibadan, Nigeria",
    isVerified: true,
    createdAt: "2024-02-15T10:00:00.000Z",
    responseTimeHours: 5,
    fulfillmentHours: 12,
    responseRatePct: 92,
    returnPolicyDays: 21,
    totalSales: 3180,
    contactEmail: "orders@homevibedecor.com",
    phone: "+234 809 555 0177",
    badges: ["Handcrafted", "Sustainable"],
    storeHours: [
      { day: "Mon", open: "09:00", close: "17:00" },
      { day: "Tue", open: "09:00", close: "17:00" },
      { day: "Wed", open: "09:00", close: "17:00" },
      { day: "Thu", open: "09:00", close: "17:00" },
      { day: "Fri", open: "09:00", close: "17:00" },
      { day: "Sat", open: "10:00", close: "15:00" },
      { day: "Sun", open: "00:00", close: "00:00", closed: true },
    ],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/homevibedecor" },
      { type: "facebook", url: "https://facebook.com/homevibedecor" },
    ],
  },
  {
    id: "store-freshmart",
    name: "FreshMart Express",
    slug: "freshmart-express",
    description: "Fresh groceries, food stuff and beverages delivered within hours.",
    logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
    rating: 4.5,
    reviewCount: 980,
    productCount: 210,
    location: "Lagos, Nigeria",
    isVerified: true,
    createdAt: "2024-06-10T10:00:00.000Z",
    responseTimeHours: 1,
    fulfillmentHours: 2,
    responseRatePct: 99,
    returnPolicyDays: 1,
    totalSales: 21450,
    contactEmail: "fresh@freshmart.ng",
    phone: "+234 803 555 0100",
    badges: ["Same-Day Delivery", "Fresh Guarantee"],
    storeHours: [
      { day: "Mon", open: "07:00", close: "21:00" },
      { day: "Tue", open: "07:00", close: "21:00" },
      { day: "Wed", open: "07:00", close: "21:00" },
      { day: "Thu", open: "07:00", close: "21:00" },
      { day: "Fri", open: "07:00", close: "21:00" },
      { day: "Sat", open: "07:00", close: "21:00" },
      { day: "Sun", open: "08:00", close: "18:00" },
    ],
    socialLinks: [
      { type: "whatsapp", url: "https://wa.me/2348035550100" },
      { type: "instagram", url: "https://instagram.com/freshmartng" },
    ],
  },
  {
    id: "store-autoparts",
    name: "AutoParts NG",
    slug: "autoparts-ng",
    description: "Quality automobile parts and accessories for all vehicle brands.",
    logoUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
    rating: 4.4,
    reviewCount: 410,
    productCount: 175,
    location: "Kano, Nigeria",
    isVerified: true,
    createdAt: "2024-04-08T10:00:00.000Z",
    responseTimeHours: 6,
    fulfillmentHours: 24,
    responseRatePct: 88,
    returnPolicyDays: 7,
    totalSales: 1980,
    contactEmail: "parts@autoparts.ng",
    phone: "+234 806 555 0188",
    badges: ["Mechanic Approved"],
    storeHours: [
      { day: "Mon", open: "08:00", close: "18:00" },
      { day: "Tue", open: "08:00", close: "18:00" },
      { day: "Wed", open: "08:00", close: "18:00" },
      { day: "Thu", open: "08:00", close: "18:00" },
      { day: "Fri", open: "08:00", close: "18:00" },
      { day: "Sat", open: "09:00", close: "17:00" },
      { day: "Sun", open: "00:00", close: "00:00", closed: true },
    ],
    socialLinks: [
      { type: "whatsapp", url: "https://wa.me/2348065550188" },
      { type: "facebook", url: "https://facebook.com/autopartsng" },
    ],
  },
];

// ─── Categories ────────────────────────────────────────────────────────────

export const categories: DummyCategory[] = [
  { id: "cat-fashion", name: "Fashion & Apparel", slug: "fashion", imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80", icon: "Shirt", isActive: true, position: 1, _count: { products: 8 } },
  { id: "cat-electronics", name: "Electronics", slug: "electronics", imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80", icon: "Smartphone", isActive: true, position: 2, _count: { products: 7 } },
  { id: "cat-beauty", name: "Beauty & Health", slug: "beauty", imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=600&q=80", icon: "Sparkles", isActive: true, position: 3, _count: { products: 5 } },
  { id: "cat-home", name: "Home & Living", slug: "home-living", imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80", icon: "Home", isActive: true, position: 4, _count: { products: 5 } },
  { id: "cat-food", name: "Food & Drinks", slug: "food-drinks", imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80", icon: "ShoppingCart", isActive: true, position: 5, _count: { products: 4 } },
  { id: "cat-phones", name: "Phones & Tablets", slug: "phones-tablets", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80", icon: "Smartphone", isActive: true, position: 6, _count: { products: 4 } },
  { id: "cat-auto", name: "Automobile", slug: "automobile", imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80", icon: "Car", isActive: true, position: 7, _count: { products: 3 } },
  { id: "cat-baby", name: "Baby & Kids", slug: "baby-kids", imageUrl: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80", icon: "Baby", isActive: true, position: 8, _count: { products: 3 } },
];

// ─── Brands ────────────────────────────────────────────────────────────────

export const brands: DummyBrand[] = [
  {
    id: "brand-ankara",
    name: "Ankara Originals",
    slug: "ankara-originals",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=200&q=80",
    status: true,
    _count: { products: 6 },
    story:
      "Born in the heart of Lagos, Ankara Originals celebrates the rich heritage of African print fashion. Every piece is designed by local artisans and tailored to bridge contemporary silhouettes with traditional West African textiles. We work directly with cooperative weavers across Nigeria and Ghana to bring you authentic, ethically-made garments.",
    tagline: "Authentic African print fashion, ethically made.",
    foundedYear: 2018,
    country: "Nigeria",
    headquarters: "Lagos, Nigeria",
    website: "https://ankara-originals.example.com",
    rating: 4.7,
    reviewCount: 1059,
    totalSales: 4820,
    followCount: 12400,
    verified: true,
    badges: ["Top Seller", "Ethically Sourced", "African Owned"],
    categories: ["Fashion", "Accessories", "Women's Wear"],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/ankara.originals" },
      { type: "twitter", url: "https://twitter.com/ankara_originals" },
      { type: "facebook", url: "https://facebook.com/ankaraoriginals" },
      { type: "tiktok", url: "https://tiktok.com/@ankara.originals" },
    ],
    coverImage:
      "https://images.unsplash.com/photo-1571908599407-cdb918ed83bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "brand-techpro",
    name: "TechPro",
    slug: "techpro",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=200&q=80",
    status: true,
    _count: { products: 7 },
    story:
      "TechPro engineers premium consumer electronics with a focus on durability, performance, and value. From wireless audio to smart wearables, every product is field-tested across 12 Nigerian cities before launch. Our warranty covers 24 months and our after-sales support runs 7 days a week.",
    tagline: "Premium tech, field-tested for Africa.",
    foundedYear: 2016,
    country: "Nigeria",
    headquarters: "Abuja, Nigeria",
    website: "https://techpro.example.com",
    rating: 4.6,
    reviewCount: 2841,
    totalSales: 18920,
    followCount: 33100,
    verified: true,
    badges: ["Top Seller", "24-Month Warranty", "Fast Responder"],
    categories: ["Electronics", "Phones & Tablets", "Accessories"],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/techpro" },
      { type: "twitter", url: "https://twitter.com/techpro" },
      { type: "youtube", url: "https://youtube.com/@techpro" },
    ],
    coverImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "brand-glow",
    name: "Glow Naturals",
    slug: "glow-naturals",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80",
    status: true,
    _count: { products: 5 },
    story:
      "Glow Naturals formulates clean, plant-based skincare and cosmetics using botanicals sourced from across the continent — shea from Ghana, marula from Namibia, and hibiscus from Nigeria. Every formula is cruelty-free, vegan, and packaged in recyclable materials. We never use parabens, sulfates, or synthetic dyes.",
    tagline: "Clean beauty, rooted in nature.",
    foundedYear: 2020,
    country: "Nigeria",
    headquarters: "Port Harcourt, Nigeria",
    website: "https://glownaturals.example.com",
    rating: 4.8,
    reviewCount: 1320,
    totalSales: 6210,
    followCount: 18900,
    verified: true,
    badges: ["Eco-Friendly", "Cruelty-Free", "Vegan"],
    categories: ["Beauty", "Skincare", "Cosmetics"],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/glownaturals" },
      { type: "tiktok", url: "https://tiktok.com/@glownaturals" },
      { type: "facebook", url: "https://facebook.com/glownaturals" },
    ],
    coverImage:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "brand-homevibe",
    name: "HomeVibe",
    slug: "homevibe",
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=200&q=80",
    status: true,
    _count: { products: 5 },
    story:
      "HomeVibe crafts sustainable home decor and furniture that brings warmth to any space. Our pieces are handcrafted by artisans in Ibadan using locally-sourced wood, rattan, and natural fibers. Each item is made-to-order and supports fair-wage employment in our workshop.",
    tagline: "Handcrafted home goods, made with care.",
    foundedYear: 2019,
    country: "Nigeria",
    headquarters: "Ibadan, Nigeria",
    website: "https://homevibe.example.com",
    rating: 4.5,
    reviewCount: 642,
    totalSales: 3180,
    followCount: 8700,
    verified: true,
    badges: ["Handcrafted", "Sustainable", "Fair Trade"],
    categories: ["Home & Living", "Furniture", "Decor"],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/homevibe" },
      { type: "pinterest", url: "https://pinterest.com/homevibe" },
    ],
    coverImage:
      "https://images.unsplash.com/photo-1513519245088-0e12902e3556?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "brand-fresh",
    name: "FreshMart",
    slug: "freshmart",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
    status: true,
    _count: { products: 4 },
    story:
      "FreshMart delivers farm-fresh groceries and household essentials with same-day delivery across major Nigerian cities. We partner directly with local farms and producers to cut out middlemen — meaning fresher produce for you and fairer prices for farmers.",
    tagline: "Farm-fresh groceries, delivered today.",
    foundedYear: 2021,
    country: "Nigeria",
    headquarters: "Lagos, Nigeria",
    website: "https://freshmart.example.com",
    rating: 4.4,
    reviewCount: 3210,
    totalSales: 21450,
    followCount: 27600,
    verified: true,
    badges: ["Same-Day Delivery", "Fresh Guarantee", "Local Farms"],
    categories: ["Groceries", "Food & Beverage", "Household"],
    socialLinks: [
      { type: "instagram", url: "https://instagram.com/freshmart" },
      { type: "facebook", url: "https://facebook.com/freshmart" },
      { type: "whatsapp", url: "https://wa.me/2348000000000" },
    ],
    coverImage:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
];

// ─── Products ──────────────────────────────────────────────────────────────

type ProductSeed = {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image: string;
  storeId: string;
  categoryId: string;
  brandId: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  stock: number;
  isFeatured?: boolean;
  tag?: string;
  description?: string;
};

const mkImg = (url: string, alt: string, isMain: boolean, position: number) => ({
  id: `img-${position}-${url.slice(-6)}`,
  url,
  alt,
  isMain,
  position,
});

function makeProduct(s: ProductSeed): DummyProduct {
  const store = stores.find((x) => x.id === s.storeId)!;
  const category = categories.find((x) => x.id === s.categoryId)!;
  const brand = brands.find((x) => x.id === s.brandId)!;
  const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const tags = s.tag
    ? [{ productId: s.id, tagId: `tag-${s.tag.toLowerCase()}`, tag: { id: `tag-${s.tag.toLowerCase()}`, name: s.tag } }]
    : [];
  return {
    id: s.id,
    name: s.name,
    slug,
    description:
      s.description ??
      `${s.name} — a premium ${category.name.toLowerCase()} product from ${store.name}. Quality you can trust, delivered fast across Africa.`,
    price: s.price,
    comparePrice: s.comparePrice,
    sku: `SKU-${s.id.toUpperCase()}`,
    stock: s.stock,
    status: "ACTIVE",
    isFeatured: s.isFeatured ?? false,
    rating: s.rating,
    reviewCount: s.reviewCount,
    totalSales: s.totalSales,
    categoryId: s.categoryId,
    brandId: s.brandId,
    storeId: s.storeId,
    store: { id: store.id, name: store.name, slug: store.slug, logoUrl: store.logoUrl, location: store.location },
    category: { id: category.id, name: category.name, slug: category.slug },
    brand: { id: brand.id, name: brand.name, slug: brand.slug, image: brand.image },
    images: [
      mkImg(s.image, s.name, true, 0),
      mkImg(s.image.replace("w=600", "w=900"), `${s.name} alt view`, false, 1),
    ],
    variants: [
      { id: `var-${s.id}-1`, name: "Default", options: "{}", price: s.price, stock: s.stock },
    ],
    tags,
    createdAt: "2025-06-01T10:00:00.000Z",
    updatedAt: "2025-07-15T10:00:00.000Z",
  };
}

const productSeeds: ProductSeed[] = [
  // ── Fashion ──
  { id: "p-1", name: "Ankara Print Maxi Dress", price: 18500, comparePrice: 24000, image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80", storeId: "store-zara", categoryId: "cat-fashion", brandId: "brand-ankara", rating: 4.8, reviewCount: 214, totalSales: 1840, stock: 32, isFeatured: true, tag: "Bestseller" },
  { id: "p-2", name: "African Print Sneakers", price: 22000, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80", storeId: "store-zara", categoryId: "cat-fashion", brandId: "brand-ankara", rating: 4.6, reviewCount: 187, totalSales: 920, stock: 18, tag: "New" },
  { id: "p-3", name: "Designer Sunglasses", price: 16500, comparePrice: 22000, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80", storeId: "store-zara", categoryId: "cat-fashion", brandId: "brand-ankara", rating: 4.4, reviewCount: 156, totalSales: 640, stock: 45 },
  { id: "p-4", name: "Linen Summer Shirt", price: 9800, comparePrice: 14000, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80", storeId: "store-glow", categoryId: "cat-fashion", brandId: "brand-ankara", rating: 4.5, reviewCount: 98, totalSales: 410, stock: 7 },
  { id: "p-5", name: "Handwoven Straw Hat", price: 6500, image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-fashion", brandId: "brand-homevibe", rating: 4.3, reviewCount: 64, totalSales: 230, stock: 60 },
  { id: "p-6", name: "Beaded Statement Necklace", price: 7500, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80", storeId: "store-zara", categoryId: "cat-fashion", brandId: "brand-ankara", rating: 4.7, reviewCount: 112, totalSales: 380, stock: 25, tag: "Trending" },
  { id: "p-7", name: "Leather Crossbody Bag", price: 24500, comparePrice: 32000, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80", storeId: "store-zara", categoryId: "cat-fashion", brandId: "brand-ankara", rating: 4.9, reviewCount: 203, totalSales: 540, stock: 14, isFeatured: true },
  { id: "p-8", name: "Kente Print Headwrap", price: 4500, image: "https://images.unsplash.com/photo-1582142306909-195724d33ffc?auto=format&fit=crop&w=600&q=80", storeId: "store-zara", categoryId: "cat-fashion", brandId: "brand-ankara", rating: 4.6, reviewCount: 89, totalSales: 290, stock: 50 },

  // ── Electronics ──
  { id: "p-9", name: "Wireless Bluetooth Earbuds Pro", price: 32000, comparePrice: 45000, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-electronics", brandId: "brand-techpro", rating: 4.6, reviewCount: 540, totalSales: 3120, stock: 25, isFeatured: true, tag: "Hot" },
  { id: "p-10", name: "Smart Fitness Watch", price: 28500, comparePrice: 38000, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-electronics", brandId: "brand-techpro", rating: 4.5, reviewCount: 420, totalSales: 2100, stock: 40, tag: "Trending" },
  { id: "p-11", name: "Mechanical Keyboard RGB", price: 34000, comparePrice: 42000, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-electronics", brandId: "brand-techpro", rating: 4.8, reviewCount: 389, totalSales: 1450, stock: 12 },
  { id: "p-12", name: "Bluetooth Speaker", price: 11500, comparePrice: 21000, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-electronics", brandId: "brand-techpro", rating: 4.4, reviewCount: 210, totalSales: 880, stock: 33 },
  { id: "p-13", name: "Power Bank 20000mAh", price: 14500, comparePrice: 26000, image: "https://images.unsplash.com/photo-1609592424823-2a0d2d1e8a8a?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-electronics", brandId: "brand-techpro", rating: 4.7, reviewCount: 612, totalSales: 4200, stock: 5, isFeatured: true, tag: "Bestseller" },
  { id: "p-14", name: "Wireless Mouse", price: 6500, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-electronics", brandId: "brand-techpro", rating: 4.3, reviewCount: 156, totalSales: 670, stock: 80 },
  { id: "p-15", name: "USB-C Hub 7-in-1", price: 18500, comparePrice: 24000, image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-electronics", brandId: "brand-techpro", rating: 4.5, reviewCount: 234, totalSales: 980, stock: 28 },

  // ── Phones & Tablets ──
  { id: "p-16", name: "Smartphone Pro Max 256GB", price: 285000, comparePrice: 340000, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-phones", brandId: "brand-techpro", rating: 4.7, reviewCount: 890, totalSales: 1200, stock: 20, isFeatured: true, tag: "Hot" },
  { id: "p-17", name: "Tablet 10-inch WiFi", price: 145000, comparePrice: 180000, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-phones", brandId: "brand-techpro", rating: 4.5, reviewCount: 432, totalSales: 540, stock: 15 },
  { id: "p-18", name: "Phone Case Premium", price: 4500, image: "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-phones", brandId: "brand-techpro", rating: 4.4, reviewCount: 198, totalSales: 1500, stock: 120 },
  { id: "p-19", name: "Fast Charger 30W", price: 8500, comparePrice: 12000, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80", storeId: "store-techhub", categoryId: "cat-phones", brandId: "brand-techpro", rating: 4.6, reviewCount: 367, totalSales: 2100, stock: 60, tag: "Bestseller" },

  // ── Beauty ──
  { id: "p-20", name: "Shea Butter Glow Set", price: 12500, image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=600&q=80", storeId: "store-glow", categoryId: "cat-beauty", brandId: "brand-glow", rating: 4.9, reviewCount: 312, totalSales: 1670, stock: 48, isFeatured: true, tag: "Natural" },
  { id: "p-21", name: "Skincare Bundle", price: 9800, comparePrice: 17500, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80", storeId: "store-glow", categoryId: "cat-beauty", brandId: "brand-glow", rating: 4.6, reviewCount: 245, totalSales: 980, stock: 22 },
  { id: "p-22", name: "Natural Hair Care Kit", price: 15500, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80", storeId: "store-glow", categoryId: "cat-beauty", brandId: "brand-glow", rating: 4.5, reviewCount: 178, totalSales: 540, stock: 30, tag: "New" },
  { id: "p-23", name: "Black Soap Bar", price: 2500, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=600&q=80", storeId: "store-glow", categoryId: "cat-beauty", brandId: "brand-glow", rating: 4.7, reviewCount: 410, totalSales: 3200, stock: 200 },
  { id: "p-24", name: "Lip Gloss Set", price: 5500, comparePrice: 8000, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80", storeId: "store-glow", categoryId: "cat-beauty", brandId: "brand-glow", rating: 4.4, reviewCount: 132, totalSales: 430, stock: 75 },

  // ── Home & Living ──
  { id: "p-25", name: "Handwoven Storage Basket", price: 8900, comparePrice: 12000, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-home", brandId: "brand-homevibe", rating: 4.7, reviewCount: 98, totalSales: 320, stock: 28 },
  { id: "p-26", name: "Yoga Mat Premium", price: 9500, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-home", brandId: "brand-homevibe", rating: 4.7, reviewCount: 203, totalSales: 760, stock: 41, isFeatured: true },
  { id: "p-27", name: "Aromatic Scented Candles", price: 6500, image: "https://images.unsplash.com/photo-1602874801006-e26c4b6c4f52?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-home", brandId: "brand-homevibe", rating: 4.6, reviewCount: 156, totalSales: 540, stock: 65, tag: "Trending" },
  { id: "p-28", name: "Ceramic Plant Pots Set", price: 12500, comparePrice: 16000, image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-home", brandId: "brand-homevibe", rating: 4.5, reviewCount: 87, totalSales: 210, stock: 34 },
  { id: "p-29", name: "Throw Blanket Soft", price: 11500, image: "https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-home", brandId: "brand-homevibe", rating: 4.8, reviewCount: 142, totalSales: 380, stock: 22 },

  // ── Food & Drinks ──
  { id: "p-30", name: "Premium Honey 500g", price: 6500, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80", storeId: "store-freshmart", categoryId: "cat-food", brandId: "brand-fresh", rating: 4.8, reviewCount: 234, totalSales: 1800, stock: 90, isFeatured: true, tag: "Natural" },
  { id: "p-31", name: "Coffee Beans 1kg", price: 8500, comparePrice: 11000, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80", storeId: "store-freshmart", categoryId: "cat-food", brandId: "brand-fresh", rating: 4.6, reviewCount: 178, totalSales: 920, stock: 45 },
  { id: "p-32", name: "Mixed Nuts Pack", price: 7500, image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80", storeId: "store-freshmart", categoryId: "cat-food", brandId: "brand-fresh", rating: 4.5, reviewCount: 132, totalSales: 670, stock: 55 },
  { id: "p-33", name: "Organic Green Tea", price: 4500, comparePrice: 6000, image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=600&q=80", storeId: "store-freshmart", categoryId: "cat-food", brandId: "brand-fresh", rating: 4.4, reviewCount: 98, totalSales: 430, stock: 70 },

  // ── Automobile ──
  { id: "p-34", name: "Car Floor Mats Set", price: 18500, comparePrice: 25000, image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80", storeId: "store-autoparts", categoryId: "cat-auto", brandId: "brand-techpro", rating: 4.5, reviewCount: 156, totalSales: 320, stock: 30 },
  { id: "p-35", name: "LED Headlight Bulbs", price: 12500, image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80", storeId: "store-autoparts", categoryId: "cat-auto", brandId: "brand-techpro", rating: 4.6, reviewCount: 203, totalSales: 540, stock: 48, tag: "Hot" },
  { id: "p-36", name: "Phone Car Mount", price: 5500, comparePrice: 8000, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80", storeId: "store-autoparts", categoryId: "cat-auto", brandId: "brand-techpro", rating: 4.3, reviewCount: 178, totalSales: 890, stock: 100 },

  // ── Baby & Kids ──
  { id: "p-37", name: "Soft Plush Toy Bear", price: 7500, image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-baby", brandId: "brand-homevibe", rating: 4.7, reviewCount: 145, totalSales: 430, stock: 60, tag: "New" },
  { id: "p-38", name: "Kids Educational Puzzle", price: 6500, comparePrice: 9000, image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80", storeId: "store-homevibe", categoryId: "cat-baby", brandId: "brand-homevibe", rating: 4.6, reviewCount: 98, totalSales: 280, stock: 45 },
  { id: "p-39", name: "Baby Onesie Set", price: 9500, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80", storeId: "store-zara", categoryId: "cat-baby", brandId: "brand-ankara", rating: 4.8, reviewCount: 167, totalSales: 510, stock: 38 },
];

export const products: DummyProduct[] = productSeeds.map(makeProduct);

// ─── Banners ───────────────────────────────────────────────────────────────

export const banners: DummyBanner[] = [
  { id: "b1", title: "Shop Africa, Delivered Everywhere", subTitle: "Millions of products from verified vendors across 15+ countries.", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80", url: "/products", bannerType: "hero", buttonText: "Shop Now", position: 1, isActive: true },
  { id: "b2", title: "KwisCrow Protected Payments", subTitle: "Your money stays in escrow until you confirm delivery. Always.", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80", url: "/about", bannerType: "hero", buttonText: "Learn More", position: 2, isActive: true },
  { id: "b3", title: "Become a Vendor — Sell in Minutes", subTitle: "Open your store, quote orders, and get paid on delivery.", image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80", url: "/vendor", bannerType: "hero", buttonText: "Start Selling", position: 3, isActive: true },
  { id: "b4", title: "Flash Deals — Up to 50% Off", subTitle: "Limited time offers on top electronics and fashion.", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80", url: "/products", bannerType: "promo", buttonText: "Grab Deals", position: 4, isActive: true },
];

// ─── Deals ─────────────────────────────────────────────────────────────────

const dealProductIds = ["p-1", "p-9", "p-13", "p-16", "p-20", "p-26"];
export const deals: DummyDeal[] = [
  {
    id: "deal-flash",
    title: "Flash Deals",
    description: "Up to 50% off — ends soon!",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    dealType: "FLASH",
    discountType: "PERCENTAGE",
    discountValue: 50,
    startDate: "2025-07-01T00:00:00.000Z",
    endDate: "2025-12-31T23:59:59.000Z",
    isActive: true,
    products: dealProductIds.map((pid) => {
      const p = products.find((x) => x.id === pid)!;
      return { id: `dp-${pid}`, dealPrice: Math.round(p.price * 0.75), product: p };
    }),
  },
  {
    id: "deal-featured",
    title: "Featured Deals",
    description: "Handpicked offers on bestsellers.",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    dealType: "FEATURED",
    discountType: "PERCENTAGE",
    discountValue: 25,
    startDate: "2025-07-01T00:00:00.000Z",
    endDate: "2025-12-31T23:59:59.000Z",
    isActive: true,
    products: products.filter((p) => p.isFeatured).slice(0, 6).map((p) => ({
      id: `dp-${p.id}`,
      dealPrice: Math.round(p.price * 0.85),
      product: p,
    })),
  },
  {
    id: "deal-of-the-day",
    title: "Deal of the Day",
    description: "Daily handpicked discounts on best-selling accessories.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    dealType: "DEAL_OF_THE_DAY",
    discountType: "PERCENTAGE",
    discountValue: 30,
    startDate: "2025-07-01T00:00:00.000Z",
    endDate: "2025-12-31T23:59:59.000Z",
    isActive: true,
    products: products.filter((p) => p.comparePrice && p.comparePrice > p.price).slice(0, 6).map((p) => ({
      id: `dp-${p.id}`,
      dealPrice: Math.round(p.price * 0.7),
      product: p,
    })),
  },
];

// ─── Sellers (top) ────────────────────────────────────────────────────────

export const sellers = stores.map((s) => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  tagline: s.description,
  image: s.bannerUrl,
  logo: s.logoUrl,
  location: s.location,
  rating: s.rating,
  productCount: String(s.productCount),
  isVerified: s.isVerified,
}));

// ─── Reviews ───────────────────────────────────────────────────────────────

const REVIEW_NAMES = [
  "Amara O.", "Tunde A.", "Chidi N.", "Funke B.", "Emeka I.",
  "Ngozi E.", "Seyi A.", "Halima M.", "David O.", "Bisi T.",
  "Ibrahim S.", "Grace E.", "Yusuf A.", "Chioma N.", "Femi K.",
];
const REVIEW_LOCATIONS = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin", "Warri"];
const REVIEW_TEMPLATES = [
  { r: 5, t: "Excellent quality, exactly as described. Fast delivery too!" },
  { r: 5, t: "Love this! Will definitely order again. Highly recommend." },
  { r: 5, t: "Exceeded my expectations. The vendor was very responsive." },
  { r: 4, t: "Good product for the price. Delivery took a bit longer but worth it." },
  { r: 4, t: "Solid quality. Would recommend to friends." },
  { r: 5, t: "Perfect! Just what I needed. KwisCrow escrow made me feel safe." },
  { r: 4, t: "Nice item. Packaging could be better but product is great." },
  { r: 5, t: "Best purchase this year. Quality is top-notch." },
  { r: 3, t: "Decent product. Works as described but nothing special." },
  { r: 5, t: "Authentic and well-made. Vendor delivered as promised." },
];

// Review titles make the section feel real and scannable.
const REVIEW_TITLES = [
  "Great buy!", "Highly recommend", "Worth every naira", "Exceeded expectations",
  "Will buy again", "Top quality", "As described", "Fast delivery",
  "Solid purchase", "Five stars!",
];

// Deterministic subset of reviews get a verified-purchase badge.
const REVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=70",
];

// Vendor reply templates — used when a vendor responds to a review.
// (deterministic — same review id always gets the same reply body)
const VENDOR_REPLY_TEMPLATES = [
  "Thank you so much for your kind words! We're thrilled you love it. ❤️",
  "Thanks for the feedback! We're glad the product met your expectations.",
  "We really appreciate your review. Let us know if you need anything else!",
  "Thank you for choosing us! Your support means everything to our small business.",
  "So happy to hear this! We hope to serve you again soon. 🙏",
  "Thanks for taking the time to review. We've shared your feedback with our team!",
];

const VENDOR_REPLY_NAMES = [
  "Zara's Collection",
  "TechHub",
  "Glow Beauty",
  "HomeVibe",
  "FreshMart",
];

// Vendor replies appear a few hours/days after the review itself.
function buildVendorReply(reviewId: string, reviewCreatedAt: string, storeName?: string) {
  // Deterministic: every 3rd review (by char code sum) gets a vendor reply.
  const sum = reviewId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (sum % 3 !== 0) return undefined;
  const tplIdx = sum % VENDOR_REPLY_TEMPLATES.length;
  const nameIdx = sum % VENDOR_REPLY_NAMES.length;
  // Reply comes 1-4 days after the review.
  const replyOffsetMs = (1 + (sum % 4)) * 86400000;
  const replyAt = new Date(new Date(reviewCreatedAt).getTime() + replyOffsetMs).toISOString();
  // Don't reply in the future.
  if (new Date(replyAt).getTime() > Date.now()) return undefined;
  return {
    id: `vr-${reviewId}`,
    authorName: storeName ?? VENDOR_REPLY_NAMES[nameIdx],
    text: VENDOR_REPLY_TEMPLATES[tplIdx],
    createdAt: replyAt,
  };
}

// Generate 2-4 reviews per featured/popular product so the product detail
// page and reviews sections are rich.
type DummyReview = {
  id: string;
  productId: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  createdAt: string;
  title: string;
  verified: boolean;
  helpful: number;
  images: string[];
  vendorReply?: {
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  };
};
function buildReviews(): DummyReview[] {
  const out: DummyReview[] = [];
  // Always keep the original 5 hand-written reviews.
  out.push(
    {
      id: "r1", productId: "p-1", name: "Amara O.", location: "Lagos", rating: 5,
      text: "Beautiful dress, perfect fit and fast delivery!", createdAt: "2025-07-10T10:00:00.000Z",
      title: "Perfect fit!", verified: true, helpful: 18,
      images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=70"],
    },
    {
      id: "r2", productId: "p-1", name: "Tunde A.", location: "Abuja", rating: 4,
      text: "Good quality fabric. Will buy again.", createdAt: "2025-07-08T10:00:00.000Z",
      title: "Good quality fabric", verified: true, helpful: 7, images: [],
    },
    {
      id: "r3", productId: "p-9", name: "Chidi N.", location: "Port Harcourt", rating: 5,
      text: "Best earbuds I've owned. Sound quality is amazing.", createdAt: "2025-07-12T10:00:00.000Z",
      title: "Best earbuds I've owned", verified: true, helpful: 24,
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70"],
    },
    {
      id: "r4", productId: "p-20", name: "Funke B.", location: "Ibadan", rating: 5,
      text: "My skin has never looked better. Highly recommend.", createdAt: "2025-07-11T10:00:00.000Z",
      title: "My skin has never looked better", verified: true, helpful: 12, images: [],
    },
    {
      id: "r5", productId: "p-13", name: "Emeka I.", location: "Kano", rating: 5,
      text: "Charges my phone 3 times. Great value.", createdAt: "2025-07-09T10:00:00.000Z",
      title: "Great value", verified: true, helpful: 9, images: [],
    },
  );
  // Generate reviews for the remaining products (skip those already reviewed).
  const reviewed = new Set(out.map((r) => r.productId));
  let rid = 6;
  for (const p of products) {
    if (reviewed.has(p.id)) continue;
    const count = 2 + (p.totalSales % 3); // 2-4 reviews
    for (let i = 0; i < count; i++) {
      const tpl = REVIEW_TEMPLATES[(p.id.charCodeAt(2) + i) % REVIEW_TEMPLATES.length];
      const name = REVIEW_NAMES[(rid + i) % REVIEW_NAMES.length];
      const loc = REVIEW_LOCATIONS[(rid + i) % REVIEW_LOCATIONS.length];
      const title = REVIEW_TITLES[(rid + i) % REVIEW_TITLES.length];
      const daysAgo = i * 3 + (rid % 5);
      // Deterministic helpful vote count: scales with rating and age.
      const helpful = Math.max(0, (tpl.r * 3) + ((rid * 7 + i * 3) % 11) - i);
      // ~30% of generated reviews get a single photo (deterministic).
      const wantsImage = (rid + i) % 3 === 0;
      const img = wantsImage ? [REVIEW_IMAGES[(rid + i) % REVIEW_IMAGES.length]] : [];
      // ~70% are verified purchases (deterministic).
      const verified = (rid + i) % 10 !== 0;
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      out.push({
        id: `r${rid}`,
        productId: p.id,
        name,
        location: loc,
        rating: tpl.r,
        text: tpl.t,
        createdAt,
        title,
        verified,
        helpful,
        images: img,
        vendorReply: buildVendorReply(`r${rid}`, createdAt, p.store?.name),
      });
      rid++;
    }
    reviewed.add(p.id);
  }
  // Attach vendor replies to the 5 hand-written seeds too.
  for (const r of out) {
    if (!r.vendorReply) {
      const prod = products.find((p) => p.id === r.productId);
      r.vendorReply = buildVendorReply(r.id, r.createdAt, prod?.store?.name);
    }
  }
  return out;
}

const reviewsSeed = buildReviews();
export const reviews = reviewsSeed;

// ─── Delivery rates & banks ────────────────────────────────────────────────

export const deliveryRates = [
  { id: "dr1", state: "Lagos", localGovernment: "Ikeja", baseFee: 1500, perKgFee: 200, estimatedDays: 1 },
  { id: "dr2", state: "Lagos", localGovernment: "Surulere", baseFee: 1500, perKgFee: 200, estimatedDays: 1 },
  { id: "dr3", state: "Abuja", localGovernment: "Municipal", baseFee: 2500, perKgFee: 300, estimatedDays: 2 },
  { id: "dr4", state: "Rivers", localGovernment: "Port Harcourt", baseFee: 3000, perKgFee: 350, estimatedDays: 3 },
  { id: "dr5", state: "Oyo", localGovernment: "Ibadan", baseFee: 2200, perKgFee: 250, estimatedDays: 2 },
  { id: "dr6", state: "Kano", localGovernment: "Municipal", baseFee: 3200, perKgFee: 400, estimatedDays: 3 },
];

export const banks = [
  { id: "bk1", name: "Access Bank", code: "044" },
  { id: "bk2", name: "Guaranty Trust Bank", code: "058" },
  { id: "bk3", name: "Zenith Bank", code: "057" },
  { id: "bk4", name: "First Bank of Nigeria", code: "011" },
  { id: "bk5", name: "United Bank for Africa", code: "033" },
  { id: "bk6", name: "Kuda Bank", code: "090267" },
  { id: "bk7", name: "Opay", code: "000001" },
];

export const paymentMethods = [
  { id: "pm1", name: "Card", code: "CARD", gateway: "PAYSTACK", isActive: true, icon: "credit-card" },
  { id: "pm2", name: "Bank Transfer", code: "BANK_TRANSFER", gateway: "FLUTTERWAVE", isActive: true, icon: "building" },
  { id: "pm3", name: "USSD", code: "USSD", gateway: "FLUTTERWAVE", isActive: true, icon: "phone" },
  { id: "pm4", name: "KwikCoins Wallet", code: "WALLET", gateway: "KWIKCOINS", isActive: true, icon: "wallet" },
  { id: "pm5", name: "Pay on Delivery", code: "POD", gateway: "CASH", isActive: true, icon: "truck" },
];

// ─── Coupon codes ─────────────────────────────────────────────────────────
// The three "legacy" codes (KWIK10, WELCOME15, FLASH50) match the existing
// POST /cart/coupon + checkout validation. The extra codes here are listed
// on the /coupons page for discovery but are validated the same way at
// checkout (the dummy endpoint accepts any code matching the three legacy
// codes — the others are display-only "coming soon" promos).

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "PERCENT" | "AMOUNT" | "FREE_DELIVERY";
  discountValue: number; // percent (1–100) for PERCENT, naira for AMOUNT
  minOrder: number; // minimum subtotal in naira
  maxDiscount?: number; // cap for PERCENT coupons
  category: "WELCOME" | "FLASH" | "FESTIVE" | "VENDOR" | "LOYALTY" | "SEASONAL";
  storeName?: string; // for vendor-specific coupons (display)
  storeId?: string; // for vendor-specific coupons (machine match)
  expiresAt: string;
  isActive: boolean;
  totalRedeemed: number;
  totalBudget: number;
  badgeText?: string; // small seasonal/featured chip text
  accentColor?: "orange" | "amber" | "rose" | "emerald" | "violet";
}

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

export const coupons: Coupon[] = [
  {
    id: "cp-kwik10",
    code: "KWIK10",
    title: "10% off your order",
    description: "Site-wide discount on any order. Stack with delivery deals.",
    discountType: "PERCENT",
    discountValue: 10,
    minOrder: 5000,
    maxDiscount: 5000,
    category: "LOYALTY",
    expiresAt: inDays(30),
    isActive: true,
    totalRedeemed: 1842,
    totalBudget: 5000,
  },
  {
    id: "cp-welcome15",
    code: "WELCOME15",
    title: "15% off first order",
    description: "New to Kwikseller? Get 15% off your first purchase.",
    discountType: "PERCENT",
    discountValue: 15,
    minOrder: 3000,
    maxDiscount: 7500,
    category: "WELCOME",
    expiresAt: inDays(60),
    isActive: true,
    totalRedeemed: 3210,
    totalBudget: 10000,
  },
  {
    id: "cp-flash50",
    code: "FLASH50",
    title: "50% flash sale",
    description: "Limited-time half-price flash deal. Today only.",
    discountType: "PERCENT",
    discountValue: 50,
    minOrder: 10000,
    maxDiscount: 25000,
    category: "FLASH",
    expiresAt: inDays(1),
    isActive: true,
    totalRedeemed: 471,
    totalBudget: 1000,
  },
  {
    id: "cp-festive25",
    code: "FESTIVE25",
    title: "₦5,000 festive cashback",
    description: "Flat ₦5,000 off orders above ₦40,000 this festive season.",
    discountType: "AMOUNT",
    discountValue: 5000,
    minOrder: 40000,
    category: "FESTIVE",
    expiresAt: inDays(21),
    isActive: true,
    totalRedeemed: 312,
    totalBudget: 1000,
  },
  {
    id: "cp-freedelivery",
    code: "FREEDELIVERY",
    title: "Free delivery",
    description: "Waive the delivery fee on your next order, any amount.",
    discountType: "FREE_DELIVERY",
    discountValue: 0,
    minOrder: 0,
    category: "LOYALTY",
    expiresAt: inDays(14),
    isActive: true,
    totalRedeemed: 928,
    totalBudget: 2000,
  },
  {
    id: "cp-ankarastore",
    code: "ANKARA20",
    title: "20% off Ankara styles",
    description: "Vendor-exclusive: 20% off all Ankara Print Maxi Dresses from Zara's Collection.",
    discountType: "PERCENT",
    discountValue: 20,
    minOrder: 8000,
    maxDiscount: 10000,
    category: "VENDOR",
    storeName: "Zara's Collection",
    storeId: "store-zara",
    expiresAt: inDays(10),
    isActive: true,
    totalRedeemed: 156,
    totalBudget: 500,
    badgeText: "Vendor exclusive",
    accentColor: "orange",
  },
  {
    id: "cp-techhub",
    code: "TECH1500",
    title: "₦1,500 off gadgets",
    description: "Vendor-exclusive: flat ₦1,500 off tech orders above ₦25,000 from TechHub Africa.",
    discountType: "AMOUNT",
    discountValue: 1500,
    minOrder: 25000,
    category: "VENDOR",
    storeName: "TechHub Africa",
    storeId: "store-techhub",
    expiresAt: inDays(7),
    isActive: true,
    totalRedeemed: 89,
    totalBudget: 300,
    badgeText: "TechHub only",
    accentColor: "violet",
  },
  {
    id: "cp-glowbeauty",
    code: "GLOWBEAUTY",
    title: "Free delivery on beauty",
    description: "Vendor-exclusive: free delivery on all Glow Beauty Bar orders.",
    discountType: "FREE_DELIVERY",
    discountValue: 0,
    minOrder: 5000,
    category: "VENDOR",
    storeName: "Glow Beauty Bar",
    storeId: "store-glow",
    expiresAt: inDays(12),
    isActive: true,
    totalRedeemed: 67,
    totalBudget: 200,
    badgeText: "Glow Beauty only",
    accentColor: "rose",
  },
  // ─── Seasonal coupons (cycle 5 addition) ────────────────────────────────
  {
    id: "cp-summer30",
    code: "SUMMER30",
    title: "30% off summer picks",
    description: "Seasonal: 30% off fashion, beauty, and home picks this summer. Cap ₦12,000.",
    discountType: "PERCENT",
    discountValue: 30,
    minOrder: 12000,
    maxDiscount: 12000,
    category: "SEASONAL",
    expiresAt: inDays(45),
    isActive: true,
    totalRedeemed: 213,
    totalBudget: 1500,
    badgeText: "Summer sale",
    accentColor: "amber",
  },
  {
    id: "cp-payday2500",
    code: "PAYDAY2500",
    title: "₦2,500 payday bonus",
    description: "Seasonal: flat ₦2,500 off orders above ₦30,000 to celebrate payday. Stack with delivery deals.",
    discountType: "AMOUNT",
    discountValue: 2500,
    minOrder: 30000,
    category: "SEASONAL",
    expiresAt: inDays(14),
    isActive: true,
    totalRedeemed: 48,
    totalBudget: 600,
    badgeText: "Payday treat",
    accentColor: "emerald",
  },
];

// ─── Help center FAQ ──────────────────────────────────────────────────────

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "ORDERS" | "PAYMENTS" | "DELIVERY" | "RETURNS" | "ACCOUNT" | "VENDOR";
}

export const faqItems: FAQItem[] = [
  // Orders
  { id: "faq-1", category: "ORDERS", question: "How do I track my order?", answer: "Go to Orders in your account, tap the order, then tap 'Track order'. You'll see live status updates, the delivery agent's contact info, and a route map once the order ships." },
  { id: "faq-2", category: "ORDERS", question: "Can I cancel or modify my order?", answer: "Yes — but only before the vendor confirms. Once the vendor accepts and quotes delivery, the order is locked in. To cancel, open the order detail page and tap 'Cancel order'." },
  { id: "faq-3", category: "ORDERS", question: "Why was my order split into multiple orders?", answer: "When you buy items from different vendors in one checkout, we split the order so each vendor receives and fulfils their part independently. You'll see one order per vendor in your Orders list." },
  { id: "faq-4", category: "ORDERS", question: "How does the vendor quotation flow work?", answer: "After you place an order, the vendor reviews it and sends a quotation with the final delivery fee and any discount. You'll see this on the order detail page within minutes. The order is then confirmed and prepared for dispatch." },

  // Payments
  { id: "faq-5", category: "PAYMENTS", question: "What payment methods are supported?", answer: "We support cards (via Paystack), bank transfer, USSD, KwikCoins wallet, and Pay on Delivery for eligible locations. All card payments are encrypted and PCI-DSS compliant." },
  { id: "faq-6", category: "PAYMENTS", question: "When am I charged for an order?", answer: "For card payments, you're charged immediately at checkout. For Pay on Delivery, you pay the delivery agent in cash or by transfer when the order arrives. KwikCoins are deducted from your wallet balance instantly." },
  { id: "faq-7", category: "PAYMENTS", question: "How do refunds work?", answer: "Refunds are issued to your original payment method within 3–5 business days. For KwikCoins payments, the coins are returned to your wallet instantly. If a vendor cancels your order, the refund is automatic." },
  { id: "faq-8", category: "PAYMENTS", question: "Can I use multiple coupons on one order?", answer: "No — only one coupon can be applied per order. Coupons cannot be stacked with other coupons, but they can be combined with KwikCoins redemption." },

  // Delivery
  { id: "faq-9", category: "DELIVERY", question: "What are the delivery options?", answer: "We offer three options: Standard (2–3 days, ₦1,500–₦2,000), Express (next day, ₦3,500–₦4,500), and Pickup (free, same day at the vendor's location). The final fee is confirmed by the vendor during the quotation step." },
  { id: "faq-10", category: "DELIVERY", question: "Do you deliver nationwide?", answer: "Yes — we deliver to all 36 states in Nigeria. Delivery fees and times vary by location. Lagos, Abuja, Port Harcourt, Ibadan, and Kano have the fastest delivery times." },
  { id: "faq-11", category: "DELIVERY", question: "What if I'm not home when the delivery arrives?", answer: "The delivery agent will call you. You can reschedule for the next day or authorise a neighbour/guard to receive the package on your behalf." },
  { id: "faq-12", category: "DELIVERY", question: "How do I contact my delivery agent?", answer: "Once your order ships, the delivery agent's name, photo, phone number, and vehicle info appear on the tracking page. Tap 'Call' or 'Chat' to reach them directly." },

  // Returns
  { id: "faq-13", category: "RETURNS", question: "What's your return policy?", answer: "You can return most items within 7 days of delivery if they're unused, in original packaging, and with tags intact. Some categories (personal care, food) are non-returnable for hygiene reasons." },
  { id: "faq-14", category: "RETURNS", question: "How do I request a return?", answer: "Open the order in your Orders list, tap 'Return item', select the reason, and submit. The vendor reviews the request within 24 hours. If approved, we arrange pickup and issue a refund once the item is received." },
  { id: "faq-15", category: "RETURNS", question: "Who pays for return shipping?", answer: "If the return is due to a defect or wrong item, we cover the return shipping. If you changed your mind, the return shipping fee is deducted from your refund." },

  // Account
  { id: "faq-16", category: "ACCOUNT", question: "How do KwikCoins work?", answer: "You earn KwikCoins on every order (1–5 coins per ₦1,000 depending on your tier). Coins can be redeemed for cash to your wallet, ad credit (if you're a vendor), or transferred to friends. 1 KwikCoin = ₦10." },
  { id: "faq-17", category: "ACCOUNT", question: "How do I become a Gold or Platinum member?", answer: "Tiers are based on your lifetime KwikCoins balance: Bronze (0+), Silver (1,000+), Gold (2,000+), Platinum (5,000+). Higher tiers earn coins faster and unlock perks like free delivery and exclusive deals." },
  { id: "faq-18", category: "ACCOUNT", question: "Can I have multiple addresses?", answer: "Yes — add as many addresses as you like in Profile → Addresses. Mark one as default for faster checkout. You can also label addresses (Home, Work, etc.) for easy selection." },

  // Vendor
  { id: "faq-19", category: "VENDOR", question: "How do I become a vendor?", answer: "Visit the Vendor Orders page (in your account sidebar) and tap 'Become a vendor'. You'll need a business name, bank account, and at least one product to list. Verification takes 1–2 business days." },
  { id: "faq-20", category: "VENDOR", question: "How and when do I get paid?", answer: "Payouts are sent to your bank account 24 hours after the buyer's order is delivered (the dispute window). You can track earnings and payout history on the Vendor Analytics page." },
  { id: "faq-21", category: "VENDOR", question: "What's the vendor commission?", answer: "We charge a 5% platform fee on each order subtotal. This covers payment processing, escrow protection, and access to the marketplace. There are no listing or monthly fees." },
];

// ─── Support tickets (in-memory store) ─────────────────────────────────────

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  orderId?: string;
  email?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

export const supportTickets: SupportTicket[] = [];
