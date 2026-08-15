/**
 * reseed-products.ts
 *
 * Run AFTER your full seed.ts has run at least once (needs existing states,
 * categories, brands, vendors/stores, customers, rider — it looks all of
 * these up, it does not create them).
 *
 * What it does:
 *   1. Looks up existing vendors (by store slug), customers (by email),
 *      categories/brands (by slug), rider (by email).
 *   2. Deletes ONLY product rows and everything that transitively depends
 *      on a product (order items → orders → quotes/payments/escrow/wallet
 *      txns/commissions/deliveries/fulfillments, reviews, cart items →
 *      carts, wishlists, deal products → deals, variants, digital assets,
 *      media, etc). Users, stores, categories, brands, currencies, configs,
 *      states/LGAs are left completely alone.
 *   3. Resets each vendor wallet back to its original opening balance so
 *      re-running doesn't double-count escrow releases from the old data.
 *   4. Recreates all products using the same catalog as seed.ts, but with
 *      real matching images from product-seed.ts (getProductImage /
 *      getProductImageSet) instead of the old hashed category pool.
 *   5. Recreates the same 8 order-lifecycle scenarios, 3 deals, 3 carts,
 *      5 wishlist entries — linked to your EXISTING vendor/customer ids.
 *
 * Run:  cd apps/api && npx ts-node prisma/reseed-products.ts
 *       (or add a package.json script: "reseed:products": "ts-node prisma/reseed-products.ts")
 */

import { PrismaClient, ProductStatus, DealType, DiscountType } from "@prisma/client";
import { getProductImage, getProductImageSet } from "./product-seed";

const prisma = new PrismaClient();
const db = prisma as any;

