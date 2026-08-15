/**
 * KWIKSELLER Database Seed Script — Realistic Marketplace Dataset
 *
 * Produces a clean, internally-consistent development database:
 *   - 1 Super Admin + 1 Admin
 *   - 8 Customers (BUYER)
 *   - 10 Vendors (VENDOR) with Stores + delivery settings + wallets
 *   - 1 Rider
 *   - ~130 Products (physical + digital) with matched images
 *   - Categories (parent + child) + Brands
 *   - 8 Order scenarios covering the full quote→payment→escrow→wallet lifecycle
 *   - Quotes, QuoteRevisions, Payments, Escrow, WalletTransactions, Commissions
 *   - Deliveries, Fulfillments, Reviews, Notifications, Banners, Deals, Coupons
 *   - Carts, Wishlists
 *
 * SAFETY: This script refuses to run when NODE_ENV=production.
 *
 * Run:  cd apps/api && npx prisma db seed
 */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  AdminRole,
  ProductStatus,
  BannerType,
  DealType,
  DiscountType,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const db = prisma as any;

// ============================================================
// SAFETY: block production runs
// ============================================================
function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL: Seed script cannot run in production (NODE_ENV=production). Aborting.",
    );
  }
  const url = process.env.DATABASE_URL || "";
  if (url.startsWith("postgres") || url.startsWith("mysql")) {
    throw new Error(
      "FATAL: DATABASE_URL points to a non-SQLite database. Seed is dev-only. Aborting.",
    );
  }
}

// ============================================================
// PASSWORDS (documented in final summary)
// ============================================================
const PWD = {
  superAdmin: "SuperAdmin@2024!",
  admin: "Admin@2024!",
  customer: "Customer@2024!",
  vendor: "Vendor@2024!",
  rider: "Rider@2024!",
};

// ============================================================
// HELPERS
// ============================================================
function stableHash(value: string): number {
  return value.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

type NigeriaLgaRow = { name: string; state_code: string; state_name: string };
function loadNigeriaLocations(): NigeriaLgaRow[] {
  return JSON.parse(
    readFileSync(join(__dirname, "nigeria-lgas-flat.json"), "utf8"),
  ) as NigeriaLgaRow[];
}

// ============================================================
// CURATED IMAGE POOLS — every product image visually matches its type
// ============================================================
const IMG: Record<string, string[]> = {
  smartphone: ["photo-1511707171634-5f897ff02aa9", "photo-1598327105666-5b89351aff97", "photo-1580910051074-3eb694886505", "photo-1592750475338-74b7b21085ab", "photo-1616348436168-de43ad0db179"],
  iphone: ["photo-1592286927505-1def25115558", "photo-1510557880182-3d4d3cba73ea", "photo-1591336038662-f2064590c22b"],
  tablet: ["photo-1544244015-0df4b3ffc6b0", "photo-1561078433-941f8f2d7b89"],
  phoneAccessory: ["photo-1607936814486-8b594608603a", "photo-1601972602237-8c79241e468b", "photo-1572569511254-d8f925fe2cbb"],
  earbuds: ["photo-1590658268037-6bf12165a8df", "photo-1583394838336-acd977736f90", "photo-1606220588913-b3aacb4d2f46"],
  charger: ["photo-1583863788434-e58a36330cf0", "photo-1591290619762-c2b9bbef4f60"],
  powerbank: ["photo-1609592424823-91f4d2a3b95a", "photo-1606293459339-aa5d34a7b0e1"],
  laptop: ["photo-1496181133206-80ce9b88a853", "photo-1517336714731-489689fd1ca8", "photo-1498050108023-c5249f4df085", "photo-1484788984921-03950022c9ef"],
  macbook: ["photo-1517336714731-489689fd1ca8", "photo-1611186871348-b1ce696e52c9"],
  monitor: ["photo-1527443224154-c4a3942d3acf", "photo-1540814275-9f3e8c5d3b79"],
  keyboard: ["photo-1587829741301-dc798b83add3", "photo-1595044426077-d36d9236d54a"],
  mouse: ["photo-1527864550417-7fd91fc51a46", "photo-1615663249855-ec7b0d7d6f1b"],
  tv: ["photo-1593359677879-a4bb92f829d1", "photo-1461151304267-38535e780c79"],
  speaker: ["photo-1545454675-3531b543be5d", "photo-1608043152269-423dbba4e7e1"],
  headphones: ["photo-1505740420928-5e560c06d30e", "photo-1583394838336-acd977736f90", "photo-1484704849700-f032a568e944"],
  camera: ["photo-1502920917128-1aa500764cbd", "photo-1516035069371-29a1b244cc32"],
  mensShirt: ["photo-1576566588028-4147f3842f27", "photo-1602810318383-e386cc2a3ccf"],
  mensShoes: ["photo-1542291026-7eec264c27ff", "photo-1595950653106-6c9ebd614d3a"],
  womensDress: ["photo-1595777457583-95e059d581b8", "photo-1572804013309-59a88b7e92f1"],
  womensBag: ["photo-1584917865442-de89df76afd3", "photo-1591561954557-26941169b49e"],
  womensShoes: ["photo-1543163521-1bf3a327fe57", "photo-1535043934128-cf0b28d52f95"],
  sneakers: ["photo-1542291026-7eec264c27ff", "photo-1556906781-9a412961c28c", "photo-1595950653106-6c9ebd614d3a"],
  hoodie: ["photo-1556821840-3a63f95609a7", "photo-1620799140408-edc6dcb6d633"],
  jacket: ["photo-1591047139829-d91aecb6caea", "photo-1551028719-00167b16eac5"],
  sunglasses: ["photo-1572635196237-14b3f281503f", "photo-1577803645773-f96470509666"],
  kettle: ["photo-1517048676732-659acc648b9a", "photo-1606859822318-2ae9122c8c7f"],
  blender: ["photo-1570222094114-d054a817e56b", "photo-1585515320310-259814833e62"],
  airfryer: ["photo-1626806787461-102c1b86f924", "photo-1585442487324-91b4d60f3e88"],
  cooker: ["photo-1556909114-f6e7ad7d3136", "photo-1556911220-bff31c812dba"],
  refrigerator: ["photo-1571175443880-49e1d25b2bc5", "photo-1607990281513-084a1f3d3b8d"],
  microwave: ["photo-1574269909862-7e1d70bb8073", "photo-1585515320310-259814833e62"],
  vacuum: ["photo-1558317374-067fb5f30001", "photo-1581578731548-c64695cc6952"],
  skincare: ["photo-1556228720-195a672e8a03", "photo-1570194065650-d99fb4bedf0a"],
  lipstick: ["photo-1586495777744-4413f21062fa", "photo-1591361454773-e98c3ae73c68"],
  perfume: ["photo-1541643600914-78b084683601", "photo-1592945403244-b3fbafd7f539"],
  makeup: ["photo-1596462502278-27bfdc403348", "photo-1522338242992-e1a54906a8da"],
  dumbbell: ["photo-1571019613454-1cb2f99b2d8b", "photo-1583454110551-21f2fa2afe61"],
  yoga: ["photo-1518611012118-696072aa579a", "photo-1592432678016-e910b452d9d2"],
  football: ["photo-1614632537190-23e4146777db", "photo-1579952363873-27f3bade9f55"],
  basketball: ["photo-1546519638-68e10949833d", "photo-1574623450792-9ee7b5270d5d"],
  bloodpressure: ["photo-1631217868264-e5b90bb7e133", "photo-1576091160550-2173dba999ef"],
  thermometer: ["photo-1631217868264-e5b90bb7e133", "photo-1584515933487-779824d29309"],
  scale: ["photo-1576091160399-112ba8d25d1d", "photo-1512621776951-a57141f2eefd"],
  coffee: ["photo-1559056199-641a0ac8b55e", "photo-1447933601403-0c6688de566e"],
  juice: ["photo-1600271886742-f049cd451bba", "photo-1622597467836-f3285f2131b8"],
  cereal: ["photo-1517673132651-8dd5da8d5b8a", "photo-1602184167779-2d2f5b3b3a7a"],
  noodles: ["photo-1612929633738-8fe44f7ec841", "photo-1569718212165-3a8278d5f677"],
  book: ["photo-1544947950-fa07a98d237f", "photo-1512820790803-83ca734da794", "photo-1495446815901-a7297e633e8d"],
  ebook: ["photo-1592432678016-e910b452d9d2", "photo-1524995997946-a1c2e315a42f"],
  dashcam: ["photo-1583121274602-3e2823c6e7c9", "photo-1503376780353-7e6692767b70"],
  carcharger: ["photo-1601362840469-51e4d8d58785", "photo-1591290619762-c2b9bbef4f60"],
  tireinflator: ["photo-1632823469850-2f77dd9c7f93", "photo-1503376780353-7e6692767b70"],
  digitalTemplate: ["photo-1551288049-bebda4e38f71", "photo-1460925895917-afdab827c52f"],
  digitalCourse: ["photo-1516321318423-f06f85e504b3", "photo-1522202176988-66273c2fd55f"],
  softwareLicense: ["photo-1629654297299-c8506221ca97", "photo-1551288049-bebda4e38f71"],
  bannerElectronics: ["photo-1518770660439-4636190af475"],
  bannerFashion: ["photo-1483985988355-763728e1935b"],
  bannerDeals: ["photo-1607083206869-4c7672e72a8a"],
  bannerHome: ["photo-1556909114-f6e7ad7d3136"],
  bannerDigital: ["photo-1516321318423-f06f85e504b3"],
  storeLogo: ["photo-1523275335684-37898b6baf30", "photo-1445205170230-053b83016050", "photo-1491933382434-500287f9b54b"],
  brandLogo: ["photo-1523275335684-37898b6baf30", "photo-1445205170230-053b83016050", "photo-1491933382434-500287f9b54b"],
};

function img(key: string, seed: string, size = 800): string {
  const pool = IMG[key] ?? IMG.book;
  const id = pool[Math.abs(stableHash(seed)) % pool.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${size}&h=${size}&q=80`;
}
function bannerImg(key: string): string {
  const pool = IMG[key] ?? IMG.bannerElectronics;
  return `https://images.unsplash.com/${pool[0]}?auto=format&fit=crop&w=1200&h=400&q=80`;
}
function storeImg(seed: string): string {
  return `https://images.unsplash.com/${IMG.storeLogo[Math.abs(stableHash(seed)) % IMG.storeLogo.length]}?auto=format&fit=crop&w=400&h=400&q=80`;
}
function brandImg(seed: string): string {
  return `https://images.unsplash.com/${IMG.brandLogo[Math.abs(stableHash(seed)) % IMG.brandLogo.length]}?auto=format&fit=crop&w=400&h=400&q=80`;
}

// ============================================================
// DATA DEFINITIONS
// ============================================================

interface ProductSeed {
  name: string;
  price: number;
  img: string;
  brand: string; // slug
  cat: string; // category slug
  stock: number;
  digital?: boolean;
  digitalAsset?: { deliveryType: "DOWNLOAD" | "LICENSE_KEY" | "EXTERNAL_ACCESS"; name: string; fileUrl?: string; accessUrl?: string; licenseKey?: string; maxDownloads?: number; expiresAfterDays?: number };
  variants?: { type: string; values: string[] }[];
}

interface VendorSeed {
  email: string;
  firstName: string;
  lastName: string;
  storeName: string;
  storeSlug: string;
  description: string;
  category: string;
  city: string;
  stateCode: string;
  lgaName: string;
  primaryColor: string;
  accentColor: string;
  products: ProductSeed[];
}

const VENDORS: VendorSeed[] = [
  {
    email: "ade.okoye@example.com", firstName: "Ade", lastName: "Okoye",
    storeName: "AdeTech Electronics", storeSlug: "adetech-electronics",
    description: "Premium electronics store — smartphones, tablets, audio, and accessories from top brands. Lagos-based with nationwide delivery.",
    category: "Electronics", city: "Lagos", stateCode: "LA", lgaName: "Ikeja",
    primaryColor: "#071A2F", accentColor: "#F97316",
    products: [
      { name: "Samsung Galaxy A54 5G 128GB", price: 225000, img: "smartphone", brand: "samsung", cat: "smartphones", stock: 45 },
      { name: "Apple iPhone 15 128GB Blue", price: 780000, img: "iphone", brand: "apple", cat: "smartphones", stock: 18, variants: [{ type: "Storage", values: ["128GB", "256GB"] }] },
      { name: "Samsung Galaxy Tab A9+ 11-inch", price: 142000, img: "tablet", brand: "samsung", cat: "tablets", stock: 22 },
      { name: "Apple AirPods Pro 2nd Gen", price: 95000, img: "earbuds", brand: "apple", cat: "phone-accessories", stock: 60 },
      { name: "Anker PowerCore 20000mAh Power Bank", price: 18000, img: "powerbank", brand: "anker", cat: "phone-accessories", stock: 120 },
      { name: "Samsung 25W Fast Charger", price: 6500, img: "charger", brand: "samsung", cat: "phone-accessories", stock: 200 },
      { name: "Sony WH-1000XM5 Headphones", price: 185000, img: "headphones", brand: "sony", cat: "tvs-audio", stock: 15 },
      { name: "Samsung Sound Tower MX-T50", price: 95000, img: "speaker", brand: "samsung", cat: "tvs-audio", stock: 8 },
      { name: "Samsung 43-inch Crystal UHD Smart TV", price: 185000, img: "tv", brand: "samsung", cat: "tvs-audio", stock: 12 },
      { name: "Anker Wireless Charging Dock", price: 22000, img: "charger", brand: "anker", cat: "phone-accessories", stock: 4 },
      { name: "Logitech Wireless Mouse M331", price: 8500, img: "mouse", brand: "anker", cat: "computer-accessories", stock: 80 },
      { name: "Logitech Mechanical Keyboard", price: 32000, img: "keyboard", brand: "anker", cat: "computer-accessories", stock: 25 },
      { name: "Canon EOS M50 Mirrorless Camera", price: 320000, img: "camera", brand: "sony", cat: "cameras", stock: 6 },
      { name: "Samsung Galaxy S24 Ultra 256GB", price: 850000, img: "smartphone", brand: "samsung", cat: "smartphones", stock: 10, variants: [{ type: "Storage", values: ["256GB", "512GB"] }] },
      { name: "Tecno Camon 20 Premier 256GB", price: 235000, img: "smartphone", brand: "tecno", cat: "smartphones", stock: 30 },
    ],
  },
  {
    email: "bola.adeyemi@example.com", firstName: "Bola", lastName: "Adeyemi",
    storeName: "Bola Fashion House", storeSlug: "bola-fashion-house",
    description: "Trendy fashion for men and women — sneakers, dresses, shirts, and accessories. Quality fabrics, modern styles.",
    category: "Fashion", city: "Lagos", stateCode: "LA", lgaName: "Eti Osa",
    primaryColor: "#831843", accentColor: "#EC4899",
    products: [
      { name: "Nike Air Max 270 React Sneakers", price: 45000, img: "sneakers", brand: "nike", cat: "shoes", stock: 35, variants: [{ type: "Size", values: ["40", "41", "42", "43", "44"] }] },
      { name: "Adidas Ultraboost 23 Running Shoes", price: 52000, img: "sneakers", brand: "adidas", cat: "shoes", stock: 20, variants: [{ type: "Size", values: ["40", "41", "42", "43"] }] },
      { name: "Nike Dri-FIT Men's Training T-Shirt", price: 8500, img: "mensShirt", brand: "nike", cat: "mens-fashion", stock: 100, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Adidas Originals Trefoil Hoodie", price: 18000, img: "hoodie", brand: "adidas", cat: "mens-fashion", stock: 45, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Women's Ankara Midi Dress", price: 15000, img: "womensDress", brand: "gucci", cat: "womens-fashion", stock: 30, variants: [{ type: "Size", values: ["S", "M", "L"] }] },
      { name: "Leather Crossbody Bag", price: 28000, img: "womensBag", brand: "gucci", cat: "bags-accessories", stock: 18 },
      { name: "Women's Block Heel Pumps", price: 22000, img: "womensShoes", brand: "gucci", cat: "shoes", stock: 15, variants: [{ type: "Size", values: ["37", "38", "39", "40"] }] },
      { name: "Men's Casual Denim Jacket", price: 25000, img: "jacket", brand: "adidas", cat: "mens-fashion", stock: 28, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Polarized Sunglasses UV400", price: 8500, img: "sunglasses", brand: "gucci", cat: "bags-accessories", stock: 60 },
      { name: "Men's Leather Formal Shoes", price: 35000, img: "mensShoes", brand: "gucci", cat: "shoes", stock: 12, variants: [{ type: "Size", values: ["40", "41", "42", "43", "44"] }] },
      { name: "Women's Silk Evening Gown", price: 42000, img: "womensDress", brand: "gucci", cat: "womens-fashion", stock: 8 },
      { name: "Nike Sportswear Hoodie", price: 21000, img: "hoodie", brand: "nike", cat: "mens-fashion", stock: 3, variants: [{ type: "Size", values: ["M", "L", "XL"] }] },
      { name: "Designer Tote Bag", price: 38000, img: "womensBag", brand: "gucci", cat: "bags-accessories", stock: 10 },
    ],
  },
  {
    email: "chinedu.eze@example.com", firstName: "Chinedu", lastName: "Eze",
    storeName: "Naija Home Essentials", storeSlug: "naija-home-essentials",
    description: "Everything for your home and kitchen — appliances, cookware, and more. Quality products at affordable prices.",
    category: "Home & Kitchen", city: "Abuja", stateCode: "FC", lgaName: "Abuja",
    primaryColor: "#064E3B", accentColor: "#10B981",
    products: [
      { name: "Binatone 1.7L Electric Kettle", price: 8500, img: "kettle", brand: "binatone", cat: "appliances", stock: 80 },
      { name: "Oraimo SmartChef 5L Air Fryer", price: 25000, img: "airfryer", brand: "oraimo", cat: "appliances", stock: 35 },
      { name: "Binatone Blender 1.5L BLG-450", price: 12000, img: "blender", brand: "binatone", cat: "appliances", stock: 45 },
      { name: "Nexus 4-Burner Gas Cooker with Oven", price: 85000, img: "cooker", brand: "binatone", cat: "appliances", stock: 12 },
      { name: "Samsung 320L Bottom Mount Refrigerator", price: 210000, img: "refrigerator", brand: "samsung", cat: "appliances", stock: 8 },
      { name: "Samsung Microwave 20L Solo", price: 42000, img: "microwave", brand: "samsung", cat: "appliances", stock: 20 },
      { name: "Samsung Robot Vacuum Cleaner", price: 180000, img: "vacuum", brand: "samsung", cat: "appliances", stock: 6 },
      { name: "Non-Stick Cookware Set 10pc", price: 35000, img: "cooker", brand: "binatone", cat: "cookware", stock: 25 },
      { name: "Stainless Steel Dinner Set 16pc", price: 15000, img: "cooker", brand: "binatone", cat: "cookware", stock: 40 },
      { name: "Electric Coffee Maker 12-Cup", price: 28000, img: "kettle", brand: "binatone", cat: "appliances", stock: 15 },
      { name: "Oraimo Air Fryer 6L Family Size", price: 32000, img: "airfryer", brand: "oraimo", cat: "appliances", stock: 5 },
      { name: "Wooden Dining Table Set 6-Seater", price: 145000, img: "cooker", brand: "binatone", cat: "furniture", stock: 4 },
    ],
  },
  {
    email: "fatima.aliyu@example.com", firstName: "Fatima", lastName: "Aliyu",
    storeName: "Glow Beauty Hub", storeSlug: "glow-beauty-hub",
    description: "Authentic beauty products — skincare, makeup, hair care, and fragrances. Look and feel your best.",
    category: "Beauty", city: "Kano", stateCode: "KN", lgaName: "Kano Municipal",
    primaryColor: "#581C87", accentColor: "#A855F7",
    products: [
      { name: "Nivea Soft Moisturizing Cream 200ml", price: 3500, img: "skincare", brand: "oraimo", cat: "skincare", stock: 150 },
      { name: "L'Oreal Revitalift Day Cream 50ml", price: 15000, img: "skincare", brand: "oraimo", cat: "skincare", stock: 60 },
      { name: "Maybelline Fit Me Foundation 128", price: 5500, img: "makeup", brand: "oraimo", cat: "makeup", stock: 80 },
      { name: "MAC Matte Lipstick Set", price: 18000, img: "lipstick", brand: "oraimo", cat: "makeup", stock: 35 },
      { name: "Calvin Klein Eternity Perfume 100ml", price: 45000, img: "perfume", brand: "oraimo", cat: "makeup", stock: 18 },
      { name: "Vitamin C Face Serum 30ml", price: 8500, img: "skincare", brand: "oraimo", cat: "skincare", stock: 90 },
      { name: "Professional Makeup Brush Kit 12pc", price: 12000, img: "makeup", brand: "oraimo", cat: "makeup", stock: 45 },
      { name: "Argan Hair Care Oil 100ml", price: 6500, img: "skincare", brand: "oraimo", cat: "hair-care", stock: 70 },
      { name: "Setting Spray Makeup Lock 60ml", price: 7500, img: "makeup", brand: "oraimo", cat: "makeup", stock: 3 },
      { name: "Oraimo Electric Facial Cleansing Brush", price: 5500, img: "skincare", brand: "oraimo", cat: "skincare", stock: 55 },
    ],
  },
  {
    email: "tunde.ogundimu@example.com", firstName: "Tunde", lastName: "Ogundimu",
    storeName: "ProSports NG", storeSlug: "prosports-ng",
    description: "Sports and fitness gear for athletes — equipment, apparel, and accessories. Train hard, play harder.",
    category: "Sports", city: "Lagos", stateCode: "LA", lgaName: "Lagos Island",
    primaryColor: "#7C2D12", accentColor: "#F59E0B",
    products: [
      { name: "Adjustable Dumbbell Pair 20kg", price: 45000, img: "dumbbell", brand: "nike", cat: "fitness-equipment", stock: 25 },
      { name: "Pro Yoga Mat 6mm Thick", price: 8500, img: "yoga", brand: "adidas", cat: "fitness-equipment", stock: 80 },
      { name: "Official Football Size 5", price: 6500, img: "football", brand: "adidas", cat: "sportswear", stock: 120 },
      { name: "Spalding Basketball Official", price: 12000, img: "basketball", brand: "nike", cat: "sportswear", stock: 45 },
      { name: "Nike Running Shoes Pegasus 40", price: 55000, img: "sneakers", brand: "nike", cat: "sportswear", stock: 30, variants: [{ type: "Size", values: ["40", "41", "42", "43", "44"] }] },
      { name: "Resistance Bands Set 5pc", price: 5500, img: "yoga", brand: "adidas", cat: "fitness-equipment", stock: 100 },
      { name: "Adjustable Bench Press", price: 85000, img: "dumbbell", brand: "nike", cat: "fitness-equipment", stock: 8 },
      { name: "Adidas Training Shorts", price: 7500, img: "hoodie", brand: "adidas", cat: "sportswear", stock: 65, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
      { name: "Kettlebell 16kg Cast Iron", price: 18000, img: "dumbbell", brand: "nike", cat: "fitness-equipment", stock: 2 },
      { name: "Compression Training Tights", price: 15000, img: "hoodie", brand: "nike", cat: "sportswear", stock: 40, variants: [{ type: "Size", values: ["S", "M", "L", "XL"] }] },
    ],
  },
  {
    email: "grace.obi@example.com", firstName: "Grace", lastName: "Obi",
    storeName: "Knowledge Books", storeSlug: "knowledge-books",
    description: "Books, digital guides, and educational resources. From fiction to professional development.",
    category: "Books", city: "Port Harcourt", stateCode: "RI", lgaName: "Port Harcourt",
    primaryColor: "#1E3A8A", accentColor: "#3B82F6",
    products: [
      { name: "Think and Grow Rich Paperback", price: 3500, img: "book", brand: "samsung", cat: "fiction-books", stock: 50 },
      { name: "Rich Dad Poor Dad", price: 4000, img: "book", brand: "samsung", cat: "fiction-books", stock: 65 },
      { name: "Half of a Yellow Sun", price: 4500, img: "book", brand: "samsung", cat: "fiction-books", stock: 40 },
      { name: "Digital Marketing Mastery Ebook", price: 7500, img: "ebook", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Digital Marketing Mastery PDF", fileUrl: "https://example.com/kwikseller/digital-marketing-mastery.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Startup Playbook Digital Guide", price: 6500, img: "ebook", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Startup Playbook PDF", fileUrl: "https://example.com/kwikseller/startup-playbook.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Personal Finance Handbook", price: 5500, img: "book", brand: "samsung", cat: "fiction-books", stock: 35 },
      { name: "Children's Story Collection", price: 6500, img: "book", brand: "samsung", cat: "fiction-books", stock: 28 },
      { name: "JAMB Prep Textbook 2024", price: 8500, img: "book", brand: "samsung", cat: "fiction-books", stock: 90 },
      { name: "Web Development Course Ebook", price: 12000, img: "ebook", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Web Dev Course PDF", fileUrl: "https://example.com/kwikseller/web-dev-course.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "African Fiction Anthology", price: 5000, img: "book", brand: "samsung", cat: "fiction-books", stock: 22 },
    ],
  },
  {
    email: "yakubu.musa@example.com", firstName: "Yakubu", lastName: "Musa",
    storeName: "AutoParts Express", storeSlug: "autoparts-express",
    description: "Automotive accessories and tools — dash cams, chargers, inflators, and more for your vehicle.",
    category: "Automotive", city: "Kano", stateCode: "KN", lgaName: "Nassarawa",
    primaryColor: "#1F2937", accentColor: "#6B7280",
    products: [
      { name: "4K Dual Dash Camera", price: 35000, img: "dashcam", brand: "oraimo", cat: "electronics-accessories", stock: 30 },
      { name: "Dual USB Car Charger Fast Charge", price: 4500, img: "carcharger", brand: "anker", cat: "electronics-accessories", stock: 150 },
      { name: "Portable Tire Inflator 12V", price: 18000, img: "tireinflator", brand: "oraimo", cat: "electronics-accessories", stock: 25 },
      { name: "Wireless Car Phone Mount", price: 6500, img: "carcharger", brand: "oraimo", cat: "electronics-accessories", stock: 80 },
      { name: "Jump Starter Pack 2000A", price: 45000, img: "tireinflator", brand: "oraimo", cat: "electronics-accessories", stock: 12 },
      { name: "Car Vacuum Cleaner Portable", price: 12000, img: "tireinflator", brand: "oraimo", cat: "electronics-accessories", stock: 35 },
      { name: "Bluetooth FM Transmitter", price: 5500, img: "carcharger", brand: "anker", cat: "electronics-accessories", stock: 90 },
      { name: "360 Camera Car Security System", price: 85000, img: "dashcam", brand: "oraimo", cat: "electronics-accessories", stock: 4 },
      { name: "OBD2 Scanner Diagnostic Tool", price: 22000, img: "dashcam", brand: "oraimo", cat: "electronics-accessories", stock: 18 },
      { name: "Car Seat Leather Cushion Set", price: 28000, img: "carcharger", brand: "oraimo", cat: "electronics-accessories", stock: 15 },
    ],
  },
  {
    email: "aisha.mohammed@example.com", firstName: "Aisha", lastName: "Mohammed",
    storeName: "Wellness Pharmacy", storeSlug: "wellness-pharmacy",
    description: "Health and wellness devices — monitors, thermometers, and fitness trackers. Your health, our priority.",
    category: "Health", city: "Abuja", stateCode: "FC", lgaName: "Abuja",
    primaryColor: "#065F46", accentColor: "#34D399",
    products: [
      { name: "Samsung BP Monitor Upper Arm", price: 32000, img: "bloodpressure", brand: "samsung", cat: "health-monitors", stock: 40 },
      { name: "Omron Nebulizer NE-C28", price: 25000, img: "bloodpressure", brand: "samsung", cat: "wellness-devices", stock: 20 },
      { name: "Oraimo Pulse Oximeter", price: 4500, img: "thermometer", brand: "oraimo", cat: "health-monitors", stock: 85 },
      { name: "Infrared Thermometer TH-600", price: 12000, img: "thermometer", brand: "samsung", cat: "health-monitors", stock: 55 },
      { name: "Oraimo Smart Scale OCD-S21", price: 15000, img: "scale", brand: "oraimo", cat: "wellness-devices", stock: 45 },
      { name: "Infinix Smartband 6 Fitness Tracker", price: 18000, img: "scale", brand: "infinix", cat: "wellness-devices", stock: 30 },
      { name: "Digital Thermometer Flexible Tip", price: 3500, img: "thermometer", brand: "samsung", cat: "health-monitors", stock: 100 },
      { name: "Oraimo Smart Body Fat Scale", price: 12000, img: "scale", brand: "oraimo", cat: "wellness-devices", stock: 35 },
      { name: "First Aid Kit Home 100pc", price: 8500, img: "bloodpressure", brand: "samsung", cat: "wellness-devices", stock: 60 },
      { name: "Blood Glucose Monitor Kit", price: 15000, img: "bloodpressure", brand: "samsung", cat: "health-monitors", stock: 3 },
    ],
  },
  {
    email: "emeka.odi@example.com", firstName: "Emeka", lastName: "Odi",
    storeName: "FreshMart Foods", storeSlug: "freshmart-foods",
    description: "Fresh food, beverages, and grocery staples delivered to your door. Quality you can taste.",
    category: "Food", city: "Lagos", stateCode: "LA", lgaName: "Surulere",
    primaryColor: "#92400E", accentColor: "#FBBF24",
    products: [
      { name: "Nestle Milo 400g", price: 3200, img: "cereal", brand: "samsung", cat: "beverages", stock: 200 },
      { name: "Chi Exotic Fruit Juice 1L", price: 1500, img: "juice", brand: "samsung", cat: "beverages", stock: 150 },
      { name: "Premium Coffee Beans 500g", price: 6500, img: "coffee", brand: "samsung", cat: "beverages", stock: 80 },
      { name: "Indomie Noodles Carton 40pc", price: 9500, img: "noodles", brand: "samsung", cat: "staples", stock: 100 },
      { name: "Peak Milk Powder 900g", price: 7500, img: "cereal", brand: "samsung", cat: "staples", stock: 90 },
      { name: "Breakfast Cereal Pack 500g", price: 4200, img: "cereal", brand: "samsung", cat: "staples", stock: 120 },
      { name: "Honeywell Wheat Meal 2kg", price: 2200, img: "cereal", brand: "samsung", cat: "staples", stock: 110 },
      { name: "Dangote Sugar 1kg", price: 1800, img: "cereal", brand: "samsung", cat: "staples", stock: 180 },
      { name: "Herbal Tea Set 3-Flavour", price: 5500, img: "coffee", brand: "samsung", cat: "beverages", stock: 45 },
      { name: "Organic Honey 500ml", price: 4500, img: "cereal", brand: "samsung", cat: "staples", stock: 5 },
    ],
  },
  {
    email: "layla.hassan@example.com", firstName: "Layla", lastName: "Hassan",
    storeName: "Digital Downloads Co", storeSlug: "digital-downloads-co",
    description: "Premium digital products — design templates, online courses, software licenses, and ebooks. Instant delivery.",
    category: "Digital", city: "Lagos", stateCode: "LA", lgaName: "Ikeja",
    primaryColor: "#0F172A", accentColor: "#06B6D4",
    products: [
      { name: "Business Plan Template Pro", price: 7500, img: "digitalTemplate", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Business Plan Template", fileUrl: "https://example.com/kwikseller/business-plan-template.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Social Media Marketing Course", price: 25000, img: "digitalCourse", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "EXTERNAL_ACCESS", name: "Course Access Link", accessUrl: "https://learn.kwikseller.example.com/social-media-marketing", expiresAfterDays: 365 } },
      { name: "Adobe Creative Cloud License 1yr", price: 180000, img: "softwareLicense", brand: "samsung", cat: "software-licenses", stock: 0, digital: true, digitalAsset: { deliveryType: "LICENSE_KEY", name: "Adobe CC License Key", licenseKey: "ADOBE-CC-2024-KWIK-001", expiresAfterDays: 365 } },
      { name: "Resume Design Template Bundle", price: 5500, img: "digitalTemplate", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Resume Templates ZIP", fileUrl: "https://example.com/kwikseller/resume-templates.zip", maxDownloads: 10, expiresAfterDays: 90 } },
      { name: "Web Design Masterclass", price: 35000, img: "digitalCourse", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "EXTERNAL_ACCESS", name: "Masterclass Access", accessUrl: "https://learn.kwikseller.example.com/web-design", expiresAfterDays: 365 } },
      { name: "Microsoft Office 365 License", price: 45000, img: "softwareLicense", brand: "samsung", cat: "software-licenses", stock: 0, digital: true, digitalAsset: { deliveryType: "LICENSE_KEY", name: "MS Office 365 Key", licenseKey: "MS-O365-2024-KWIK-001", expiresAfterDays: 365 } },
      { name: "Financial Modeling Excel Pack", price: 8500, img: "digitalTemplate", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Financial Models XLSX", fileUrl: "https://example.com/kwikseller/financial-models.xlsx", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Photography Editing Course", price: 18000, img: "digitalCourse", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "EXTERNAL_ACCESS", name: "Photo Editing Course", accessUrl: "https://learn.kwikseller.example.com/photo-editing", expiresAfterDays: 180 } },
      { name: "SEO Optimization Guide Ebook", price: 6500, img: "ebook", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "SEO Guide PDF", fileUrl: "https://example.com/kwikseller/seo-guide.pdf", maxDownloads: 5, expiresAfterDays: 30 } },
      { name: "Premium Icon Pack 500+", price: 4500, img: "digitalTemplate", brand: "samsung", cat: "digital-guides", stock: 0, digital: true, digitalAsset: { deliveryType: "DOWNLOAD", name: "Icon Pack ZIP", fileUrl: "https://example.com/kwikseller/icon-pack.zip", maxDownloads: 10, expiresAfterDays: 90 } },
    ],
  },
];

const CUSTOMERS = [
  { email: "chidi.okeke@example.com", firstName: "Chidi", lastName: "Okeke", phone: "+2348012345678", city: "Lagos", stateCode: "LA", lgaName: "Ikeja", line1: "12 Allen Avenue, Ikeja" },
  { email: "ngozi.eze@example.com", firstName: "Ngozi", lastName: "Eze", phone: "+2348023456789", city: "Abuja", stateCode: "FC", lgaName: "Abuja", line1: "45 Wuse 2 Crescent, Abuja" },
  { email: "emeka.nwosu@example.com", firstName: "Emeka", lastName: "Nwosu", phone: "+2348034567890", city: "Port Harcourt", stateCode: "RI", lgaName: "Port Harcourt", line1: "78 Aba Road, Port Harcourt" },
  { email: "fatima.yusuf@example.com", firstName: "Fatima", lastName: "Yusuf", phone: "+2348045678901", city: "Kano", stateCode: "KN", lgaName: "Kano Municipal", line1: "23 Ahmadu Bello Way, Kano" },
  { email: "tope.adebayo@example.com", firstName: "Tope", lastName: "Adebayo", phone: "+2348056789012", city: "Lagos", stateCode: "LA", lgaName: "Eti Osa", line1: "90 Admiralty Way, Lekki" },
  { email: "aisha.ibrahim@example.com", firstName: "Aisha", lastName: "Ibrahim", phone: "+2348067890123", city: "Abuja", stateCode: "FC", lgaName: "Abuja", line1: "15 Garki Area 3, Abuja" },
  { email: "kunle.ogundimu@example.com", firstName: "Kunle", lastName: "Ogundimu", phone: "+2348078901234", city: "Ibadan", stateCode: "OY", lgaName: "Ibadan North", line1: "5 Bodija Road, Ibadan" },
  { email: "zainab.musa@example.com", firstName: "Zainab", lastName: "Musa", phone: "+2348089012345", city: "Lagos", stateCode: "LA", lgaName: "Lagos Island", line1: "30 Broad Street, Lagos Island" },
];

const BRANDS = [
  { name: "Samsung", slug: "samsung" },
  { name: "Apple", slug: "apple" },
  { name: "Tecno", slug: "tecno" },
  { name: "Infinix", slug: "infinix" },
  { name: "Oraimo", slug: "oraimo" },
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "Gucci", slug: "gucci" },
  { name: "HP", slug: "hp" },
  { name: "Lenovo", slug: "lenovo" },
  { name: "Sony", slug: "sony" },
  { name: "Binatone", slug: "binatone" },
  { name: "Anker", slug: "anker" },
];

const CATEGORIES: { name: string; slug: string; icon: string; parent?: string }[] = [
  { name: "Electronics", slug: "electronics", icon: "Zap" },
  { name: "Phones & Tablets", slug: "phones-tablets", icon: "Smartphone" },
  { name: "Computers", slug: "computers", icon: "Laptop" },
  { name: "Fashion", slug: "fashion", icon: "Shirt" },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "Home" },
  { name: "Beauty", slug: "beauty", icon: "Sparkles" },
  { name: "Sports & Fitness", slug: "sports-fitness", icon: "Dumbbell" },
  { name: "Health & Wellness", slug: "health-wellness", icon: "Heart" },
  { name: "Food & Drinks", slug: "food-drinks", icon: "Utensils" },
  { name: "Books & Digital", slug: "books-digital", icon: "BookOpen" },
  // children
  { name: "TVs & Audio", slug: "tvs-audio", icon: "Tv", parent: "electronics" },
  { name: "Cameras", slug: "cameras", icon: "Camera", parent: "electronics" },
  { name: "Electronics Accessories", slug: "electronics-accessories", icon: "Plug", parent: "electronics" },
  { name: "Smartphones", slug: "smartphones", icon: "Smartphone", parent: "phones-tablets" },
  { name: "Tablets", slug: "tablets", icon: "Tablet", parent: "phones-tablets" },
  { name: "Phone Accessories", slug: "phone-accessories", icon: "Cable", parent: "phones-tablets" },
  { name: "Laptops", slug: "laptops", icon: "Laptop", parent: "computers" },
  { name: "Desktops", slug: "desktops", icon: "Monitor", parent: "computers" },
  { name: "Computer Accessories", slug: "computer-accessories", icon: "Keyboard", parent: "computers" },
  { name: "Men's Fashion", slug: "mens-fashion", icon: "User", parent: "fashion" },
  { name: "Women's Fashion", slug: "womens-fashion", icon: "User", parent: "fashion" },
  { name: "Shoes", slug: "shoes", icon: "Footprints", parent: "fashion" },
  { name: "Bags & Accessories", slug: "bags-accessories", icon: "ShoppingBag", parent: "fashion" },
  { name: "Appliances", slug: "appliances", icon: "Microwave", parent: "home-kitchen" },
  { name: "Cookware", slug: "cookware", icon: "CookingPot", parent: "home-kitchen" },
  { name: "Furniture", slug: "furniture", icon: "Sofa", parent: "home-kitchen" },
  { name: "Skincare", slug: "skincare", icon: "Droplet", parent: "beauty" },
  { name: "Hair Care", slug: "hair-care", icon: "Scissors", parent: "beauty" },
  { name: "Makeup", slug: "makeup", icon: "Palette", parent: "beauty" },
  { name: "Fitness Equipment", slug: "fitness-equipment", icon: "Dumbbell", parent: "sports-fitness" },
  { name: "Sportswear", slug: "sportswear", icon: "Shirt", parent: "sports-fitness" },
  { name: "Health Monitors", slug: "health-monitors", icon: "Activity", parent: "health-wellness" },
  { name: "Wellness Devices", slug: "wellness-devices", icon: "HeartPulse", parent: "health-wellness" },
  { name: "Beverages", slug: "beverages", icon: "Coffee", parent: "food-drinks" },
  { name: "Staples", slug: "staples", icon: "Wheat", parent: "food-drinks" },
  { name: "Fiction Books", slug: "fiction-books", icon: "Book", parent: "books-digital" },
  { name: "Digital Guides", slug: "digital-guides", icon: "FileText", parent: "books-digital" },
  { name: "Software Licenses", slug: "software-licenses", icon: "Key", parent: "books-digital" },
];

// ============================================================
// MAIN
// ============================================================
async function main() {
  assertDevOnly();
  console.log("🌱 Starting Kwikseller realistic marketplace seed...\n");

  // ── 1. Nigerian states & LGAs (reference data, upsert) ──
  console.log("📍 Seeding Nigerian states & LGAs...");
  const lgaRows = loadNigeriaLocations();
  const statesByCode = new Map<string, { code: string; name: string; lgas: string[] }>();
  for (const row of lgaRows) {
    const code = row.state_code.toUpperCase();
    const name = row.state_name.toUpperCase() === "FCT" ? "Federal Capital Territory" : `${row.state_name} State`;
    const existing = statesByCode.get(code) ?? { code, name, lgas: [] };
    existing.lgas.push(row.name);
    statesByCode.set(code, existing);
  }
  for (const s of statesByCode.values()) {
    await db.state.upsert({ where: { code: s.code }, update: { name: s.name, isActive: true }, create: { code: s.code, name: s.name, isActive: true } });
    const state = await db.state.findUnique({ where: { code: s.code } });
    for (const lgaName of s.lgas) {
      await db.localGovernment.upsert({ where: { stateId_name: { stateId: state.id, name: lgaName } }, update: { isActive: true }, create: { stateId: state.id, name: lgaName, isActive: true } });
    }
  }
  console.log(`   ✅ ${statesByCode.size} states + LGAs\n`);

  // ── 2. System configs, platform settings, milestones, currencies ──
  console.log("⚙️  Seeding reference configs...");
  for (const c of [
    { key: "platform_fee_percent", value: "1" },
    { key: "min_withdrawal_amount", value: "1000" },
    { key: "delivery_fee_base", value: "500" },
    { key: "max_products_starter", value: "10" },
    { key: "max_products_growth", value: "50" },
    { key: "max_products_pro", value: "200" },
    { key: "max_products_scale", value: "1000" },
    { key: "kwikcoins_per_referral", value: "100" },
    { key: "otp_expiry_minutes", value: "10" },
    { key: "password_reset_expiry_minutes", value: "15" },
  ]) {
    await db.systemConfig.upsert({ where: { key: c.key }, update: { value: c.value }, create: c });
  }
  await db.platformSetting.upsert({ where: { key: "processing_fee_percent" }, update: { value: "1", description: "Platform processing fee on order subtotal" }, create: { key: "processing_fee_percent", value: "1", description: "Platform processing fee on order subtotal" } });

  for (const m of [
    { key: "first_product", name: "First Product Listed", description: "List your first product", coinsAwarded: 50, isRepeatable: false },
    { key: "first_sale", name: "First Sale", description: "Complete your first sale", coinsAwarded: 100, isRepeatable: false },
    { key: "sales_10", name: "10 Sales Milestone", description: "Complete 10 sales", coinsAwarded: 200, isRepeatable: false },
    { key: "sales_50", name: "50 Sales Milestone", description: "Complete 50 sales", coinsAwarded: 500, isRepeatable: false },
    { key: "sales_100", name: "100 Sales Milestone", description: "Complete 100 sales", coinsAwarded: 1000, isRepeatable: false },
    { key: "store_verified", name: "Store Verified", description: "Get your store verified", coinsAwarded: 200, isRepeatable: false },
  ]) {
    await db.milestone.upsert({ where: { key: m.key }, update: m, create: m });
  }

  for (const curr of [
    { name: "Nigerian Naira", code: "NGN", symbol: "₦", exchangeRate: 1, isDefault: true, isActive: true },
    { name: "US Dollar", code: "USD", symbol: "$", exchangeRate: 1580, isDefault: false, isActive: true },
  ]) {
    await db.currency.upsert({ where: { code: curr.code }, update: curr, create: curr });
  }

  // Delivery rates for major LGAs
  for (const r of [
    { state: "Lagos State", localGovernment: "Ikeja", fee: 1500, minDeliveryDays: 1, maxDeliveryDays: 3 },
    { state: "Lagos State", localGovernment: "Eti Osa", fee: 2200, minDeliveryDays: 2, maxDeliveryDays: 4 },
    { state: "Lagos State", localGovernment: "Lagos Island", fee: 2500, minDeliveryDays: 2, maxDeliveryDays: 4 },
    { state: "Lagos State", localGovernment: "Surulere", fee: 1800, minDeliveryDays: 1, maxDeliveryDays: 3 },
    { state: "Federal Capital Territory", localGovernment: "Abuja", fee: 3000, minDeliveryDays: 3, maxDeliveryDays: 5 },
    { state: "Rivers State", localGovernment: "Port Harcourt", fee: 3500, minDeliveryDays: 3, maxDeliveryDays: 6 },
    { state: "Kano State", localGovernment: "Kano Municipal", fee: 4000, minDeliveryDays: 4, maxDeliveryDays: 7 },
    { state: "Oyo State", localGovernment: "Ibadan North", fee: 2800, minDeliveryDays: 2, maxDeliveryDays: 5 },
  ]) {
    await db.deliveryRate.upsert({ where: { state_localGovernment: { state: r.state, localGovernment: r.localGovernment } }, update: r, create: { ...r, isActive: true } });
  }
  console.log("   ✅ Configs, milestones, currencies, delivery rates\n");

  // ── 3. FK-SAFE CLEANUP (children → parents) ──
  console.log("🧹 Cleaning existing marketplace data...");
  const cleanupOrder = [
    "walletTransaction", "withdrawal", "commission", "escrow", "quoteRevision", "quote",
    "delivery", "fulfillment", "paymentWebhookEvent", "payment", "inventoryReservation",
    "orderItem", "order", "parentCheckout", "review", "productQuestion", "wishlist",
    "cartItem", "cart", "notification", "pushSubscription", "dealProduct", "deal",
    "couponProduct", "couponCategory", "coupon", "banner", "productMedia",
    "productDeliveryZone", "productDeliveryOverride", "productAttribute", "productDimension",
    "productSeo", "productTag", "relatedProduct", "digitalAsset", "inventoryItem",
    "productVariant", "variantValue", "variantType", "product", "storeDeliveryArea",
    "storeDeliveryZone", "storeDeliverySetting", "storefrontDesign", "store",
    "category", "brand", "kwikCoins", "coinTransaction", "subscription", "vendorMilestone",
    "referral", "rider", "wallet", "adminPermission", "user",
    "adCampaign", "adImpression", "poolSettlement", "vendorPoolOffer", "poolCampaign", "poolProduct",
  ];
  for (const model of cleanupOrder) {
    try { await db[model]?.deleteMany(); } catch { /* model may not exist */ }
  }
  try { await db.auditLog?.deleteMany(); } catch {}
  console.log("   ✅ All marketplace data cleared\n");

  // ── 4. Categories (parent + child) ──
  console.log("📂 Creating categories...");
  const categoryMap: Record<string, string> = {};
  // Parents first
  for (const c of CATEGORIES.filter((c) => !c.parent)) {
    const cat = await prisma.category.create({ data: { name: c.name, slug: c.slug, icon: c.icon, imageUrl: img(c.slug, c.name), isActive: true, position: CATEGORIES.indexOf(c) + 1 } });
    categoryMap[c.slug] = cat.id;
  }
  // Children
  for (const c of CATEGORIES.filter((c) => c.parent)) {
    const cat = await prisma.category.create({ data: { name: c.name, slug: c.slug, icon: c.icon, imageUrl: img(c.slug, c.name), isActive: true, parentId: categoryMap[c.parent!] } });
    categoryMap[c.slug] = cat.id;
  }
  console.log(`   ✅ ${CATEGORIES.length} categories (${CATEGORIES.filter((c) => !c.parent).length} parents + ${CATEGORIES.filter((c) => c.parent).length} children)\n`);

  // ── 5. Brands ──
  console.log("🏷️  Creating brands...");
  const brandMap: Record<string, string> = {};
  for (const b of BRANDS) {
    const brand = await prisma.brand.create({ data: { name: b.name, slug: b.slug, image: brandImg(b.name), status: true } });
    brandMap[b.slug] = brand.id;
  }
  console.log(`   ✅ ${BRANDS.length} brands\n`);

  // ── 6. Super Admin + Admin ──
  console.log("👤 Creating admins...");
  const superAdminHash = await bcrypt.hash(PWD.superAdmin, 12);
  const adminHash = await bcrypt.hash(PWD.admin, 12);

  await prisma.user.create({
    data: { email: "superadmin@example.com", passwordHash: superAdminHash, role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, emailVerified: true, profile: { create: { firstName: "Super", lastName: "Admin" } }, adminPermission: { create: { role: AdminRole.SUPER_ADMIN, permissions: "*", grantedBy: "system", isActive: true } } },
  });
  await prisma.user.create({
    data: { email: "admin@example.com", passwordHash: adminHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE, emailVerified: true, profile: { create: { firstName: "Admin", lastName: "User" } }, adminPermission: { create: { role: AdminRole.SUPER_ADMIN, permissions: "*", grantedBy: "system", isActive: true } } },
  });
  console.log("   ✅ Super Admin + Admin created\n");

  // ── 7. Customers ──
  console.log("👥 Creating customers...");
  const customerIds: string[] = [];
  const customerHash = await bcrypt.hash(PWD.customer, 12);
  const customerAddresses: Record<string, { id: string; line1: string; city: string }[]> = {};

  for (const c of CUSTOMERS) {
    const state = await db.state.findUnique({ where: { code: c.stateCode } });
    const lga = state ? await db.localGovernment.findFirst({ where: { stateId: state.id, name: c.lgaName } }) : null;
    const user = await prisma.user.create({
      data: {
        email: c.email, phone: c.phone, passwordHash: customerHash, role: UserRole.BUYER, status: UserStatus.ACTIVE, emailVerified: true,
        profile: { create: { firstName: c.firstName, lastName: c.lastName } },
        addresses: { create: [{ line1: c.line1, city: c.city, stateId: state?.id, lgaId: lga?.id, country: "Nigeria", isDefault: true, type: "SHIPPING" }] },
      },
      include: { addresses: true },
    });
    customerIds.push(user.id);
    customerAddresses[user.id] = user.addresses.map((a) => ({ id: a.id, line1: a.line1, city: a.city }));
  }
  console.log(`   ✅ ${CUSTOMERS.length} customers created\n`);

  // ── 8. Vendors + Stores + Wallets ──
  console.log("🏪 Creating vendors & stores...");
  const vendorHash = await bcrypt.hash(PWD.vendor, 12);
  const vendorInfo: { userId: string; storeId: string; storeSlug: string; storeName: string }[] = [];

  for (let vi = 0; vi < VENDORS.length; vi++) {
    const v = VENDORS[vi];
    const state = await db.state.findUnique({ where: { code: v.stateCode } });
    const lga = state ? await db.localGovernment.findFirst({ where: { stateId: state.id, name: v.lgaName } }) : null;

    const openingBalance = vi < 3 ? [250000, 125000, 85000][vi] : vi < 5 ? 45000 : 0;

    const user = await prisma.user.create({
      data: {
        email: v.email, phone: `+234700000${String(vi + 1).padStart(3, "0")}`, passwordHash: vendorHash, role: UserRole.VENDOR, status: UserStatus.ACTIVE, emailVerified: true,
        profile: { create: { firstName: v.firstName, lastName: v.lastName, bio: v.description } },
        store: {
          create: {
            name: v.storeName, slug: v.storeSlug, description: v.description, logoUrl: storeImg(v.storeName), bannerUrl: bannerImg(`banner${vi % 2 === 0 ? "Electronics" : "Fashion"}`),
            category: v.category, isVerified: true, onboardingComplete: true, onboardingStep: "COMPLETED", verificationStatus: "APPROVED", deliverySetupComplete: true,
            bankCode: "057", bankName: "Zenith Bank", accountNumber: String(1000000000 + vi * 1111111111).slice(0, 10), accountName: `${v.firstName} ${v.lastName}`,
            storefrontDesign: { create: { primaryColor: v.primaryColor, accentColor: v.accentColor, heroTitle: v.storeName, heroSubtitle: v.description, sections: JSON.stringify(["hero", "products", "policies"]) } },
            deliverySetting: { create: { manualDeliveryEnabled: true, kwiksellerDeliveryEnabled: false, processingDays: 1, dispatchNote: "Orders processed within 24 hours.", returnPolicy: "7-day return policy for unused items in original packaging." } },
          },
        },
        subscription: { create: { plan: "SCALE", status: "ACTIVE", startDate: new Date(), endDate: daysAhead(365), productLimit: 1000, autoRenew: false } },
        kwikCoins: { create: { balance: 1000 + vi * 500, totalEarned: 1000 + vi * 500 } },
        wallet: { create: { availableBalance: openingBalance, pendingBalance: 0, totalEarned: openingBalance, totalWithdrawn: 0 } },
      },
      include: { store: true, wallet: true },
    });

    const storeId = user.store!.id;
    const walletId = user.wallet!.id;

    // Store delivery areas
    const deliverySetting = await db.storeDeliverySetting.findUnique({ where: { storeId } });
    if (deliverySetting) {
      for (const area of [
        { state: "Lagos State", localGovernment: "Ikeja", fee: 1500, minDeliveryDays: 1, maxDeliveryDays: 3 },
        { state: "Lagos State", localGovernment: "Eti Osa", fee: 2200, minDeliveryDays: 2, maxDeliveryDays: 4 },
        { state: "Federal Capital Territory", localGovernment: "Abuja", fee: 3000, minDeliveryDays: 3, maxDeliveryDays: 5 },
        { state: "Rivers State", localGovernment: "Port Harcourt", fee: 3500, minDeliveryDays: 3, maxDeliveryDays: 6 },
      ]) {
        await db.storeDeliveryArea.create({ data: { settingId: deliverySetting.id, ...area, isActive: true } });
      }
      // Store delivery zones (link to State/LGA)
      const zoneSpecs = [
        { stateCode: "LA", lgaName: "Ikeja", fee: 1500 },
        { stateCode: "LA", lgaName: "Eti Osa", fee: 2200 },
        { stateCode: "FC", lgaName: "Abuja", fee: 3000 },
        { stateCode: "RI", lgaName: "Port Harcourt", fee: 3500 },
      ];
      for (const z of zoneSpecs) {
        const zState = await db.state.findUnique({ where: { code: z.stateCode } });
        const zLga = zState ? await db.localGovernment.findFirst({ where: { stateId: zState.id, name: z.lgaName } }) : null;
        if (zState && zLga) {
          await db.storeDeliveryZone.create({ data: { storeId, stateId: zState.id, lgaId: zLga.id, fee: z.fee, minDeliveryDays: 1, maxDeliveryDays: 5, isActive: true } });
        }
      }
    }

    // Opening balance wallet transaction (if balance > 0)
    if (openingBalance > 0) {
      await db.walletTransaction.create({
        data: { walletId, vendorId: user.id, type: "OPENING_BALANCE", amount: openingBalance, balanceAfter: openingBalance, reference: `OPENING-${user.id.slice(-8)}`, reason: "Opening balance from prior sales", createdBy: "system" },
      });
    }

    vendorInfo.push({ userId: user.id, storeId, storeSlug: v.storeSlug, storeName: v.storeName });
  }
  console.log(`   ✅ ${VENDORS.length} vendors + stores + wallets created\n`);

  // ── 9. Rider ──
  console.log("🚴 Creating rider...");
  const riderHash = await bcrypt.hash(PWD.rider, 12);
  const riderUser = await prisma.user.create({
    data: {
      email: "rider@kwikseller.com", phone: "+2348090000001", passwordHash: riderHash, role: UserRole.RIDER, status: UserStatus.ACTIVE, emailVerified: true,
      profile: { create: { firstName: "Rider", lastName: "One" } },
      rider: { create: { vehicleBrand: "Toyota", vehicleModel: "Camry", vehicleYear: 2020, vehicleColor: "Silver", licenseNumber: "LAG-12345", isAvailable: true, onboardingComplete: true, onboardingStep: "COMPLETED", verificationStatus: "APPROVED", rating: 4.8, totalDeliveries: 45, totalEarnings: 85000 } },
    },
  });
  console.log("   ✅ Rider created\n");

  // ── 10. Products ──
  console.log("🛍️  Creating products...");
  let productIdx = 1;
  const allProducts: { id: string; name: string; price: number; mainImage: string; storeId: string; vendorIdx: number; isDigital: boolean; categoryId: string; brandId: string; stock: number }[] = [];

  for (let vi = 0; vi < VENDORS.length; vi++) {
    const v = VENDORS[vi];
    const { storeId } = vendorInfo[vi];

    for (const ps of v.products) {
      const slug = `${slugify(ps.name)}-${randSuffix()}`;
      const sku = makeSku(`V${vi + 1}`, productIdx);
      const comparePrice = Math.round(ps.price * 1.15);
      const isDigital = ps.digital ?? false;
      const mainImg = img(ps.img, ps.name);
      const product = await prisma.product.create({
        data: {
          storeId, name: ps.name, slug,
          shortDescription: `${ps.name} — quality product available on Kwikseller.`,
          description: `<h2>${ps.name}</h2><p>Premium quality product from a verified Kwikseller vendor. Ships from Nigeria with secure escrow-protected payment.</p><ul><li>Quality checked and verified.</li><li>Secure checkout with Kwikscrow escrow protection.</li><li>Fast delivery from ${v.city}.</li></ul>`,
          price: ps.price, comparePrice, sku, barcode: sku.padEnd(12, "0").slice(0, 12),
          productType: isDigital ? "DIGITAL" : "PHYSICAL", productSource: "VENDOR_STOCK",
          inventoryPolicy: isDigital ? "UNLIMITED" : "TRACKED", requiresShipping: !isDigital, trackInventory: !isDigital,
          stock: ps.stock, lowStock: 5, minOrderQuantity: 1, maxOrderQuantity: isDigital ? 1 : Math.min(ps.stock, 25),
          condition: "NEW", status: ProductStatus.ACTIVE, categoryId: categoryMap[ps.cat], brandId: brandMap[ps.brand],
          isFeatured: productIdx % 7 === 0, weight: isDigital ? null : Number((0.3 + (ps.price % 5000) / 10000).toFixed(2)),
          images: {
            create: [
              { url: mainImg, alt: ps.name, position: 0, isMain: true },
              { url: img(ps.img, ps.name + "-2"), alt: `${ps.name} view 2`, position: 1, isMain: false },
              { url: img(ps.img, ps.name + "-3"), alt: `${ps.name} view 3`, position: 2, isMain: false },
            ],
          },
          ...(isDigital ? {} : { inventoryItems: { create: { storeId, sku, available: ps.stock, reserved: 0, lowStockThreshold: 5, policy: "TRACKED" } } }),
          dimension: isDigital ? undefined : { create: { weight: Number((0.5 + (ps.price % 3000) / 6000).toFixed(2)), length: 20, width: 15, height: 8 } },
          seo: { create: { metaTitle: `${ps.name} | Kwikseller`, metaDescription: `Buy ${ps.name} on Kwikseller.`, metaKeywords: `${ps.name}, Kwikseller, Nigeria` } },
          ...(ps.digitalAsset ? { digitalAssets: { create: ps.digitalAsset } } : {}),
        },
      });

      // Variants
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

      allProducts.push({ id: product.id, name: ps.name, price: ps.price, mainImage: mainImg, storeId, vendorIdx: vi, isDigital, categoryId: categoryMap[ps.cat], brandId: brandMap[ps.brand], stock: ps.stock });
      productIdx++;
    }
  }
  console.log(`   ✅ ${allProducts.length} products created with matched images\n`);

  // ── 11. Banners ──
  console.log("🖼️  Creating banners...");
  for (const b of [
    { title: "Tech Mega Sale", subTitle: "Up to 20% off top electronics", image: bannerImg("bannerElectronics"), url: "/categories/electronics", bannerType: "MAIN_BANNER", backgroundColor: "#F97316", buttonText: "Shop Tech", position: 1 },
    { title: "Fashion Week Collection", subTitle: "Latest trends in Nigerian fashion", image: bannerImg("bannerFashion"), url: "/categories/fashion", bannerType: "MAIN_BANNER", backgroundColor: "#EC4899", buttonText: "Explore Fashion", position: 2 },
    { title: "Flash Deals This Week", subTitle: "Limited time offers on gadgets", image: bannerImg("bannerDeals"), url: "/deals", bannerType: "PROMO_BANNER", backgroundColor: "#10B981", buttonText: "View Deals", position: 3 },
    { title: "Home Makeover Sale", subTitle: "Transform your space today", image: bannerImg("bannerHome"), url: "/categories/home-kitchen", bannerType: "PROMO_BANNER", backgroundColor: "#3B82F6", buttonText: "Shop Home", position: 4 },
    { title: "Digital Downloads", subTitle: "Instant access to ebooks & courses", image: bannerImg("bannerDigital"), url: "/categories/books-digital", bannerType: "SIDEBAR_BANNER", backgroundColor: "#06B6D4", buttonText: "Browse Digital", position: 5 },
  ]) {
    await prisma.banner.create({ data: { ...b, isActive: true, bannerType: b.bannerType as BannerType } });
  }
  console.log("   ✅ 5 banners created\n");

  // ── 12. Deals ──
  console.log("🏷️  Creating deals...");
  const v0Products = allProducts.filter((p) => p.vendorIdx === 0).slice(0, 6); // electronics
  const v1Products = allProducts.filter((p) => p.vendorIdx === 1).slice(0, 6); // fashion
  const v2Products = allProducts.filter((p) => p.vendorIdx === 2).slice(0, 5); // home
  const dealSpecs = [
    { title: "Flash Sale — 20% Off Electronics", dealType: "FLASH_DEAL", discountValue: 20, endDate: daysAhead(7), products: v0Products, img: bannerImg("bannerElectronics") },
    { title: "Deal of the Day — Fashion Picks", dealType: "DEAL_OF_THE_DAY", discountValue: 15, endDate: daysAhead(3), products: v1Products, img: bannerImg("bannerFashion") },
    { title: "Featured Deal — Home Essentials", dealType: "FEATURED_DEAL", discountValue: 10, endDate: daysAhead(14), products: v2Products, img: bannerImg("bannerHome") },
  ];
  for (const ds of dealSpecs) {
    const deal = await prisma.deal.create({ data: { title: ds.title, description: ds.title, imageUrl: ds.img, dealType: ds.dealType as DealType, discountType: "PERCENTAGE", discountValue: ds.discountValue, startDate: new Date(), endDate: ds.endDate, minOrderValue: 0, isActive: true } });
    for (const p of ds.products) {
      await db.dealProduct.create({ data: { dealId: deal.id, productId: p.id, dealPrice: Math.round(p.price * (1 - ds.discountValue / 100)) } });
    }
  }
  console.log("   ✅ 3 deals created with linked products\n");

  // ── 13. Coupons ──
  console.log("🎫 Creating coupons...");
  for (const c of [
    { code: "WELCOME10", title: "10% Welcome Discount", description: "Get 10% off your first order", discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 2000, maxDiscount: 5000, maxUses: 1000, startDate: new Date(), endDate: daysAhead(30), isActive: true },
    { code: "FLASH20", title: "20% Flash Sale Coupon", description: "Extra 20% off during flash sales", discountType: "PERCENTAGE", discountValue: 20, minOrderValue: 5000, maxDiscount: 10000, maxUses: 200, startDate: new Date(), endDate: daysAhead(7), isActive: true },
  ]) {
    await prisma.coupon.create({ data: { ...c, discountType: c.discountType as DiscountType } });
  }
  console.log("   ✅ 2 coupons created\n");

  // ── 14. ORDERS (8 scenarios) ──
  console.log("📦 Creating orders with full lifecycle...");
  let orderCounter = 0;
  const nextRef = (prefix: string) => `${prefix}-${String(++orderCounter).padStart(4, "0")}`;

  // Helper to compute totals (1% processing fee)
  function computeTotals(subtotal: number, shippingFee: number, discount = 0) {
    const processingFeeAmount = Math.round(subtotal * 0.01 * 100) / 100;
    const totalAmount = Math.round((subtotal + shippingFee + processingFeeAmount - discount) * 100) / 100;
    return { processingFeePercent: 1.0, processingFeeAmount, totalAmount };
  }

  // Helper to create an order with full chain
  async function createOrderChain(opts: {
    buyerId: string;
    storeId: string;
    vendorUserId: string;
    items: { product: typeof allProducts[0]; qty: number; unitPrice?: number }[];
    deliveryMethod: "PICKUP" | "STANDARD_DELIVERY";
    quoteStatus: "PENDING_VENDOR_QUOTE" | "AGREED" | "CANCELLED";
    quoteRevisions?: { type: string; amount: number; actorId: string; note?: string; daysAgo: number }[];
    agreedDeliveryFee?: number;
    orderStatus: string;
    paymentStatus: string;
    paid?: boolean;
    escrowStatus?: "HELD" | "RELEASED" | null;
    deliveryStatus?: string | null;
    fulfillmentStatus?: string | null;
    fulfillmentType?: string | null;
    review?: { rating: number; comment: string } | null;
    notifications?: { userId: string; type: string; title: string; message: string }[];
    parentCheckoutId?: string;
    deliveryAddress?: string;
    pickupAddress?: string;
    daysOffset?: number; // how many days ago the order was placed
    customerConfirmed?: boolean;
  }) {
    const offset = opts.daysOffset ?? 5;
    const placedAt = daysAgo(offset);
    const subtotal = opts.items.reduce((s, i) => s + (i.unitPrice ?? i.product.price) * i.qty, 0);
    const shippingFee = opts.quoteStatus === "AGREED" ? (opts.agreedDeliveryFee ?? 0) : 0;
    const { processingFeePercent, processingFeeAmount, totalAmount } = computeTotals(subtotal, shippingFee);
    const checkoutRef = nextRef("KWIK-CHK");

    // Create order
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

    // Order items with snapshots
    for (const it of opts.items) {
      const unitPrice = it.unitPrice ?? it.product.price;
      await prisma.orderItem.create({
        data: {
          orderId: order.id, productId: it.product.id, quantity: it.qty, unitPrice, totalPrice: unitPrice * it.qty,
          productType: it.product.isDigital ? "DIGITAL" : "PHYSICAL", productSource: "VENDOR_STOCK",
          sellerStoreId: opts.storeId, fulfillmentStatus: (opts.fulfillmentStatus ?? "PENDING") as any,
          productNameSnapshot: it.product.name, productSkuSnapshot: `SKU-V${it.product.vendorIdx + 1}`,
          productSlugSnapshot: slugify(it.product.name), productImageSnapshot: it.product.mainImage,
          vendorNameSnapshot: vendorInfo[it.product.vendorIdx].storeName, vendorStoreIdSnapshot: it.product.storeId,
        },
      });
    }

    // Quote + revisions
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
    } else if (opts.quoteStatus === "PENDING_VENDOR_QUOTE") {
      await prisma.quote.create({ data: { orderId: order.id, vendorId: opts.vendorUserId, buyerId: opts.buyerId, status: "PENDING_VENDOR_QUOTE", currentAmount: 0, expiresAt: daysAhead(2) } });
    }

    // Payment (only for standalone orders — parent-checkout orders get their payment on the ParentCheckout)
    if (opts.paid && !opts.parentCheckoutId) {
      const payRef = nextRef("PAY");
      await prisma.payment.create({
        data: { orderId: order.id, entityType: "ORDER", entityId: order.id, amount: totalAmount, gateway: "PAYSTACK", reference: payRef, status: "PAID", paidAt: placedAt, verifiedAt: placedAt },
      });
    }

    // Escrow
    if (opts.escrowStatus) {
      const escRef = nextRef("ESC");
      const escrow = await prisma.escrow.create({
        data: { orderId: order.id, vendorId: opts.vendorUserId, amount: totalAmount, status: opts.escrowStatus, heldAt: placedAt, releasedAt: opts.escrowStatus === "RELEASED" ? daysAgo(Math.max(1, offset - 3)) : null, transactionRef: escRef },
      });

      // If released → wallet transaction + commission
      if (opts.escrowStatus === "RELEASED") {
        const wallet = await prisma.wallet.findUnique({ where: { vendorId: opts.vendorUserId } });
        if (wallet) {
          const vendorEarnings = Math.round((subtotal + shippingFee - processingFeeAmount) * 100) / 100;
          const newBalance = Math.round((wallet.availableBalance + vendorEarnings) * 100) / 100;
          const wtRef = nextRef("WT");
          await db.walletTransaction.create({ data: { walletId: wallet.id, vendorId: opts.vendorUserId, type: "ESCROW_RELEASE", amount: vendorEarnings, balanceAfter: newBalance, reference: wtRef, orderId: order.id, escrowId: escrow.id, reason: `Escrow release for order ${checkoutRef}`, createdBy: "system" } });
          await prisma.wallet.update({ where: { id: wallet.id }, data: { availableBalance: newBalance, totalEarned: Math.round((wallet.totalEarned + vendorEarnings) * 100) / 100 } });
        }
        await prisma.commission.create({ data: { orderId: order.id, vendorId: opts.vendorUserId, saleAmount: subtotal, platformFeePercent: 1.0, platformFeeAmount: processingFeeAmount, vendorEarnings: Math.round((subtotal + shippingFee - processingFeeAmount) * 100) / 100, plan: "SCALE", settledAt: daysAgo(Math.max(1, offset - 3)) } });
      }
    }

    // Delivery
    if (opts.deliveryStatus && opts.deliveryMethod === "STANDARD_DELIVERY") {
      await prisma.delivery.create({
        data: {
          orderId: order.id, status: opts.deliveryStatus as any, riderId: opts.deliveryStatus === "IN_TRANSIT" || opts.deliveryStatus === "DELIVERED" || opts.deliveryStatus === "COMPLETED" ? riderUser.id : null,
          assignedAt: opts.deliveryStatus !== "PENDING" ? daysAgo(offset - 2) : null, acceptedAt: opts.deliveryStatus !== "PENDING" ? daysAgo(offset - 2) : null,
          vendorPreparingAt: daysAgo(offset - 2), vendorReadyAt: opts.deliveryStatus !== "PENDING" ? daysAgo(offset - 2) : null,
          pickedUpAt: opts.deliveryStatus === "IN_TRANSIT" || opts.deliveryStatus === "DELIVERED" || opts.deliveryStatus === "COMPLETED" ? daysAgo(offset - 1) : null,
          inTransitAt: opts.deliveryStatus === "IN_TRANSIT" || opts.deliveryStatus === "DELIVERED" || opts.deliveryStatus === "COMPLETED" ? daysAgo(offset - 1) : null,
          deliveredAt: (opts.deliveryStatus === "DELIVERED" || opts.deliveryStatus === "COMPLETED") ? daysAgo(Math.max(1, offset - 3)) : null,
          customerConfirmed: opts.customerConfirmed ?? (opts.deliveryStatus === "COMPLETED"), customerConfirmedAt: opts.customerConfirmed ? daysAgo(Math.max(1, offset - 3)) : null,
          pickupAddress: opts.pickupAddress ?? "Vendor store", deliveryAddress: opts.deliveryAddress ?? "Customer address",
          deliveryContactName: "Customer", deliveryContactPhone: "+2348000000000",
        },
      });
    }

    // Fulfillment
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

    // Review
    if (opts.review) {
      const reviewProduct = opts.items[0].product;
      await prisma.review.create({
        data: { productId: reviewProduct.id, userId: opts.buyerId, orderId: order.id, rating: opts.review.rating, title: opts.review.rating >= 4 ? "Great product!" : "Decent", comment: opts.review.comment, isApproved: true, isVerifiedPurchase: true },
      });
      // Update product rating
      const reviews = await prisma.review.findMany({ where: { productId: reviewProduct.id }, select: { rating: true } });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await prisma.product.update({ where: { id: reviewProduct.id }, data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length } });
    }

    // Notifications
    if (opts.notifications) {
      for (const n of opts.notifications) {
        await prisma.notification.create({ data: { userId: n.userId, type: n.type, title: n.title, message: n.message, isRead: false } });
      }
    }

    return order;
  }

  // Scenario 1: Pickup order, fully completed (Vendor 1, Customer 1)
  await createOrderChain({
    buyerId: customerIds[0], storeId: vendorInfo[0].storeId, vendorUserId: vendorInfo[0].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 0 && p.name.includes("Galaxy A54"))!, qty: 1 }],
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

  // Scenario 2: Standard delivery, in transit (Vendor 2, Customer 2)
  await createOrderChain({
    buyerId: customerIds[1], storeId: vendorInfo[1].storeId, vendorUserId: vendorInfo[1].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 1 && p.name.includes("Air Max"))!, qty: 1 }],
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

  // Scenario 3: Multi-vendor via ParentCheckout (Vendor 1 + Vendor 3, Customer 3)
  const parentCheckout = await prisma.parentCheckout.create({
    data: { buyerId: customerIds[2], status: "PAID", subtotal: 0, shippingFee: 0, discount: 0, totalAmount: 0, paymentStatus: "PAID", checkoutReference: nextRef("KWIK-CHK"), idempotencyKey: `idem-${orderCounter}` },
  });

  // Order A: Vendor 1 headphones — delivered, escrow released
  const order3a = await createOrderChain({
    buyerId: customerIds[2], storeId: vendorInfo[0].storeId, vendorUserId: vendorInfo[0].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 0 && p.name.includes("AirPods"))!, qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "AGREED", agreedDeliveryFee: 2000,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 2000, actorId: vendorInfo[0].userId, daysAgo: 6 },
      { type: "CUSTOMER_ACCEPT", amount: 2000, actorId: customerIds[2], daysAgo: 6 },
    ],
    orderStatus: "DELIVERED", paymentStatus: "PAID", paid: true, escrowStatus: "RELEASED",
    deliveryStatus: "COMPLETED", fulfillmentStatus: "FULFILLED", fulfillmentType: "PHYSICAL_MANUAL",
    deliveryAddress: "78 Aba Road, Port Harcourt", customerConfirmed: true,
    review: { rating: 4, comment: "Good sound quality, fast delivery." },
    notifications: [
      { userId: customerIds[2], type: "ORDER_DELIVERED", title: "Order Delivered", message: "Your AirPods have been delivered." },
    ],
    parentCheckoutId: parentCheckout.id, daysOffset: 6,
  });

  // Order B: Vendor 3 airfryer — confirmed, escrow held
  const order3b = await createOrderChain({
    buyerId: customerIds[2], storeId: vendorInfo[2].storeId, vendorUserId: vendorInfo[2].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 2 && p.name.includes("Air Fryer") && p.price === 25000)!, qty: 2 }],
    deliveryMethod: "PICKUP", quoteStatus: "AGREED", agreedDeliveryFee: 0,
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 0, actorId: vendorInfo[2].userId, note: "Pickup — no fee", daysAgo: 6 },
      { type: "CUSTOMER_ACCEPT", amount: 0, actorId: customerIds[2], daysAgo: 6 },
    ],
    orderStatus: "CONFIRMED", paymentStatus: "PAID", paid: true, escrowStatus: "HELD",
    fulfillmentStatus: "PENDING", fulfillmentType: "PHYSICAL_MANUAL",
    notifications: [
      { userId: vendorInfo[2].userId, type: "NEW_ORDER", title: "New Order Received", message: "You received a new pickup order." },
    ],
    parentCheckoutId: parentCheckout.id, daysOffset: 6,
  });

  // Update parent checkout totals
  const sub3 = order3a.totalAmount + order3b.totalAmount;
  await prisma.parentCheckout.update({ where: { id: parentCheckout.id }, data: { subtotal: sub3, totalAmount: sub3 } });
  await prisma.payment.create({ data: { parentCheckoutId: parentCheckout.id, entityType: "CHECKOUT", entityId: parentCheckout.id, amount: sub3, gateway: "PAYSTACK", reference: nextRef("PAY"), status: "PAID", paidAt: daysAgo(6), verifiedAt: daysAgo(6) } });

  // Scenario 4: Digital product order, fulfilled (Vendor 10, Customer 4)
  await createOrderChain({
    buyerId: customerIds[3], storeId: vendorInfo[9].storeId, vendorUserId: vendorInfo[9].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 9 && p.name.includes("Marketing Course"))!, qty: 1 }],
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

  // Scenario 5: Pending vendor quote, no payment (Vendor 5, Customer 5)
  await createOrderChain({
    buyerId: customerIds[4], storeId: vendorInfo[4].storeId, vendorUserId: vendorInfo[4].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 4 && p.name.includes("Dumbbell"))!, qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "PENDING_VENDOR_QUOTE",
    orderStatus: "PENDING", paymentStatus: "PENDING", paid: false,
    notifications: [
      { userId: vendorInfo[4].userId, type: "QUOTE_REQUESTED", title: "New Order Awaiting Quote", message: "A customer placed an order. Please submit a delivery quote." },
    ],
    daysOffset: 1,
  });

  // Scenario 6: Quote negotiation, agreed but not paid (Vendor 2, Customer 6)
  await createOrderChain({
    buyerId: customerIds[5], storeId: vendorInfo[1].storeId, vendorUserId: vendorInfo[1].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 1 && p.name.includes("Ankara"))!, qty: 1 }],
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

  // Scenario 7: Cancelled order (Vendor 1, Customer 7)
  await createOrderChain({
    buyerId: customerIds[6], storeId: vendorInfo[0].storeId, vendorUserId: vendorInfo[0].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 0 && p.name.includes("Charger") && p.price === 6500)!, qty: 1 }],
    deliveryMethod: "STANDARD_DELIVERY", quoteStatus: "CANCELLED",
    quoteRevisions: [
      { type: "VENDOR_QUOTE", amount: 2000, actorId: vendorInfo[0].userId, daysAgo: 3 },
      { type: "CUSTOMER_REJECT", amount: 0, actorId: customerIds[6], note: "Found a better deal elsewhere", daysAgo: 2 },
    ],
    orderStatus: "CANCELLED", paymentStatus: "PENDING", paid: false,
    notifications: [
      { userId: vendorInfo[0].userId, type: "ORDER_CANCELLED", title: "Order Cancelled", message: "Customer cancelled the order." },
    ],
    daysOffset: 3,
  });

  // Scenario 8: Completed standard delivery with review (Vendor 3, Customer 8)
  await createOrderChain({
    buyerId: customerIds[7], storeId: vendorInfo[2].storeId, vendorUserId: vendorInfo[2].userId,
    items: [{ product: allProducts.find((p) => p.vendorIdx === 2 && p.name.includes("Air Fryer") && p.price === 25000)!, qty: 1 }],
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

  const orderCount = await prisma.order.count();
  console.log(`   ✅ ${orderCount} orders created with full lifecycle chains\n`);

  // ── 15. Carts ──
  console.log("🛒 Creating carts...");
  // Cart 1: customer1 with 1 item
  const cart1 = await prisma.cart.create({ data: { userId: customerIds[0] } });
  const p1 = allProducts.find((p) => p.vendorIdx === 0 && p.name.includes("Galaxy A54"))!;
  await prisma.cartItem.create({ data: { cartId: cart1.id, productId: p1.id, quantity: 1, price: p1.price, productType: "PHYSICAL", productSource: "VENDOR_STOCK", requiresShipping: true } });
  // Cart 2: customer2 with 2 items from different vendors
  const cart2 = await prisma.cart.create({ data: { userId: customerIds[1] } });
  const p2a = allProducts.find((p) => p.vendorIdx === 1 && p.name.includes("Air Max"))!;
  const p2b = allProducts.find((p) => p.vendorIdx === 4 && p.name.includes("Football"))!;
  await prisma.cartItem.create({ data: { cartId: cart2.id, productId: p2a.id, quantity: 1, price: p2a.price, productType: "PHYSICAL", productSource: "VENDOR_STOCK", requiresShipping: true } });
  await prisma.cartItem.create({ data: { cartId: cart2.id, productId: p2b.id, quantity: 2, price: p2b.price, productType: "PHYSICAL", productSource: "VENDOR_STOCK", requiresShipping: true } });
  // Cart 3: empty
  await prisma.cart.create({ data: { userId: customerIds[2] } });
  console.log("   ✅ 3 carts created\n");

  // ── 16. Wishlists ──
  console.log("💝 Creating wishlists...");
  const wlProducts = allProducts.filter((p) => !p.isDigital).slice(0, 5);
  for (let i = 0; i < 3; i++) await prisma.wishlist.create({ data: { userId: customerIds[0], productId: wlProducts[i].id } });
  for (let i = 3; i < 5; i++) await prisma.wishlist.create({ data: { userId: customerIds[1], productId: wlProducts[i].id } });
  console.log("   ✅ 5 wishlist entries created\n");

  // ── 17. General notifications ──
  console.log("🔔 Creating general notifications...");
  await prisma.notification.create({ data: { userId: customerIds[0], type: "WELCOME", title: "Welcome to Kwikseller!", message: "Thank you for joining Kwikseller. Start shopping today!", isRead: false } });
  await prisma.notification.create({ data: { userId: customerIds[1], type: "WISHLIST_SALE", title: "Wishlist Item on Sale", message: "An item on your wishlist is now on sale!", isRead: false } });
  await prisma.notification.create({ data: { userId: vendorInfo[0].userId, type: "STORE_VERIFIED", title: "Store Verified", message: "Your store has been verified. You can now publish products.", isRead: true } });
  console.log("   ✅ 3 general notifications created\n");

  // ── 18. VALIDATION ──
  console.log("🔍 Running validation checks...\n");
  let passCount = 0, failCount = 0;
  async function check(name: string, fn: () => Promise<boolean | string>) {
    try {
      const result = await fn();
      if (result === true) { console.log(`   ✅ PASS: ${name}`); passCount++; }
      else { console.log(`   ❌ FAIL: ${name} — ${result}`); failCount++; }
    } catch (e: any) {
      console.log(`   ❌ FAIL: ${name} — ${e.message}`); failCount++;
    }
  }

  await check("Every Product has a valid store", async () => {
    const products = await prisma.product.findMany({ select: { storeId: true } });
    const storeIds = new Set((await prisma.store.findMany({ select: { id: true } })).map((s) => s.id));
    const orphan = products.filter((p) => !storeIds.has(p.storeId)).length;
    return orphan === 0 ? true : `${orphan} products with missing store`;
  });
  await check("Every Product has at least 1 image", async () => {
    const productsWithImages = await prisma.product.findMany({ select: { id: true, _count: { select: { images: true } } } });
    const noImg = productsWithImages.filter((p) => p._count.images === 0).length;
    return noImg === 0 ? true : `${noImg} products with 0 images`;
  });
  await check("Every Product has a category", async () => {
    const noCat = await prisma.product.count({ where: { categoryId: null } });
    return noCat === 0 ? true : `${noCat} products without category`;
  });
  await check("Every Order has OrderItems", async () => {
    const orders = await prisma.order.findMany({ select: { id: true, _count: { select: { items: true } } } });
    const empty = orders.filter((o) => o._count.items === 0).length;
    return empty === 0 ? true : `${empty} orders with 0 items`;
  });
  await check("Every Deal has DealProducts", async () => {
    const deals = await prisma.deal.findMany({ select: { id: true, _count: { select: { products: true } } } });
    const empty = deals.filter((d) => d._count.products === 0).length;
    return empty === 0 ? true : `${empty} deals with 0 products`;
  });
  await check("Every Wallet belongs to a VENDOR", async () => {
    const wallets = await prisma.wallet.findMany({ include: { vendor: { select: { role: true } } } });
    const bad = wallets.filter((w) => w.vendor.role !== "VENDOR").length;
    return bad === 0 ? true : `${bad} wallets on non-vendors`;
  });
  await check("WalletTransaction references are unique", async () => {
    const txs = await prisma.walletTransaction.findMany({ select: { reference: true } });
    const refs = txs.map((t) => t.reference);
    return new Set(refs).size === refs.length ? true : `${refs.length - new Set(refs).size} duplicate refs`;
  });
  await check("Every Escrow has a valid Order", async () => {
    const escs = await prisma.escrow.findMany({ include: { order: { select: { id: true } } } });
    const bad = escs.filter((e) => !e.order).length;
    return bad === 0 ? true : `${bad} orphan escrows`;
  });
  await check("Every Review references real Product + User", async () => {
    const reviews = await prisma.review.findMany({ include: { product: { select: { id: true } }, user: { select: { id: true } } } });
    const bad = reviews.filter((r) => !r.product || !r.user).length;
    return bad === 0 ? true : `${bad} orphan reviews`;
  });
  await check("Every Notification belongs to a real User", async () => {
    const notifs = await prisma.notification.findMany({ include: { user: { select: { id: true } } } });
    const bad = notifs.filter((n) => !n.user).length;
    return bad === 0 ? true : `${bad} orphan notifications`;
  });
  await check("Digital Fulfillments only reference DIGITAL products", async () => {
    const digitalFul = await prisma.fulfillment.findMany({ where: { type: "DIGITAL_ACCESS" }, include: { order: { include: { items: { include: { product: { select: { productType: true } } } } } } } });
    let bad = 0;
    for (const f of digitalFul) {
      for (const it of f.order.items) {
        if (it.product.productType !== "DIGITAL") bad++;
      }
    }
    return bad === 0 ? true : `${bad} digital fulfillments on physical products`;
  });
  await check("Every Quote matches a real Order", async () => {
    const quotes = await prisma.quote.findMany({ include: { order: { select: { id: true } } } });
    const bad = quotes.filter((q) => !q.order).length;
    return bad === 0 ? true : `${bad} orphan quotes`;
  });
  await check("Order totals are consistent", async () => {
    const orders = await prisma.order.findMany({ select: { subtotal: true, shippingFee: true, processingFeeAmount: true, discount: true, totalAmount: true } });
    let bad = 0;
    for (const o of orders) {
      const expected = Math.round((o.subtotal + o.shippingFee + o.processingFeeAmount - o.discount) * 100) / 100;
      if (Math.abs(expected - o.totalAmount) > 1) bad++;
    }
    return bad === 0 ? true : `${bad} orders with inconsistent totals`;
  });

  console.log(`\n   Validation: ${passCount} passed, ${failCount} failed\n`);

  // ── 19. SUMMARY ──
  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.user.count({ where: { role: "BUYER" } }),
    vendors: await prisma.user.count({ where: { role: "VENDOR" } }),
    admins: await prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
    riders: await prisma.user.count({ where: { role: "RIDER" } }),
    stores: await prisma.store.count(),
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    products: await prisma.product.count(),
    physicalProducts: await prisma.product.count({ where: { productType: "PHYSICAL" } }),
    digitalProducts: await prisma.product.count({ where: { productType: "DIGITAL" } }),
    activeProducts: await prisma.product.count({ where: { status: "ACTIVE" } }),
    productImages: await prisma.productMedia.count(),
    productVariants: await prisma.productVariant.count(),
    inventoryItems: await prisma.inventoryItem.count(),
    digitalAssets: await prisma.digitalAsset.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    parentCheckouts: await prisma.parentCheckout.count(),
    quotes: await prisma.quote.count(),
    quoteRevisions: await prisma.quoteRevision.count(),
    payments: await prisma.payment.count(),
    escrows: await prisma.escrow.count(),
    escrowHeld: await prisma.escrow.count({ where: { status: "HELD" } }),
    escrowReleased: await prisma.escrow.count({ where: { status: "RELEASED" } }),
    wallets: await prisma.wallet.count(),
    walletTransactions: await prisma.walletTransaction.count(),
    commissions: await prisma.commission.count(),
    deliveries: await prisma.delivery.count(),
    fulfillments: await prisma.fulfillment.count(),
    reviews: await prisma.review.count(),
    notifications: await prisma.notification.count(),
    banners: await prisma.banner.count(),
    deals: await prisma.deal.count(),
    dealProducts: await prisma.dealProduct.count(),
    coupons: await prisma.coupon.count(),
    carts: await prisma.cart.count(),
    wishlists: await prisma.wishlist.count(),
    states: await prisma.state.count(),
    lgas: await prisma.localGovernment.count(),
  };

  console.log("========================================");
  console.log("KWIKSELLER DATABASE SEEDED");
  console.log("========================================\n");
  console.log(`Users:              ${counts.users}`);
  console.log(`  - Super Admin:    1`);
  console.log(`  - Admin:          1`);
  console.log(`  - Customers:      ${counts.customers}`);
  console.log(`  - Vendors:        ${counts.vendors}`);
  console.log(`  - Riders:         ${counts.riders}`);
  console.log(`Stores:             ${counts.stores}`);
  console.log(`Categories:         ${counts.categories} (10 parents + ${counts.categories - 10} children)`);
  console.log(`Brands:             ${counts.brands}`);
  console.log(`Products:           ${counts.products}`);
  console.log(`  - Physical:       ${counts.physicalProducts}`);
  console.log(`  - Digital:        ${counts.digitalProducts}`);
  console.log(`  - Active:         ${counts.activeProducts}`);
  console.log(`Product Images:     ${counts.productImages}`);
  console.log(`Product Variants:   ${counts.productVariants}`);
  console.log(`Inventory Items:    ${counts.inventoryItems}`);
  console.log(`Digital Assets:     ${counts.digitalAssets}`);
  console.log(`Orders:             ${counts.orders}`);
  console.log(`Order Items:        ${counts.orderItems}`);
  console.log(`Parent Checkouts:   ${counts.parentCheckouts}`);
  console.log(`Quotes:             ${counts.quotes}`);
  console.log(`Quote Revisions:    ${counts.quoteRevisions}`);
  console.log(`Payments:           ${counts.payments}`);
  console.log(`Escrow Records:     ${counts.escrows}`);
  console.log(`  - Held:           ${counts.escrowHeld}`);
  console.log(`  - Released:       ${counts.escrowReleased}`);
  console.log(`Wallets:            ${counts.wallets}`);
  console.log(`Wallet Transactions:${counts.walletTransactions}`);
  console.log(`Commissions:        ${counts.commissions}`);
  console.log(`Deliveries:         ${counts.deliveries}`);
  console.log(`Fulfillments:       ${counts.fulfillments}`);
  console.log(`Reviews:            ${counts.reviews}`);
  console.log(`Notifications:      ${counts.notifications}`);
  console.log(`Banners:            ${counts.banners}`);
  console.log(`Deals:              ${counts.deals}`);
  console.log(`Deal Products:      ${counts.dealProducts}`);
  console.log(`Coupons:            ${counts.coupons}`);
  console.log(`Carts:              ${counts.carts}`);
  console.log(`Wishlists:          ${counts.wishlists}`);
  console.log(`States:             ${counts.states}`);
  console.log(`LGAs:               ${counts.lgas}\n`);
  console.log("========================================");
  console.log("DEMO CREDENTIALS");
  console.log("========================================");
  console.log("Super Admin:  superadmin@example.com  /  SuperAdmin@2024!");
  console.log("Admin:        admin@example.com       /  Admin@2024!");
  console.log("Customer:     chidi.okeke@example.com /  Customer@2024!");
  console.log("Vendor:       ade.okoye@example.com   /  Vendor@2024!");
  console.log("Rider:        rider@kwikseller.com    /  Rider@2024!");
  console.log("\n(All customers use Customer@2024!)");
  console.log("(All vendors use Vendor@2024!)");
  console.log("========================================\n");
  console.log(`✅ Seed completed. Validation: ${passCount} passed, ${failCount} failed.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