// ============================================================
// SAFETY: same guard as seed.ts
// ============================================================
function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: reseed-products cannot run in production. Aborting.");
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function makeSku(prefix: string, idx: number): string {
  return `${prefix}-${String(idx).padStart(5, "0")}`;
}
function randSuffix(): string {
  return Math.random().toString(36).substring(2, 7);
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysAhead(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

// ============================================================
// PRODUCT CATALOG — same data as seed.ts, image fields removed
// (images now come from product-seed.ts by product name)
// ============================================================
interface ProductSeed {
  name: string;
  price: number;
  brand: string;
  cat: string;
  stock: number;
  digital?: boolean;
  digitalAsset?: { deliveryType: "DOWNLOAD" | "LICENSE_KEY" | "EXTERNAL_ACCESS"; name: string; fileUrl?: string; accessUrl?: string; licenseKey?: string; maxDownloads?: number; expiresAfterDays?: number };
  variants?: { type: string; values: string[] }[];
}
interface VendorProductSeed {
  storeSlug: string;
  products: ProductSeed[];
}

const VENDOR_PRODUCTS: VendorProductSeed[] = [
  {
    storeSlug: "adetech-electronics",
    products: [
      { name: "Samsung Galaxy A54 5G 128GB", price: 225000, brand: "samsung", cat: "smartphones", stock: 45 },
      { name: "Apple iPhone 15 128GB Blue", price: 780000, brand: "apple", cat: "smartphones", stock: 18, variants: [{ type: "Storage", values: ["128GB", "256GB"] }] },
      { name: "Samsung Galaxy Tab A9+ 11-inch", price: 142000, brand: "samsung", cat: "tablets", stock: 22 },
      { name: "Apple AirPods Pro 2nd Gen", price: 95000, brand: "apple", cat: "phone-accessories", stock: 60 },
      { name: "Anker PowerCore 20000mAh Power Bank", price: 18000, brand: "anker", cat: "phone-accessories", stock: 120 },
      { name: "Samsung 25W Fast Charger", price: 6500, brand: "samsung", cat: "phone-accessories", stock: 200 },
      { name: "Sony WH-1000XM5 Headphones", price: 185000, brand: "sony", cat: "tvs-audio", stock: 15 },
      { name: "Samsung Sound Tower MX-T50", price: 95000, brand: "samsung", cat: "tvs-audio", stock: 8 },
      { name: "Samsung 43-inch Crystal UHD Smart TV", price: 185000, brand: "samsung", cat: "tvs-audio", stock: 12 },
      { name: "Anker Wireless Charging Dock", price: 22000, brand: "anker", cat: "phone-accessories", stock: 4 },
      { name: "Logitech Wireless Mouse M331", price: 8500, brand: "anker", cat: "computer-accessories", stock: 80 },
      { name: "Logitech Mechanical Keyboard", price: 32000, brand: "anker", cat: "computer-accessories", stock: 25 },
      { name: "Canon EOS M50 Mirrorless Camera", price: 320000, brand: "sony", cat: "cameras", stock: 6 },
      { name: "Samsung Galaxy S24 Ultra 256GB", price: 850000, brand: "samsung", cat: "smartphones", stock: 10, variants: [{ type: "Storage", values: ["256GB", "512GB"] }] },
      { name: "Tecno Camon 20 Premier 256GB", price: 235000, brand: "tecno", cat: "smartphones", stock: 30 },
    ],
  },
  {
    storeSlug: "bola-fashion-house",
    products: [
      { name: "Nike Air Max 270 React Sneakers", price: 45000, brand: "nike", cat: "shoes", stock: 35, variants: [{ type: "Size", values: ["40", "41", "42", "43", "44"] }] },
      { name: "Adidas Ultraboost 23 Running Shoes", price: 52000, brand: "adidas", cat: "shoes", stock: 20, variants: [{ type: "Size", values: ["40", "41", "42", "43"] }] },
      { name: "Nike Dri-FIT Men's Training T-Shirt", price: 8500, brand: "nike", cat: "mens-fashion", stock: 100, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Adidas Originals Trefoil Hoodie", price: 18000, brand: "adidas", cat: "mens-fashion", stock: 45, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Women's Ankara Midi Dress", price: 15000, brand: "gucci", cat: "womens-fashion", stock: 30, variants: [{ type: "Size", values: ["S", "M", "L"] }] },
      { name: "Leather Crossbody Bag", price: 28000, brand: "gucci", cat: "bags-accessories", stock: 18 },
      { name: "Women's Block Heel Pumps", price: 22000, brand: "gucci", cat: "shoes", stock: 15, variants: [{ type: "Size", values: ["37", "38", "39", "40"] }] },
      { name: "Men's Casual Denim Jacket", price: 25000, brand: "adidas", cat: "mens-fashion", stock: 28, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Polarized Sunglasses UV400", price: 8500, brand: "gucci", cat: "bags-accessories", stock: 60 },
      { name: "Men's Leather Formal Shoes", price: 35000, brand: "gucci", cat: "shoes", stock: 12, variants: [{ type: "Size", values: ["40", "41", "42", "43", "44"] }] },
      { name: "Women's Silk Evening Gown", price: 42000, brand: "gucci", cat: "womens-fashion", stock: 8 },
      { name: "Nike Sportswear Hoodie", price: 21000, brand: "nike", cat: "mens-fashion", stock: 3, variants: [{ type: "Size", values: ["M", "L", "XL"] }] },
      { name: "Designer Tote Bag", price: 38000, brand: "gucci", cat: "bags-accessories", stock: 10 },
    ],
  },
  {
    storeSlug: "naija-home-essentials",
    products: [
      { name: "Binatone 1.7L Electric Kettle", price: 8500, brand: "binatone", cat: "appliances", stock: 80 },
      { name: "Oraimo SmartChef 5L Air Fryer", price: 25000, brand: "oraimo", cat: "appliances", stock: 35 },
      { name: "Binatone Blender 1.5L BLG-450", price: 12000, brand: "binatone", cat: "appliances", stock: 45 },
      { name: "Nexus 4-Burner Gas Cooker with Oven", price: 85000, brand: "binatone", cat: "appliances", stock: 12 },
      { name: "Samsung 320L Bottom Mount Refrigerator", price: 210000, brand: "samsung", cat: "appliances", stock: 8 },
      { name: "Samsung Microwave 20L Solo", price: 42000, brand: "samsung", cat: "appliances", stock: 20 },
      { name: "Samsung Robot Vacuum Cleaner", price: 180000, brand: "samsung", cat: "appliances", stock: 6 },
      { name: "Non-Stick Cookware Set 10pc", price: 35000, brand: "binatone", cat: "cookware", stock: 25 },
      { name: "Stainless Steel Dinner Set 16pc", price: 15000, brand: "binatone", cat: "cookware", stock: 40 },
      { name: "Electric Coffee Maker 12-Cup", price: 28000, brand: "binatone", cat: "appliances", stock: 15 },
      { name: "Oraimo Air Fryer 6L Family Size", price: 32000, brand: "oraimo", cat: "appliances", stock: 5 },
      { name: "Wooden Dining Table Set 6-Seater", price: 145000, brand: "binatone", cat: "furniture", stock: 4 },
    ],
  },
  {
    storeSlug: "glow-beauty-hub",
    products: [
      { name: "Nivea Soft Moisturizing Cream 200ml", price: 3500, brand: "oraimo", cat: "skincare", stock: 150 },
      { name: "L'Oreal Revitalift Day Cream 50ml", price: 15000, brand: "oraimo", cat: "skincare", stock: 60 },
      { name: "Maybelline Fit Me Foundation 128", price: 5500, brand: "oraimo", cat: "makeup", stock: 80 },
      { name: "MAC Matte Lipstick Set", price: 18000, brand: "oraimo", cat: "makeup", stock: 35 },
      { name: "Calvin Klein Eternity Perfume 100ml", price: 45000, brand: "oraimo", cat: "makeup", stock: 18 },
      { name: "Vitamin C Face Serum 30ml", price: 8500, brand: "oraimo", cat: "skincare", stock: 90 },
      { name: "Professional Makeup Brush Kit 12pc", price: 12000, brand: "oraimo", cat: "makeup", stock: 45 },
      { name: "Argan Hair Care Oil 100ml", price: 6500, brand: "oraimo", cat: "hair-care", stock: 70 },
      { name: "Setting Spray Makeup Lock 60ml", price: 7500, brand: "oraimo", cat: "makeup", stock: 3 },
      { name: "Oraimo Electric Facial Cleansing Brush", price: 5500, brand: "oraimo", cat: "skincare", stock: 55 },
    ],
  },
  {
    storeSlug: "prosports-ng",
    products: [
      { name: "Adjustable Dumbbell Pair 20kg", price: 45000, brand: "nike", cat: "fitness-equipment", stock: 25 },
      { name: "Pro Yoga Mat 6mm Thick", price: 8500, brand: "adidas", cat: "fitness-equipment", stock: 80 },
      { name: "Official Football Size 5", price: 6500, brand: "adidas", cat: "sportswear", stock: 120 },
      { name: "Spalding Basketball Official", price: 12000, brand: "nike", cat: "sportswear", stock: 45 },
      { name: "Nike Running Shoes Pegasus 40", price: 55000, brand: "nike", cat: "sportswear", stock: 30, variants: [{ type: "Size", values: ["40", "41", "42", "43", "44"] }] },
      { name: "Resistance Bands Set 5pc", price: 5500, brand: "adidas", cat: "fitness-equipment", stock: 100 },
      { name: "Adjustable Bench Press", price: 85000, brand: "nike", cat: "fitness-equipment", stock: 8 },
      { name: "Adidas Training Shorts", price: 7500, brand: "adidas", cat: "sportswear", stock: 65, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Kettlebell 16kg Cast Iron", price: 18000, brand: "nike", cat: "fitness-equipment", stock: 2 },
      { name: "Compression Training Tights", price: 15000, brand: "nike", cat: "sportswear", stock: 40, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
    ],
  },
  {
    storeSlug: "knowledge-books",
    products: [
      { name: "Think and Grow Rich Paperback", price: 3500, brand: "samsung", cat: "fiction-books", stock: 50 },
      { name: "Rich Dad Poor Dad", price: 4000, brand: "samsung", cat: "fiction-books", stock: 65 },
      { name: "Half of a Yellow Sun", price: 4500, brand: "samsung", cat: "fiction-books", stock: 40 },
      { name: "Digital Marketing Mastery Ebook", price: 7500, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Digital Marketing Mastery PDF", fileUrl: "https://example.com/kwikseller/digital-marketing-mastery.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Startup Playbook Digital Guide", price: 6500, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Startup Playbook PDF", fileUrl: "https://example.com/kwikseller/startup-playbook.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Personal Finance Handbook", price: 5500, brand: "samsung", cat: "fiction-books", stock: 35 },
      { name: "Children's Story Collection", price: 6500, brand: "samsung", cat: "fiction-books", stock: 28 },
      { name: "JAMB Prep Textbook 2024", price: 8500, brand: "samsung", cat: "fiction-books", stock: 90 },
      { name: "Web Development Course Ebook", price: 12000, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Web Dev Course PDF", fileUrl: "https://example.com/kwikseller/web-dev-course.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "African Fiction Anthology", price: 5000, brand: "samsung", cat: "fiction-books", stock: 22 },
    ],
  },
  {
    storeSlug: "autoparts-express",
    products: [
      { name: "4K Dual Dash Camera", price: 35000, brand: "oraimo", cat: "electronics-accessories", stock: 30 },
      { name: "Dual USB Car Charger Fast Charge", price: 4500, brand: "anker", cat: "electronics-accessories", stock: 150 },
      { name: "Portable Tire Inflator 12V", price: 18000, brand: "oraimo", cat: "electronics-accessories", stock: 25 },
      { name: "Wireless Car Phone Mount", price: 6500, brand: "oraimo", cat: "electronics-accessories", stock: 80 },
      { name: "Jump Starter Pack 2000A", price: 45000, brand: "oraimo", cat: "electronics-accessories", stock: 12 },
      { name: "Car Vacuum Cleaner Portable", price: 12000, brand: "oraimo", cat: "electronics-accessories", stock: 35 },
      { name: "Bluetooth FM Transmitter", price: 5500, brand: "anker", cat: "electronics-accessories", stock: 90 },
      { name: "360 Camera Car Security System", price: 85000, brand: "oraimo", cat: "electronics-accessories", stock: 4 },
      { name: "OBD2 Scanner Diagnostic Tool", price: 22000, brand: "oraimo", cat: "electronics-accessories", stock: 18 },
      { name: "Car Seat Leather Cushion Set", price: 28000, brand: "oraimo", cat: "electronics-accessories", stock: 15 },
    ],
  },
  {
    storeSlug: "wellness-pharmacy",
    products: [
      { name: "Samsung BP Monitor Upper Arm", price: 32000, brand: "samsung", cat: "health-monitors", stock: 40 },
      { name: "Omron Nebulizer NE-C28", price: 25000, brand: "samsung", cat: "wellness-devices", stock: 20 },
      { name: "Oraimo Pulse Oximeter", price: 4500, brand: "oraimo", cat: "health-monitors", stock: 85 },
      { name: "Infrared Thermometer TH-600", price: 12000, brand: "samsung", cat: "health-monitors", stock: 55 },
      { name: "Oraimo Smart Scale OCD-S21", price: 15000, brand: "oraimo", cat: "wellness-devices", stock: 45 },
      { name: "Infinix Smartband 6 Fitness Tracker", price: 18000, brand: "infinix", cat: "wellness-devices", stock: 30 },
      { name: "Digital Thermometer Flexible Tip", price: 3500, brand: "samsung", cat: "health-monitors", stock: 100 },
      { name: "Oraimo Smart Body Fat Scale", price: 12000, brand: "oraimo", cat: "wellness-devices", stock: 35 },
      { name: "First Aid Kit Home 100pc", price: 8500, brand: "samsung", cat: "wellness-devices", stock: 60 },
      { name: "Blood Glucose Monitor Kit", price: 15000, brand: "samsung", cat: "health-monitors", stock: 3 },
    ],
  },
  {
    storeSlug: "freshmart-foods",
    products: [
      { name: "Nestle Milo 400g", price: 3200, brand: "samsung", cat: "beverages", stock: 200 },
      { name: "Chi Exotic Fruit Juice 1L", price: 1500, brand: "samsung", cat: "beverages", stock: 150 },
      { name: "Premium Coffee Beans 500g", price: 6500, brand: "samsung", cat: "beverages", stock: 80 },
      { name: "Indomie Noodles Carton 40pc", price: 9500, brand: "samsung", cat: "staples", stock: 100 },
      { name: "Peak Milk Powder 900g", price: 7500, brand: "samsung", cat: "staples", stock: 90 },
      { name: "Breakfast Cereal Pack 500g", price: 4200, brand: "samsung", cat: "staples", stock: 120 },
      { name: "Honeywell Wheat Meal 2kg", price: 2200, brand: "samsung", cat: "staples", stock: 110 },
      { name: "Dangote Sugar 1kg", price: 1800, brand: "samsung", cat: "staples", stock: 180 },
      { name: "Herbal Tea Set 3-Flavour", price: 5500, brand: "samsung", cat: "beverages", stock: 45 },
      { name: "Organic Honey 500ml", price: 4500, brand: "samsung", cat: "staples", stock: 5 },
    ],
  },
  {
    storeSlug: "digital-downloads-co",
    products: [
      { name: "Business Plan Template Pro", price: 7500, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Business Plan Template", fileUrl: "https://example.com/kwikseller/business-plan-template.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Social Media Marketing Course", price: 25000, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "EXTERNAL_ACCESS", name: "Course Access Link", accessUrl: "https://learn.kwikseller.example.com/social-media-marketing", expiresAfterDays: 365 } },
      { name: "Adobe Creative Cloud License 1yr", price: 180000, brand: "samsung", cat: "software-licenses", stock: 0, digital: true, digitalAsset: { deliveryType: "LICENSE_KEY", name: "Adobe CC License Key", licenseKey: "ADOBE-CC-2024-KWIK-001", expiresAfterDays: 365 } },
      { name: "Resume Design Template Bundle", price: 5500, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Resume Templates ZIP", fileUrl: "https://example.com/kwikseller/resume-templates.zip", maxDownloads: 10, expiresAfterDays: 90 } },
      { name: "Web Design Masterclass", price: 35000, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "EXTERNAL_ACCESS", name: "Masterclass Access", accessUrl: "https://learn.kwikseller.example.com/web-design", expiresAfterDays: 365 } },
      { name: "Microsoft Office 365 License", price: 45000, brand: "samsung", cat: "software-licenses", stock: 0, digital: true, digitalAsset: { deliveryType: "LICENSE_KEY", name: "MS Office 365 Key", licenseKey: "MS-O365-2024-KWIK-001", expiresAfterDays: 365 } },
      { name: "Financial Modeling Excel Pack", price: 8500, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Financial Models XLSX", fileUrl: "https://example.com/kwikseller/financial-models.xlsx", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Photography Editing Course", price: 18000, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "EXTERNAL_ACCESS", name: "Photo Editing Course", accessUrl: "https://learn.kwikseller.example.com/photo-editing", expiresAfterDays: 180 } },
      { name: "SEO Optimization Guide Ebook", price: 6500, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "SEO Guide PDF", fileUrl: "https://example.com/kwikseller/seo-guide.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Premium Icon Pack 500+", price: 4500, brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Icon Pack ZIP", fileUrl: "https://example.com/kwikseller/icon-pack.zip", maxDownloads: 10, expiresAfterDays: 90 } },
    ],
  },
];

const CUSTOMER_EMAILS = [
  "chidi.okeke@example.com", "ngozi.eze@example.com", "emeka.nwosu@example.com",
  "fatima.yusuf@example.com", "tope.adebayo@example.com", "aisha.ibrahim@example.com",
  "kunle.ogundimu@example.com", "zainab.musa@example.com",
];

// vendor index -> opening wallet balance, same formula as seed.ts
function openingBalanceFor(vi: number): number {
  if (vi < 3) return [250000, 125000, 85000][vi];
  if (vi < 5) return 45000;
  return 0;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  assertDevOnly();
  console.log("🔄 Reseeding PRODUCTS ONLY (vendors, customers, categories, brands left untouched)...\n");

  // ── 1. Look up everything that must already exist ──
  console.log("🔎 Looking up existing accounts & reference data...");

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryMap: Record<string, string> = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  if (categories.length === 0) throw new Error("No categories found — run the full seed.ts once first.");

  const brands = await prisma.brand.findMany({ select: { id: true, slug: true } });
  const brandMap: Record<string, string> = Object.fromEntries(brands.map((b) => [b.slug, b.id]));
  if (brands.length === 0) throw new Error("No brands found — run the full seed.ts once first.");

  const vendorInfo: { userId: string; storeId: string; storeSlug: string; storeName: string; walletId: string; vi: number }[] = [];
  for (let vi = 0; vi < VENDOR_PRODUCTS.length; vi++) {
    const slug = VENDOR_PRODUCTS[vi].storeSlug;
    const vendorUser = await db.user.findFirst({
      where: { role: "VENDOR", store: { slug } },
      include: { store: true, wallet: true },
    });
    if (!vendorUser?.store || !vendorUser?.wallet) {
      throw new Error(`Vendor store "${slug}" not found — run the full seed.ts once first.`);
    }
    vendorInfo.push({ userId: vendorUser.id, storeId: vendorUser.store.id, storeSlug: slug, storeName: vendorUser.store.name, walletId: vendorUser.wallet.id, vi });
  }

  const customerIds: string[] = [];
  for (const email of CUSTOMER_EMAILS) {
    const c = await prisma.user.findFirst({ where: { email, role: "BUYER" }, select: { id: true } });
    if (!c) throw new Error(`Customer "${email}" not found — run the full seed.ts once first.`);
    customerIds.push(c.id);
  }

  const riderUserRow = await prisma.user.findFirst({ where: { email: "rider@kwikseller.com", role: "RIDER" }, select: { id: true } });
  if (!riderUserRow) throw new Error(`Rider not found — run the full seed.ts once first.`);
  const riderUser = riderUserRow;

  console.log(`   ✅ Found ${vendorInfo.length} vendors, ${customerIds.length} customers, ${categories.length} categories, ${brands.length} brands\n`);

  // ── 2. FK-safe cleanup — PRODUCTS AND DOWNSTREAM ONLY ──
  console.log("🧹 Clearing product-dependent data (orders, carts, wishlists, deals, products)...");
  const cleanupOrder = [
    "walletTransaction", "commission", "escrow", "quoteRevision", "quote",
    "delivery", "fulfillment", "payment", "orderItem", "order", "parentCheckout",
    "review", "dealProduct", "deal", "couponProduct", "cartItem", "cart", "wishlist",
    "productMedia", "productDeliveryZone", "productDeliveryOverride", "productAttribute",
    "productDimension", "productSeo", "productTag", "relatedProduct", "digitalAsset",
    "inventoryItem", "productVariant", "variantValue", "variantType", "product",
  ];
  for (const model of cleanupOrder) {
    try { await db[model]?.deleteMany(); } catch { /* model may not exist on this schema */ }
  }
  console.log("   ✅ Cleared\n");

  // ── 3. Reset vendor wallets to opening balance (undo old escrow releases) ──
  console.log("💰 Resetting vendor wallets to opening balances...");
  for (const v of vendorInfo) {
    const opening = openingBalanceFor(v.vi);
    await prisma.wallet.update({ where: { id: v.walletId }, data: { availableBalance: opening, pendingBalance: 0, totalEarned: opening, totalWithdrawn: 0 } });
    if (opening > 0) {
      await db.walletTransaction.create({
        data: { walletId: v.walletId, vendorId: v.userId, type: "OPENING_BALANCE", amount: opening, balanceAfter: opening, reference: `OPENING-${v.userId.slice(-8)}-${randSuffix()}`, reason: "Opening balance (reseed)", createdBy: "system" },
      });
    }
  }
  console.log("   ✅ Wallets reset\n");

  // ── 4. Recreate products with REAL matching images ──
  console.log("🛍️  Creating products with curated images...");
  let productIdx = 1;
  const allProducts: { id: string; name: string; price: number; mainImage: string; storeId: string; vendorIdx: number; isDigital: boolean; categoryId: string; brandId: string; stock: number }[] = [];

  for (const vp of VENDOR_PRODUCTS) {
    const v = vendorInfo.find((x) => x.storeSlug === vp.storeSlug)!;

    for (const ps of vp.products) {
      const slug = `${slugify(ps.name)}-${randSuffix()}`;
      const sku = makeSku(`V${v.vi + 1}`, productIdx);
      const comparePrice = Math.round(ps.price * 1.15);
      const isDigital = ps.digital ?? false;
      const [mainImg, img2, img3] = getProductImageSet(ps.name);

      const product = await prisma.product.create({
        data: {
          storeId: v.storeId, name: ps.name, slug,
          shortDescription: `${ps.name} — quality product available on Kwikseller.`,
          description: `<h2>${ps.name}</h2><p>Premium quality product from a verified Kwikseller vendor. Ships with secure escrow-protected payment.</p><ul><li>Quality checked and verified.</li><li>Secure checkout with Kwikscrow escrow protection.</li></ul>`,
          price: ps.price, comparePrice, sku, barcode: sku.padEnd(12, "0").slice(0, 12),
          productType: isDigital ? "DIGITAL" : "PHYSICAL", productSource: "VENDOR_STOCK",
          inventoryPolicy: isDigital ? "UNLIMITED" : "TRACKED", requiresShipping: !isDigital, trackInventory: !isDigital,
          stock: ps.stock, lowStock: 5, minOrderQuantity: 1, maxOrderQuantity: isDigital ? 1 : Math.min(ps.stock, 25),
          condition: "NEW", status: ProductStatus.ACTIVE, categoryId: categoryMap[ps.cat], brandId: brandMap[ps.brand],
          isFeatured: productIdx % 7 === 0, weight: isDigital ? null : Number((0.3 + (ps.price % 5000) / 10000).toFixed(2)),
          images: {
            create: [
              { url: mainImg, alt: ps.name, position: 0, isMain: true },
              { url: img2, alt: `${ps.name} view 2`, position: 1, isMain: false },
              { url: img3, alt: `${ps.name} view 3`, position: 2, isMain: false },
            ],
          },
          ...(isDigital ? {} : { inventoryItems: { create: { storeId: v.storeId, sku, available: ps.stock, reserved: 0, lowStockThreshold: 5, policy: "TRACKED" } } }),
          dimension: isDigital ? undefined : { create: { weight: Number((0.5 + (ps.price % 3000) / 6000).toFixed(2)), length: 20, width: 15, height: 8 } },
          seo: { create: { metaTitle: `${ps.name} | Kwikseller`, metaDescription: `Buy ${ps.name} on Kwikseller.`, metaKeywords: `${ps.name}, Kwikseller, Nigeria` } },
          ...(ps.digitalAsset ? { digitalAssets: { create: ps.digitalAsset } } : {}),
        },
      });

      if (ps.variants && !isDigital) {
        for (const vdef of ps.variants) {
          const vt = await prisma.variantType.create({ data: { productId: product.id, name: vdef.type, position: 0 } });
          for (let i = 0; i < vdef.values.length; i++) {
            await prisma.variantValue.create({ data: { variantTypeId: vt.id, value: vdef.values[i], position: i } });
            const varPrice = ps.price + i * Math.round(ps.price * 0.05);
            await prisma.productVariant.create({
              data: { productId: product.id, name: `${vdef.type}: ${vdef.values[i]}`, price: varPrice, stock: Math.max(1, Math.floor(ps.stock / vdef.values.length)), sku: `${sku}-${vdef.values[i].slice(0, 3).toUpperCase()}` },
            });
          }
        }
      }

      allProducts.push({ id: product.id, name: ps.name, price: ps.price, mainImage: mainImg, storeId: v.storeId, vendorIdx: v.vi, isDigital, categoryId: categoryMap[ps.cat], brandId: brandMap[ps.brand], stock: ps.stock });
      productIdx++;
    }
  }
  console.log(`   ✅ ${allProducts.length} products created with real matching images\n`);

  // ── 5. Orders (same 8 scenarios as seed.ts, linked to existing accounts) ──
  console.log("📦 Recreating order lifecycle scenarios...");
  let orderCounter = 0;
  const nextRef = (prefix: string) => `${prefix}-${String(++orderCounter).padStart(4, "0")}`;
  function computeTotals(subtotal: number, shippingFee: number, discount = 0) {
    const processingFeeAmount = Math.round(subtotal * 0.01 * 100) / 100;
    const totalAmount = Math.round((subtotal + shippingFee + processingFeeAmount - discount) * 100) / 100;
    return { processingFeePercent: 1.0, processingFeeAmount, totalAmount };
  }

  async function createOrderChain(opts: {
    buyerId: string; storeId: string; vendorUserId: string;
    items: { product: typeof allProducts[0]; qty: number }[];
    deliveryMethod: "PICKUP" | "STANDARD_DELIVERY";
    quoteStatus: "PENDING_VENDOR_QUOTE" | "AGREED" | "CANCELLED";
    quoteRevisions?: { type: string; amount: number; actorId: string; note?: string; daysAgo: number }[];
    agreedDeliveryFee?: number; orderStatus: string; paymentStatus: string; paid?: boolean;
    escrowStatus?: "HELD" | "RELEASED" | null; deliveryStatus?: string | null;
    fulfillmentStatus?: string | null; fulfillmentType?: string | null;
    review?: { rating: number; comment: string } | null;
    notifications?: { userId: string; type: string; title: string; message: string }[];
    parentCheckoutId?: string; deliveryAddress?: string; pickupAddress?: string;
    daysOffset?: number; customerConfirmed?: boolean;
  }) {
    const offset = opts.daysOffset ?? 5;
    const placedAt = daysAgo(offset);
    const subtotal = opts.items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const shippingFee = opts.quoteStatus === "AGREED" ? (opts.agreedDeliveryFee ?? 0) : 0;
    const { processingFeePercent, processingFeeAmount, totalAmount } = computeTotals(subtotal, shippingFee);
    const checkoutRef = nextRef("KWIK-CHK");

    const order = await prisma.order.create({
      data: {
        buyerId: opts.buyerId, storeId: opts.storeId, parentCheckoutId: opts.parentCheckoutId,
        status: opts.orderStatus as any, subtotal, shippingFee, discount: 0, totalAmount,
        paymentStatus: opts.paymentStatus as any, checkoutReference: checkoutRef,
        deliveryMethod: opts.deliveryMethod as any, quoteStatus: opts.quoteStatus as any,
        quoteExpiresAt: opts.quoteStatus === "PENDING_VENDOR_QUOTE" ? daysAhead(2) : null,
        processingFeePercent, processingFeeAmount, agreedDeliveryFee: opts.agreedDeliveryFee ?? 0,
        agreedAt: opts.quoteStatus === "AGREED" ? daysAgo(offset - 1) : null,
        createdAt: placedAt, updatedAt: placedAt,
        deliveryState: opts.deliveryMethod === "STANDARD_DELIVERY" ? "Lagos State" : null,
        deliveryLocalGovernment: opts.deliveryMethod === "STANDARD_DELIVERY" ? "Ikeja" : null,
      },
    });

    for (const it of opts.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id, productId: it.product.id, quantity: it.qty, unitPrice: it.product.price, totalPrice: it.product.price * it.qty,
          productType: it.product.isDigital ? "DIGITAL" : "PHYSICAL", productSource: "VENDOR_STOCK",
          sellerStoreId: opts.storeId, fulfillmentStatus: (opts.fulfillmentStatus ?? "PENDING") as any,
          productNameSnapshot: it.product.name, productSkuSnapshot: `SKU-V${it.product.vendorIdx + 1}`,
          productSlugSnapshot: slugify(it.product.name), productImageSnapshot: it.product.mainImage,
          vendorNameSnapshot: vendorInfo.find((v) => v.vi === it.product.vendorIdx)!.storeName, vendorStoreIdSnapshot: it.product.storeId,
        },
      });
    }

    if (opts.quoteStatus !== "PENDING_VENDOR_QUOTE" || opts.quoteRevisions) {
      const quote = await prisma.quote.create({
        data: {
          orderId: order.id, vendorId: opts.vendorUserId, buyerId: opts.buyerId, status: opts.quoteStatus as any,
          currentAmount: opts.agreedDeliveryFee ?? 0,
          agreedAmount: opts.quoteStatus === "AGREED" ? (opts.agreedDeliveryFee ?? 0) : null,
          expiresAt: daysAhead(5), agreedAt: opts.quoteStatus === "AGREED" ? daysAgo(offset - 1) : null,
          rejectedAt: opts.quoteStatus === "CANCELLED" ? daysAgo(offset - 1) : null,
          rejectedBy: opts.quoteStatus === "CANCELLED" ? opts.buyerId : null,
          rejectReason: opts.quoteStatus === "CANCELLED" ? "Cancelled by customer" : null,
        },
      });
      if (opts.quoteRevisions) {
        for (const r of opts.quoteRevisions) {
          await prisma.quoteRevision.create({ data: { quoteId: quote.id, type: r.type as any, amount: r.amount, actorId: r.actorId, note: r.note, createdAt: daysAgo(r.daysAgo) } });
        }
      }
    } else {
      await prisma.quote.create({ data: { orderId: order.id, vendorId: opts.vendorUserId, buyerId: opts.buyerId, status: "PENDING_VENDOR_QUOTE", currentAmount: 0, expiresAt: daysAhead(2) } });
    }

    if (opts.paid && !opts.parentCheckoutId) {
      await prisma.payment.create({
        data: { orderId: order.id, entityType: "ORDER", entityId: order.id, amount: totalAmount, gateway: "PAYSTACK", reference: nextRef("PAY"), status: "PAID", paidAt: placedAt, verifiedAt: placedAt },
      });
    }

    if (opts.escrowStatus) {
      const escrow = await prisma.escrow.create({
        data: { orderId: order.id, vendorId: opts.vendorUserId, amount: totalAmount, status: opts.escrowStatus, heldAt: placedAt, releasedAt: opts.escrowStatus === "RELEASED" ? daysAgo(Math.max(1, offset - 3)) : null, transactionRef: nextRef("ESC") },
      });
      if (opts.escrowStatus === "RELEASED") {
        const wallet = await prisma.wallet.findUnique({ where: { vendorId: opts.vendorUserId } });
        if (wallet) {
          const vendorEarnings = Math.round((subtotal + shippingFee - processingFeeAmount) * 100) / 100;
          const newBalance = Math.round((wallet.availableBalance + vendorEarnings) * 100) / 100;
          await db.walletTransaction.create({ data: { walletId: wallet.id, vendorId: opts.vendorUserId, type: "ESCROW_RELEASE", amount: vendorEarnings, balanceAfter: newBalance, reference: nextRef("WT"), orderId: order.id, escrowId: escrow.id, reason: `Escrow release for order ${checkoutRef}`, createdBy: "system" } });
          await prisma.wallet.update({ where: { id: wallet.id }, data: { availableBalance: newBalance, totalEarned: Math.round((wallet.totalEarned + vendorEarnings) * 100) / 100 } });
        }
        await prisma.commission.create({ data: { orderId: order.id, vendorId: opts.vendorUserId, saleAmount: subtotal, platformFeePercent: 1.0, platformFeeAmount: processingFeeAmount, vendorEarnings: Math.round((subtotal + shippingFee - processingFeeAmount) * 100) / 100, plan: "SCALE", settledAt: daysAgo(Math.max(1, offset - 3)) } });
      }
    }

    if (opts.deliveryStatus && opts.deliveryMethod === "STANDARD_DELIVERY") {
      const inTransitOrLater = opts.deliveryStatus === "IN_TRANSIT" || opts.deliveryStatus === "DELIVERED" || opts.deliveryStatus === "COMPLETED";
      await prisma.delivery.create({
        data: {
          orderId: order.id, status: opts.deliveryStatus as any, riderId: inTransitOrLater ? riderUser.id : null,
          assignedAt: opts.deliveryStatus !== "PENDING" ? daysAgo(offset - 2) : null, acceptedAt: opts.deliveryStatus !== "PENDING" ? daysAgo(offset - 2) : null,
          vendorPreparingAt: daysAgo(offset - 2), vendorReadyAt: opts.deliveryStatus !== "PENDING" ? daysAgo(offset - 2) : null,
          pickedUpAt: inTransitOrLater ? daysAgo(offset - 1) : null, inTransitAt: inTransitOrLater ? daysAgo(offset - 1) : null,
          deliveredAt: (opts.deliveryStatus === "DELIVERED" || opts.deliveryStatus === "COMPLETED") ? daysAgo(Math.max(1, offset - 3)) : null,
          customerConfirmed: opts.customerConfirmed ?? (opts.deliveryStatus === "COMPLETED"), customerConfirmedAt: opts.customerConfirmed ? daysAgo(Math.max(1, offset - 3)) : null,
          pickupAddress: opts.pickupAddress ?? "Vendor store", deliveryAddress: opts.deliveryAddress ?? "Customer address",
          deliveryContactName: "Customer", deliveryContactPhone: "+2348000000000",
        },
      });
    }

    if (opts.fulfillmentStatus && opts.fulfillmentType) {
      const digitalProduct = opts.items.find((i) => i.product.isDigital);
      const digitalAsset = digitalProduct ? await db.digitalAsset.findFirst({ where: { productId: digitalProduct.product.id } }) : null;
      await prisma.fulfillment.create({
        data: {
          orderId: order.id, type: opts.fulfillmentType as any, status: opts.fulfillmentStatus as any,
          digitalAssetId: digitalAsset?.id, accessUrl: digitalAsset?.accessUrl ?? digitalAsset?.fileUrl,
          deliveredAt: (opts.fulfillmentStatus === "FULFILLED" || opts.fulfillmentStatus === "DELIVERED") ? daysAgo(Math.max(1, offset - 3)) : null,
        },
      });
    }

    if (opts.review) {
      const reviewProduct = opts.items[0].product;
      await prisma.review.create({
        data: { productId: reviewProduct.id, userId: opts.buyerId, orderId: order.id, rating: opts.review.rating, title: opts.review.rating >= 4 ? "Great product!" : "Decent", comment: opts.review.comment, isApproved: true, isVerifiedPurchase: true },
      });
      const reviews = await prisma.review.findMany({ where: { productId: reviewProduct.id }, select: { rating: true } });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await prisma.product.update({ where: { id: reviewProduct.id }, data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length } });
    }

    if (opts.notifications) {
      for (const n of opts.notifications) {
        await prisma.notification.create({ data: { userId: n.userId, type: n.type, title: n.title, message: n.message, isRead: false } });
      }
    }
    return order;
  }

  const find = (vendorIdx: number, match: string, price?: number) =>
    allProducts.find((p) => p.vendorIdx === vendorIdx && p.name.includes(match) && (price === undefined || p.price === price))!;

  await createOrderChain({
    buyerId: customerIds[0], storeId: vendorInfo[0].storeId, vendorUserId: vendorInfo[0].userId,
    items: [{ product: find(0, "Galaxy A54"), qty: 1 }],
    deliveryMethod: "PICKUP", quoteStatus: "AGREED", agreedDeliveryFee: 0,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 0, actorId: vendorInfo[0].userId, note: "Pickup — no delivery fee", daysAgo: 5 },
      { type: "CUSTOMER_ACCEPT", amount: 0, actorId: customerIds[0], daysAgo: 5 },
    ],
    orderStatus: "DELIVERED", paymentStatus: "PAID", paid: true, escrowStatus: "RELEASED",
    fulfillmentStatus: "FULFILLED", fulfillmentType: "PHYSICAL_MANUAL",
    review: { rating: 5, comment: "Great product, fast pickup!" },
    notifications: [
      { userId: customerIds[0], type: "ORDER_DELIVERED", title: "Order Delivered", message: "Your order has been delivered. Please confirm receipt." },
      { userId: vendorInfo[0].userId, type: "WALLET_CREDITED", title: "Payment Released", message: "Escrow payment has been released to your wallet." },
    ],
    daysOffset: 5,
  });

  await createOrderChain({
    buyerId: customerIds[1], storeId: vendorInfo[1].storeId, vendorUserId: vendorInfo[1].userId,
    items: [{ product: find(1, "Air Max"), qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "AGREED", agreedDeliveryFee: 2500,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 2500, actorId: vendorInfo[1].userId, note: "Standard delivery to Abuja", daysAgo: 4 },
      { type: "CUSTOMER_ACCEPT", amount: 2500, actorId: customerIds[1], daysAgo: 4 },
    ],
    orderStatus: "SHIPPED", paymentStatus: "PAID", paid: true, escrowStatus: "HELD",
    deliveryStatus: "IN_TRANSIT", fulfillmentStatus: "PROCESSING", fulfillmentType: "PHYSICAL_MANUAL",
    deliveryAddress: "45 Wuse 2 Crescent, Abuja", pickupAddress: "Bola Fashion House, Lagos",
    notifications: [
      { userId: customerIds[1], type: "ORDER_IN_TRANSIT", title: "Order In Transit", message: "Your order is on the way to Abuja." },
      { userId: vendorInfo[1].userId, type: "NEW_ORDER", title: "New Order Received", message: "You received a new order. Payment is held in escrow." },
    ],
    daysOffset: 4,
  });

  const parentCheckout = await prisma.parentCheckout.create({
    data: { buyerId: customerIds[2], status: "PAID", subtotal: 0, shippingFee: 0, discount: 0, totalAmount: 0, paymentStatus: "PAID", checkoutReference: nextRef("KWIK-CHK"), idempotencyKey: `idem-${orderCounter}-${randSuffix()}` },
  });
  const order3a = await createOrderChain({
    buyerId: customerIds[2], storeId: vendorInfo[0].storeId, vendorUserId: vendorInfo[0].userId,
    items: [{ product: find(0, "AirPods"), qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "AGREED", agreedDeliveryFee: 2000,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 2000, actorId: vendorInfo[0].userId, daysAgo: 6 },
      { type: "CUSTOMER_ACCEPT", amount: 2000, actorId: customerIds[2], daysAgo: 6 },
    ],
    orderStatus: "DELIVERED", paymentStatus: "PAID", paid: true, escrowStatus: "RELEASED",
    deliveryStatus: "COMPLETED", fulfillmentStatus: "FULFILLED", fulfillmentType: "PHYSICAL_MANUAL",
    deliveryAddress: "78 Aba Road, Port Harcourt", customerConfirmed: true,
    review: { rating: 4, comment: "Good sound quality, fast delivery." },
    notifications: [{ userId: customerIds[2], type: "ORDER_DELIVERED", title: "Order Delivered", message: "Your AirPods have been delivered." }],
    parentCheckoutId: parentCheckout.id, daysOffset: 6,
  });
  const order3b = await createOrderChain({
    buyerId: customerIds[2], storeId: vendorInfo[2].storeId, vendorUserId: vendorInfo[2].userId,
    items: [{ product: find(2, "Air Fryer", 25000), qty: 2 }],
    deliveryMethod: "PICKUP", quoteStatus: "AGREED", agreedDeliveryFee: 0,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 0, actorId: vendorInfo[2].userId, note: "Pickup — no fee", daysAgo: 6 },
      { type: "CUSTOMER_ACCEPT", amount: 0, actorId: customerIds[2], daysAgo: 6 },
    ],
    orderStatus: "CONFIRMED", paymentStatus: "PAID", paid: true, escrowStatus: "HELD",
    fulfillmentStatus: "PENDING", fulfillmentType: "PHYSICAL_MANUAL",
    notifications: [{ userId: vendorInfo[2].userId, type: "NEW_ORDER", title: "New Order Received", message: "You received a new pickup order." }],
    parentCheckoutId: parentCheckout.id, daysOffset: 6,
  });
  const sub3 = order3a.totalAmount + order3b.totalAmount;
  await prisma.parentCheckout.update({ where: { id: parentCheckout.id }, data: { subtotal: sub3, totalAmount: sub3 } });
  await prisma.payment.create({ data: { parentCheckoutId: parentCheckout.id, entityType: "CHECKOUT", entityId: parentCheckout.id, amount: sub3, gateway: "PAYSTACK", reference: nextRef("PAY"), status: "PAID", paidAt: daysAgo(6), verifiedAt: daysAgo(6) } });

  await createOrderChain({
    buyerId: customerIds[3], storeId: vendorInfo[9].storeId, vendorUserId: vendorInfo[9].userId,
    items: [{ product: find(9, "Marketing Course"), qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "AGREED", agreedDeliveryFee: 0,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 0, actorId: vendorInfo[9].userId, note: "Digital — no delivery fee", daysAgo: 4 },
      { type: "CUSTOMER_ACCEPT", amount: 0, actorId: customerIds[3], daysAgo: 4 },
    ],
    orderStatus: "FULFILLED", paymentStatus: "PAID", paid: true, escrowStatus: "RELEASED",
    fulfillmentStatus: "FULFILLED", fulfillmentType: "DIGITAL_ACCESS",
    review: { rating: 5, comment: "Excellent digital course, instant access!" },
    notifications: [
      { userId: customerIds[3], type: "DIGITAL_READY", title: "Digital Purchase Ready", message: "Your digital course is ready to access." },
      { userId: vendorInfo[9].userId, type: "WALLET_CREDITED", title: "Payment Released", message: "Escrow payment released to your wallet." },
    ],
    daysOffset: 4,
  });

  await createOrderChain({
    buyerId: customerIds[4], storeId: vendorInfo[4].storeId, vendorUserId: vendorInfo[4].userId,
    items: [{ product: find(4, "Dumbbell"), qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "PENDING_VENDOR_QUOTE",
    orderStatus: "PENDING", paymentStatus: "PENDING", paid: false,
    notifications: [{ userId: vendorInfo[4].userId, type: "QUOTE_REQUESTED", title: "New Order Awaiting Quote", message: "A customer placed an order. Please submit a delivery quote." }],
    daysOffset: 1,
  });

  await createOrderChain({
    buyerId: customerIds[5], storeId: vendorInfo[1].storeId, vendorUserId: vendorInfo[1].userId,
    items: [{ product: find(1, "Ankara"), qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "AGREED", agreedDeliveryFee: 3000,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 3500, actorId: vendorInfo[1].userId, note: "Standard delivery to Abuja", daysAgo: 4 },
      { type: "CUSTOMER_REQUEST_REDUCTION", amount: 2500, actorId: customerIds[5], note: "Can you reduce to 2500?", daysAgo: 3 },
      { type: "VENDOR_REVISE", amount: 3000, actorId: vendorInfo[1].userId, note: "Best I can do is 3000", daysAgo: 2 },
      { type: "CUSTOMER_ACCEPT", amount: 3000, actorId: customerIds[5], daysAgo: 1 },
    ],
    orderStatus: "PENDING_PAYMENT", paymentStatus: "PENDING", paid: false,
    notifications: [
      { userId: vendorInfo[1].userId, type: "QUOTE_NEGOTIATION", title: "Customer Requested Reduction", message: "Customer requested a delivery fee reduction." },
      { userId: customerIds[5], type: "QUOTE_REVISED", title: "Vendor Revised Quote", message: "Vendor revised delivery fee to ₦3,000." },
    ],
    daysOffset: 4,
  });

  await createOrderChain({
    buyerId: customerIds[6], storeId: vendorInfo[0].storeId, vendorUserId: vendorInfo[0].userId,
    items: [{ product: find(0, "Charger", 6500), qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "CANCELLED",
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 2000, actorId: vendorInfo[0].userId, daysAgo: 3 },
      { type: "CUSTOMER_REJECT", amount: 0, actorId: customerIds[6], note: "Found a better deal elsewhere", daysAgo: 2 },
    ],
    orderStatus: "CANCELLED", paymentStatus: "PENDING", paid: false,
    notifications: [{ userId: vendorInfo[0].userId, type: "ORDER_CANCELLED", title: "Order Cancelled", message: "Customer cancelled the order." }],
    daysOffset: 3,
  });

  await createOrderChain({
    buyerId: customerIds[7], storeId: vendorInfo[2].storeId, vendorUserId: vendorInfo[2].userId,
    items: [{ product: find(2, "Air Fryer", 25000), qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "AGREED", agreedDeliveryFee: 2200,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 2200, actorId: vendorInfo[2].userId, daysAgo: 5 },
      { type: "CUSTOMER_ACCEPT", amount: 2200, actorId: customerIds[7], daysAgo: 5 },
    ],
    orderStatus: "DELIVERED", paymentStatus: "PAID", paid: true, escrowStatus: "RELEASED",
    deliveryStatus: "COMPLETED", fulfillmentStatus: "FULFILLED", fulfillmentType: "PHYSICAL_MANUAL",
    deliveryAddress: "30 Broad Street, Lagos Island", customerConfirmed: true,
    review: { rating: 4, comment: "Works well, slightly smaller than expected." },
    notifications: [
      { userId: customerIds[7], type: "ORDER_DELIVERED", title: "Order Delivered", message: "Your air fryer has been delivered." },
      { userId: vendorInfo[2].userId, type: "WALLET_CREDITED", title: "Payment Released", message: "Escrow payment released to your wallet." },
    ],
    daysOffset: 5,
  });

  console.log(`   ✅ ${await prisma.order.count()} orders recreated\n`);

  // ── 6. Deals ──
  console.log("🏷️  Recreating deals...");
  const v0 = allProducts.filter((p) => p.vendorIdx === 0).slice(0, 6);
  const v1 = allProducts.filter((p) => p.vendorIdx === 1).slice(0, 6);
  const v2 = allProducts.filter((p) => p.vendorIdx === 2).slice(0, 5);
  for (const ds of [
    { title: "Flash Sale — 20% Off Electronics", dealType: "FLASH_DEAL" as DealType, discountValue: 20, endDate: daysAhead(7), products: v0, img: getProductImage(v0[0].name) },
    { title: "Deal of the Day — Fashion Picks", dealType: "DEAL_OF_THE_DAY" as DealType, discountValue: 15, endDate: daysAhead(3), products: v1, img: getProductImage(v1[0].name) },
    { title: "Featured Deal — Home Essentials", dealType: "FEATURED_DEAL" as DealType, discountValue: 10, endDate: daysAhead(14), products: v2, img: getProductImage(v2[0].name) },
  ]) {
    const deal = await prisma.deal.create({ data: { title: ds.title, description: ds.title, imageUrl: ds.img, dealType: ds.dealType, discountType: "PERCENTAGE", discountValue: ds.discountValue, startDate: new Date(), endDate: ds.endDate, minOrderValue: 0, isActive: true } });
    for (const p of ds.products) {
      await db.dealProduct.create({ data: { dealId: deal.id, productId: p.id, dealPrice: Math.round(p.price * (1 - ds.discountValue / 100)) } });
    }
  }
  console.log("   ✅ 3 deals recreated\n");

  // ── 7. Carts ──
  console.log("🛒 Recreating carts...");
  const cart1 = await prisma.cart.create({ data: { userId: customerIds[0] } });
  const p1 = find(0, "Galaxy A54");
  await prisma.cartItem.create({ data: { cartId: cart1.id, productId: p1.id, quantity: 1, price: p1.price, productType: "PHYSICAL", productSource: "VENDOR_STOCK", requiresShipping: true } });
  const cart2 = await prisma.cart.create({ data: { userId: customerIds[1] } });
  const p2a = find(1, "Air Max");
  const p2b = find(4, "Football");
  await prisma.cartItem.create({ data: { cartId: cart2.id, productId: p2a.id, quantity: 1, price: p2a.price, productType: "PHYSICAL", productSource: "VENDOR_STOCK", requiresShipping: true } });
  await prisma.cartItem.create({ data: { cartId: cart2.id, productId: p2b.id, quantity: 2, price: p2b.price, productType: "PHYSICAL", productSource: "VENDOR_STOCK", requiresShipping: true } });
  await prisma.cart.create({ data: { userId: customerIds[2] } });
  console.log("   ✅ 3 carts recreated\n");

  // ── 8. Wishlists ──
  console.log("💝 Recreating wishlists...");
  const wlProducts = allProducts.filter((p) => !p.isDigital).slice(0, 5);
  for (let i = 0; i < 3; i++) await prisma.wishlist.create({ data: { userId: customerIds[0], productId: wlProducts[i].id } });
  for (let i = 3; i < 5; i++) await prisma.wishlist.create({ data: { userId: customerIds[1], productId: wlProducts[i].id } });
  console.log("   ✅ 5 wishlist entries recreated\n");

  console.log("========================================");
  console.log(`✅ Reseed complete: ${allProducts.length} products across ${vendorInfo.length} vendors, images now match product names.`);
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ Reseed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });