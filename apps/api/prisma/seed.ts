/**
 * KWIKSELLER Database Seed Script
 *
 * Comprehensive seed for the Kwikseller e-commerce platform:
 * - Super Admin user
 * - System configurations
 * - Vendor milestones
 * - 10 Brands (Nigerian/African electronics & fashion)
 * - 12 Categories
 * - Nigerian Naira (₦) currency
 * - Demo Vendor + Store
 * - 400+ Products with real images spread across all categories & brands
 *
 * Run with: cd apps/api && npx prisma db seed
 */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  AdminRole,
  ProductStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const db = prisma as any;

// ============================================================
// SUPER ADMIN
// ============================================================
const SUPER_ADMIN_CONFIG = {
  email: process.env.SUPER_ADMIN_EMAIL || "superadmin@kwikseller.com",
  password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2024!",
  firstName: "Super",
  lastName: "Admin",
};

// ============================================================
// SYSTEM CONFIGS
// ============================================================
const SYSTEM_CONFIGS = [
  { key: "platform_fee_percent", value: "5" },
  { key: "min_withdrawal_amount", value: "1000" },
  { key: "delivery_fee_base", value: "500" },
  { key: "delivery_fee_per_km", value: "50" },
  { key: "max_products_starter", value: "10" },
  { key: "max_products_growth", value: "50" },
  { key: "max_products_pro", value: "200" },
  { key: "max_products_scale", value: "1000" },
  { key: "kwikcoins_per_referral", value: "100" },
  { key: "otp_expiry_minutes", value: "10" },
  { key: "password_reset_expiry_minutes", value: "15" },
];

// ============================================================
// VENDOR MILESTONES
// ============================================================
const VENDOR_MILESTONES = [
  { key: "first_product", name: "First Product Listed", description: "List your first product", coinsAwarded: 50, isRepeatable: false },
  { key: "first_sale", name: "First Sale", description: "Complete your first sale", coinsAwarded: 100, isRepeatable: false },
  { key: "sales_10", name: "10 Sales Milestone", description: "Complete 10 sales", coinsAwarded: 200, isRepeatable: false },
  { key: "sales_50", name: "50 Sales Milestone", description: "Complete 50 sales", coinsAwarded: 500, isRepeatable: false },
  { key: "sales_100", name: "100 Sales Milestone", description: "Complete 100 sales", coinsAwarded: 1000, isRepeatable: false },
  { key: "first_ad_campaign", name: "First Ad Campaign", description: "Create your first advertisement", coinsAwarded: 50, isRepeatable: false },
  { key: "profile_complete", name: "Complete Profile", description: "Fill out all profile information", coinsAwarded: 30, isRepeatable: false },
  { key: "store_verified", name: "Store Verified", description: "Get your store verified", coinsAwarded: 200, isRepeatable: false },
  { key: "monthly_referral", name: "Monthly Referral Bonus", description: "Refer a new vendor each month", coinsAwarded: 50, isRepeatable: true },
];

// ============================================================
// CURRENCY
// ============================================================
const CURRENCIES = [
  { name: "Nigerian Naira", code: "NGN", symbol: "₦", exchangeRate: 1, isDefault: true, isActive: true },
  { name: "US Dollar", code: "USD", symbol: "$", exchangeRate: 1580, isDefault: false, isActive: true },
];

// ============================================================
// 10 BRANDS (Nigerian / African electronics & fashion)
// ============================================================
const BRANDS = [
  { name: "Samsung", slug: "samsung", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Apple", slug: "apple", image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Tecno", slug: "tecno", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Infinix", slug: "infinix", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Oraimo", slug: "oraimo", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Nike", slug: "nike", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Adidas", slug: "adidas", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Gucci", slug: "gucci", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "HP", slug: "hp", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&h=400&q=80", status: true },
  { name: "Lenovo", slug: "lenovo", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&h=400&q=80", status: true },
];

// ============================================================
// 12 CATEGORIES
// ============================================================
const CATEGORIES = [
  { name: "Electronics", slug: "electronics", icon: "Zap", position: 1 },
  { name: "Fashion", slug: "fashion", icon: "Shirt", position: 2 },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "Home", position: 3 },
  { name: "Beauty", slug: "beauty", icon: "Sparkles", position: 4 },
  { name: "Sports", slug: "sports", icon: "Dumbbell", position: 5 },
  { name: "Books", slug: "books", icon: "BookOpen", position: 6 },
  { name: "Toys", slug: "toys", icon: "Gamepad2", position: 7 },
  { name: "Automotive", slug: "automotive", icon: "Car", position: 8 },
  { name: "Health", slug: "health", icon: "Heart", position: 9 },
  { name: "Food & Drinks", slug: "food-drinks", icon: "Utensils", position: 10 },
  { name: "Phones", slug: "phones", icon: "Smartphone", position: 11 },
  { name: "Computers", slug: "computers", icon: "Laptop", position: 12 },
];

// ============================================================
// 400+ PRODUCTS
// ============================================================
interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number;
  sku: string;
  stock: number;
  status: "ACTIVE" | "DRAFT";
  isFeatured: boolean;
  categoryId: string;
  brandId: string;
}

// Helper: generate SKU
function makeSku(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

const REAL_IMAGE_POOLS: Record<string, string[]> = {
  electronics: [
    "photo-1505740420928-5e560c06d30e",
    "photo-1545454675-3531b543be5d",
    "photo-1542751371-adc38448a05e",
    "photo-1498049794561-7780e7231661",
    "photo-1516321318423-f06f85e504b3",
  ],
  phones: [
    "photo-1511707171634-5f897ff02aa9",
    "photo-1598327105666-5b89351aff97",
    "photo-1580910051074-3eb694886505",
    "photo-1592750475338-74b7b21085ab",
    "photo-1616348436168-de43ad0db179",
  ],
  computers: [
    "photo-1496181133206-80ce9b88a853",
    "photo-1517336714731-489689fd1ca8",
    "photo-1498050108023-c5249f4df085",
    "photo-1484788984921-03950022c9ef",
    "photo-1525547719571-a2d4ac8945e2",
  ],
  fashion: [
    "photo-1542291026-7eec264c27ff",
    "photo-1529139574466-a303027c1d8b",
    "photo-1483985988355-763728e1935b",
    "photo-1515886657613-9f3515b0c78f",
    "photo-1525507119028-ed4c629a60a3",
  ],
  "home-kitchen": [
    "photo-1556909114-f6e7ad7d3136",
    "photo-1556911220-bff31c812dba",
    "photo-1556912172-45b7abe8b7e1",
    "photo-1513694203232-719a280e022f",
    "photo-1484154218962-a197022b5858",
  ],
  beauty: [
    "photo-1596462502278-27bfdc403348",
    "photo-1522338242992-e1a54906a8da",
    "photo-1512496015851-a90fb38ba796",
    "photo-1608248543803-ba4f8c70ae0b",
    "photo-1571781926291-c477ebfd024b",
  ],
  sports: [
    "photo-1517836357463-d25dfeac3438",
    "photo-1517649763962-0c623066013b",
    "photo-1571019613454-1cb2f99b2d8b",
    "photo-1521412644187-c49fa049e84d",
    "photo-1599058917212-d750089bc07e",
  ],
  books: [
    "photo-1512820790803-83ca734da794",
    "photo-1495446815901-a7297e633e8d",
    "photo-1519682337058-a94d519337bc",
    "photo-1521587760476-6c12a4b040da",
    "photo-1456513080510-7bf3a84b82f8",
  ],
  toys: [
    "photo-1558060370-d644479cb6f7",
    "photo-1566576912321-d58ddd7a6088",
    "photo-1515488042361-ee00e0ddd4e4",
    "photo-1535572290543-960a8046f5af",
    "photo-1596461404969-9ae70f2830c1",
  ],
  automotive: [
    "photo-1503376780353-7e6692767b70",
    "photo-1492144534655-ae79c964c9d7",
    "photo-1542362567-b07e54358753",
    "photo-1511919884226-fd3cad34687c",
    "photo-1502877338535-766e1452684a",
  ],
  health: [
    "photo-1505751172876-fa1923c5c528",
    "photo-1584515933487-779824d29309",
    "photo-1576091160550-2173dba999ef",
    "photo-1506126613408-eca07ce68773",
    "photo-1532938911079-1b06ac7ceec7",
  ],
  "food-drinks": [
    "photo-1504674900247-0877df9cc836",
    "photo-1498837167922-ddd27525d352",
    "photo-1540189549336-e6e99c3679fe",
    "photo-1512621776951-a57141f2eefd",
    "photo-1551024506-0bccd828d307",
  ],
  banners: [
    "photo-1441986300917-64674bd600d8",
    "photo-1607083206869-4c7672e72a8a",
    "photo-1607082349566-187342175e2f",
    "photo-1556742049-0cfed4f6a45d",
  ],
  brand: [
    "photo-1523275335684-37898b6baf30",
    "photo-1445205170230-053b83016050",
    "photo-1491933382434-500287f9b54b",
  ],
};

const IMAGE_KEYWORDS: Array<[string, string]> = [
  ["phone", "phones"],
  ["iphone", "phones"],
  ["galaxy", "phones"],
  ["tecno", "phones"],
  ["infinix", "phones"],
  ["laptop", "computers"],
  ["macbook", "computers"],
  ["desktop", "computers"],
  ["monitor", "computers"],
  ["book", "books"],
  ["novel", "books"],
  ["sneaker", "fashion"],
  ["shoe", "fashion"],
  ["shirt", "fashion"],
  ["dress", "fashion"],
  ["bag", "fashion"],
  ["beauty", "beauty"],
  ["cream", "beauty"],
  ["lipstick", "beauty"],
  ["foundation", "beauty"],
  ["kettle", "home-kitchen"],
  ["cooker", "home-kitchen"],
  ["kitchen", "home-kitchen"],
  ["blender", "home-kitchen"],
  ["football", "sports"],
  ["training", "sports"],
  ["gym", "sports"],
  ["toy", "toys"],
  ["lego", "toys"],
  ["barbie", "toys"],
  ["car", "automotive"],
  ["charger", "automotive"],
  ["dash", "automotive"],
  ["health", "health"],
  ["monitor", "health"],
  ["thermometer", "health"],
  ["milo", "food-drinks"],
  ["drink", "food-drinks"],
  ["food", "food-drinks"],
  ["coffee", "food-drinks"],
  ["tv", "electronics"],
  ["speaker", "electronics"],
  ["airpods", "electronics"],
  ["printer", "electronics"],
];

function stableHash(value: string): number {
  return value.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function imageGroupFor(text: string): string {
  const lower = text.toLowerCase();
  return IMAGE_KEYWORDS.find(([keyword]) => lower.includes(keyword))?.[1] ?? "electronics";
}

function realImageFromPool(group: string, seed: string, width = 600, height = 600): string {
  const pool = REAL_IMAGE_POOLS[group] ?? REAL_IMAGE_POOLS.electronics;
  const photoId = pool[Math.abs(stableHash(seed)) % pool.length];
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

// Helper: deterministic real image URL
function imageUrl(text: string, _color: string = "f97316"): string {
  return realImageFromPool(imageGroupFor(text), text);
}

function bannerImageUrl(seed: string): string {
  return realImageFromPool("banners", seed, 1200, 400);
}

function brandImageUrl(seed: string): string {
  return realImageFromPool("brand", seed, 400, 400);
}

// Seeded random for deterministic featured/status
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

async function buildProducts(
  categoryMap: Record<string, string>,
  brandMap: Record<string, string>,
  storeId: string,
): Promise<SeedProduct[]> {
  const products: SeedProduct[] = [];
  let idx = 1;

  // Category: Electronics (10 products)
  const electronicsBrandIds = [
    brandMap.samsung, brandMap.hp, brandMap.lenovo, brandMap.apple, brandMap.tecno,
  ];
  const electronicsProducts = [
    { name: "Samsung 43-inch Crystal UHD Smart TV", price: 185000, brand: brandMap.samsung, desc: "Brilliant 4K display with Crystal Processor for vibrant colours and sharp details." },
    { name: "Samsung Galaxy Tab A9+ 11-inch", price: 142000, brand: brandMap.samsung, desc: "Powerful tablet with 90Hz display and quad speakers for immersive entertainment." },
    { name: "HP 15.6-inch Laptop Intel Core i5", price: 485000, brand: brandMap.hp, desc: "Reliable performance for work and school with 8GB RAM and 256GB SSD." },
    { name: "Lenovo IdeaPad 3 15.6-inch AMD Ryzen 5", price: 420000, brand: brandMap.lenovo, desc: "Affordable everyday laptop with anti-glare display and long battery life." },
    { name: "Samsung Sound Tower MX-T50", price: 95000, brand: brandMap.samsung, desc: "Bi-directional sound with deep bass for parties and outdoor gatherings." },
    { name: "Apple AirPods Max Silver", price: 750000, brand: brandMap.apple, desc: "High-fidelity audio with active noise cancellation and spatial audio." },
    { name: "HP DeskJet 2755e Wireless Printer", price: 65000, brand: brandMap.hp, desc: "All-in-one wireless colour printer with scanner and copier." },
    { name: "Samsung Microwave 20L Solo", price: 42000, brand: brandMap.samsung, desc: "Compact solo microwave with 6 power levels and auto-cook menus." },
    { name: "Lenovo 500 Bluetooth Speaker", price: 28000, brand: brandMap.lenovo, desc: "Portable Bluetooth speaker with 10-hour battery and rich sound." },
    { name: "Samsung Digital Inverter Split AC 1.5HP", price: 320000, brand: brandMap.samsung, desc: "Energy-efficient air conditioner with fast cooling and digital inverter tech." },
  ];
  electronicsProducts.forEach((p, i) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("ELEC", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.electronics,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Phones (10 products)
  const phonesProducts = [
    { name: "Samsung Galaxy A54 5G 128GB", price: 225000, brand: brandMap.samsung, desc: "Stunning 6.4-inch AMOLED display with 50MP triple camera and 5000mAh battery." },
    { name: "Apple iPhone 15 128GB Blue", price: 780000, brand: brandMap.apple, desc: "Dynamic Island, A16 Bionic chip and 48MP main camera." },
    { name: "Tecno Camon 20 Premier 256GB", price: 235000, brand: brandMap.tecno, desc: "RGBW lens system with 50MP main camera and 32MP selfie." },
    { name: "Infinix Note 40 Pro 5G 256GB", price: 265000, brand: brandMap.infinix, desc: "120Hz AMOLED display with 108MP camera and 5000mAh battery." },
    { name: "Samsung Galaxy S24 Ultra 256GB", price: 850000, brand: brandMap.samsung, desc: "Galaxy AI powered S Pen with 200MP camera and titanium frame." },
    { name: "Tecno Spark 20 128GB", price: 85000, brand: brandMap.tecno, desc: "Budget-friendly smartphone with 6.6-inch display and 50MP camera." },
    { name: "Apple iPhone 14 Plus 128GB", price: 650000, brand: brandMap.apple, desc: "Big 6.7-inch Super Retina display with A15 Bionic chip." },
    { name: "Infinix Hot 40 Pro 256GB", price: 120000, brand: brandMap.infinix, desc: "108MP main camera and 33W fast charging at an affordable price." },
    { name: "Tecno Phantom V Fold 256GB", price: 550000, brand: brandMap.tecno, desc: "Foldable 7.85-inch LTPO AMOLED display with flagship performance." },
    { name: "Samsung Galaxy Z Flip5 256GB", price: 620000, brand: brandMap.samsung, desc: "Compact foldable design with Flex Mode and 12MP dual camera." },
  ];
  phonesProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("PHON", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.phones,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Computers (8 products)
  const computersProducts = [
    { name: "HP ProBook 450 G10 Intel i7", price: 585000, brand: brandMap.hp, desc: "Business laptop with 16GB RAM, 512GB SSD and Windows 11 Pro." },
    { name: "Lenovo ThinkPad E14 Gen 5 AMD", price: 510000, brand: brandMap.lenovo, desc: "Durable business laptop with spill-resistant keyboard and long battery." },
    { name: "Apple MacBook Air M2 256GB", price: 730000, brand: brandMap.apple, desc: "Ultra-thin laptop with M2 chip, 18-hour battery and Liquid Retina." },
    { name: "HP EliteDesk 800 G9 Desktop", price: 350000, brand: brandMap.hp, desc: "Powerful mini desktop with Intel Core i7 and 16GB RAM for office use." },
    { name: "Lenovo IdeaCentre AIO 24-inch", price: 310000, brand: brandMap.lenovo, desc: "All-in-one desktop with FHD display and integrated webcam." },
    { name: "Samsung 27-inch Smart Monitor M7", price: 195000, brand: brandMap.samsung, desc: "4K UHD smart monitor with built-in streaming apps and USB-C." },
    { name: "HP 14-inch Chromebook x360", price: 155000, brand: brandMap.hp, desc: "Convertible Chromebook with touch screen and all-day battery life." },
    { name: "Lenovo Legion 5 15.6-inch Gaming Laptop", price: 680000, brand: brandMap.lenovo, desc: "Gaming laptop with RTX 4060, 16GB RAM and 144Hz display." },
    { name: "Apple iMac 24-inch M3 256GB", price: 850000, brand: brandMap.apple, desc: "All-in-one desktop with stunning 4.5K Retina display and M3 chip." },
    { name: "HP 27-inch All-in-One Desktop PC", price: 390000, brand: brandMap.hp, desc: "Space-saving all-in-one with Intel i5, 8GB RAM and webcam." },
  ];
  computersProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("COMP", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.computers,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Fashion (12 products)
  const fashionBrandIds = [brandMap.nike, brandMap.adidas, brandMap.gucci];
  const fashionProducts = [
    { name: "Nike Air Max 270 React Sneakers", price: 45000, brand: brandMap.nike, desc: "Iconic Air Max cushioning with React foam for all-day comfort." },
    { name: "Adidas Ultraboost 23 Running Shoes", price: 52000, brand: brandMap.adidas, desc: "Responsive Boost midsole with Primeknit upper for premium fit." },
    { name: "Gucci GG Marmont Small Shoulder Bag", price: 150000, brand: brandMap.gucci, desc: "Luxurious matelassé chevron leather bag with gold GG hardware." },
    { name: "Nike Dri-FIT Men's Training T-Shirt", price: 8500, brand: brandMap.nike, desc: "Moisture-wicking fabric for dry comfort during workouts." },
    { name: "Adidas Originals Trefoil Hoodie", price: 18000, brand: brandMap.adidas, desc: "Classic heavyweight fleece hoodie with embroidered trefoil logo." },
    { name: "Gucci Ace Embroidered Sneaker", price: 120000, brand: brandMap.gucci, desc: "Low-top leather sneaker with iconic bee and web embroidery." },
    { name: "Nike Women's Air Force 1 '07", price: 38000, brand: brandMap.nike, desc: "Timeless basketball shoe with Air-Sole unit and padded collar." },
    { name: "Adidas Men's Essentials 3-Stripes Jogger", price: 12500, brand: brandMap.adidas, desc: "Comfortable cotton jogger pants with side pockets and tapered fit." },
    { name: "Gucci Men's Cotton Jersey Polo Shirt", price: 65000, brand: brandMap.gucci, desc: "Premium cotton pique polo with embroidered Gucci logo." },
    { name: "Nike Quest 4 Women's Training Shoes", price: 32000, brand: brandMap.nike, desc: "Versatile training shoes with durable rubber outsole and cushioned midsole." },
    { name: "Adidas Tiro 24 Competition Shorts", price: 9000, brand: brandMap.adidas, desc: "Lightweight football shorts with AEROREADY moisture management." },
    { name: "Gucci GG Supreme Canvas Belt", price: 85000, brand: brandMap.gucci, desc: "Interlocking G buckle on signature GG Supreme canvas belt." },
  ];
  fashionProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("FSHN", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.fashion,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Home & Kitchen (10 products)
  const homeProducts = [
    { name: "Binatone 1.7L Electric Kettle", price: 8500, brand: brandMap.samsung, desc: "Rapid boil stainless steel kettle with auto shut-off and boil-dry protection." },
    { name: "Samsung 8kg Front Load Washing Machine", price: 245000, brand: brandMap.samsung, desc: "Digital inverter motor with eco wash cycle and quick wash option." },
    { name: "Nexus 4-Burner Gas Cooker with Oven", price: 85000, brand: brandMap.samsung, desc: "Stainless steel freestanding cooker with oven, grill and glass lid." },
    { name: "Binatone 2-Slice Toaster", price: 6500, brand: brandMap.samsung, desc: "Compact toaster with 6 browning levels and removable crumb tray." },
    { name: "Samsung 320L Bottom Mount Refrigerator", price: 210000, brand: brandMap.samsung, desc: "Digital inverter technology with all-around cooling and deodorizer." },
    { name: "Sayona Home Theatre 5.1 Channel", price: 35000, brand: brandMap.samsung, desc: "Surround sound system with Bluetooth, USB and FM radio connectivity." },
    { name: "Midea 1.5HP Split AC Remote Control", price: 175000, brand: brandMap.samsung, desc: "Energy-efficient split air conditioner with turbo cooling mode." },
    { name: "Oraimo SmartChef 5L Air Fryer", price: 25000, brand: brandMap.oraimo, desc: "Healthy oil-free cooking with digital timer and temperature control." },
    { name: "Binatone Blender 1.5L BLG-450", price: 12000, brand: brandMap.samsung, desc: "Powerful blender with stainless steel blades and 2 speed settings." },
    { name: "Samsung Robot Vacuum Cleaner VR20M", price: 180000, brand: brandMap.samsung, desc: "Smart navigation vacuum with Wi-Fi control and automatic charging." },
  ];
  homeProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("HOME", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap["home-kitchen"],
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Beauty (8 products)
  const beautyProducts = [
    { name: "Oraimo Electric Facial Cleansing Brush", price: 5500, brand: brandMap.oraimo, desc: "Silicone sonic facial brush with 5 modes for deep pore cleansing." },
    { name: "Nivea Soft Moisturizing Cream 200ml", price: 3500, brand: brandMap.samsung, desc: "Lightweight moisturizer enriched with Vitamin E and Jojoba Oil." },
    { name: "L'Oreal Paris Revitalift Laser Day Cream 50ml", price: 15000, brand: brandMap.samsung, desc: "Anti-ageing day cream with Pro-Retinol for visibly younger-looking skin." },
    { name: "Oraimo Hair Clipper OCD-50 Professional", price: 8500, brand: brandMap.oraimo, desc: "Cordless hair clipper with LED display and 8 guide combs." },
    { name: "Maybelline Fit Me Matte Foundation 128", price: 5500, brand: brandMap.samsung, desc: "Oil-free liquid foundation with pore-minimizing micro-powders." },
    { name: "Oraimo Electric Toothbrush OCD-100", price: 7500, brand: brandMap.oraimo, desc: "Sonic toothbrush with 5 cleaning modes and 2-week battery life." },
    { name: "Black Opium Eau de Parfum 90ml", price: 42000, brand: brandMap.samsung, desc: "Bold and addictive fragrance with coffee and vanilla notes." },
    { name: "Mac Fix+ Setting Spray 100ml", price: 18000, brand: brandMap.samsung, desc: "Lightweight mist infused with aloe and green tea to set makeup." },
  ];
  beautyProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("BTY", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.beauty,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Sports (8 products)
  const sportsProducts = [
    { name: "Nike Quest 5 Men's Running Shoes", price: 35000, brand: brandMap.nike, desc: "Lightweight running shoes with cushioned foam midsole." },
    { name: "Adidas Adipower Weightlifting Shoes", price: 55000, brand: brandMap.adidas, desc: "Stable platform with elevated heel for Olympic lifting." },
    { name: "Nike Pro Dri-FIT Compression Tights", price: 15000, brand: brandMap.nike, desc: "Tight-fitting base layer with sweat-wicking Dri-FIT technology." },
    { name: "Adidas Starlancer Club Football", price: 8000, brand: brandMap.adidas, desc: "Durable training football with machine-stitched TPU cover." },
    { name: "Nike Brasilia Training Duffel Bag", price: 20000, brand: brandMap.nike, desc: "Spacious duffel with ventilated shoe compartment and zip pockets." },
    { name: "Adidas Gym Dumbbell Set 10kg", price: 25000, brand: brandMap.adidas, desc: "Adjustable dumbbell set with rubber coating for home workouts." },
    { name: "Nike Fly Fast Running Cap", price: 5500, brand: brandMap.nike, desc: "Lightweight Dri-FIT cap with reflective details for visibility." },
    { name: "Adidas Adizero Ubersonic 4 Tennis Shoes", price: 48000, brand: brandMap.adidas, desc: "Lightweight tennis shoes with Adiwear outsole for durability." },
  ];
  sportsProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("SPRT", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.sports,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Books (6 products)
  const bookProducts = [
    { name: "The Intelligent Investor by Benjamin Graham", price: 7500, brand: brandMap.samsung, desc: "The definitive book on value investing, revised and updated edition." },
    { name: "Atomic Habits by James Clear", price: 5500, brand: brandMap.samsung, desc: "Tiny changes, remarkable results — a proven framework for building good habits." },
    { name: "Rich Dad Poor Dad by Robert Kiyosaki", price: 4500, brand: brandMap.samsung, desc: "What the rich teach their kids about money that the poor and middle class do not." },
    { name: "Becoming by Michelle Obama", price: 9500, brand: brandMap.samsung, desc: "An intimate memoir by the former First Lady of the United States." },
    { name: "Start With Why by Simon Sinek", price: 6000, brand: brandMap.samsung, desc: "How great leaders inspire everyone to take action." },
    { name: "The Lean Startup by Eric Ries", price: 5500, brand: brandMap.samsung, desc: "How constant innovation creates radically successful businesses." },
  ];
  bookProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("BOOK", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.books,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Toys (6 products)
  const toyProducts = [
    { name: "LEGO City Fire Rescue Helicopter", price: 25000, brand: brandMap.samsung, desc: "Buildable fire rescue helicopter with water cannon and minifigures." },
    { name: "Hot Wheels Track Builder Multi-Loop Set", price: 15000, brand: brandMap.samsung, desc: "Multi-loop stunt track with motorized booster for speed." },
    { name: "Barbie Dreamtopia Rainbow Princess Doll", price: 12000, brand: brandMap.samsung, desc: "Fantasy doll with rainbow hair, crown and sparkling dress." },
    { name: "Fisher-Price Learning Walker", price: 18000, brand: brandMap.samsung, desc: "Interactive baby walker with music, lights and learning activities." },
    { name: " Nerf N-Strike Elite Disruptor Blaster", price: 10000, brand: brandMap.samsung, desc: "Quick-draw 6-dart blaster with slam-fire action." },
    { name: "Hasbro Monopoly Nigeria Edition", price: 8500, brand: brandMap.samsung, desc: "Classic property trading board game with Nigerian locations." },
  ];
  toyProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("TOYS", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.toys,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Automotive (6 products)
  const automotiveProducts = [
    { name: "Oraimo Car Phone Mount OCD-M33", price: 4500, brand: brandMap.oraimo, desc: "Magnetic car mount with 360° rotation and one-hand operation." },
    { name: "Samsung 20000mAh Car Jump Starter", price: 35000, brand: brandMap.samsung, desc: "Portable car jump starter with USB output and LED flashlight." },
    { name: "Oraimo Car Charger OCD-C28 45W", price: 5500, brand: brandMap.oraimo, desc: "Dual USB-C car charger with 45W fast charging support." },
    { name: "Samsung Wireless Car Charger", price: 15000, brand: brandMap.samsung, desc: "Qi-certified wireless car charger with automatic clamping." },
    { name: "Oraimo Dash Cam OCD-D01 1080P", price: 22000, brand: brandMap.oraimo, desc: "Full HD dash camera with night vision and loop recording." },
    { name: "Samsung Car Air Purifier AF-Q300", price: 28000, brand: brandMap.samsung, desc: "Compact car air purifier with HEPA filter and USB charging." },
  ];
  automotiveProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("AUTO", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.automotive,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Health (6 products)
  const healthProducts = [
    { name: "Oraimo Smart Scale OCD-S21", price: 15000, brand: brandMap.oraimo, desc: "Digital body scale with 13 body metrics and app connectivity." },
    { name: "Samsung BP Upper Arm Blood Pressure Monitor", price: 32000, brand: brandMap.samsung, desc: "Accurate blood pressure monitor with irregular heartbeat detection." },
    { name: "Omron Nebulizer NE-C28", price: 25000, brand: brandMap.samsung, desc: "Compact nebulizer for effective respiratory treatment at home." },
    { name: "Oraimo Pulse Oximeter OCD-O1", price: 4500, brand: brandMap.oraimo, desc: "Fingertip pulse oximeter with OLED display for SpO2 and pulse rate." },
    { name: "Samsung Infrared Thermometer TH-600", price: 12000, brand: brandMap.samsung, desc: "Non-contact digital thermometer with fever alert and memory function." },
    { name: "Infinix Smartband 6 Fitness Tracker", price: 18000, brand: brandMap.infinix, desc: "1.47-inch AMOLED display with heart rate, SpO2 and 14-day battery." },
    { name: "Samsung Digital Thermometer SHS-2000", price: 8500, brand: brandMap.samsung, desc: "Fast and accurate digital thermometer with flexible tip and fever alarm." },
    { name: "Oraimo Smart Body Fat Scale OCD-S25", price: 12000, brand: brandMap.oraimo, desc: "Bluetooth body composition scale with 18 metrics and app sync." },
  ];
  healthProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("HLTH", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap.health,
      brandId: p.brand,
    });
    idx++;
  });

  // Category: Food & Drinks (6 products)
  const foodProducts = [
    { name: "Nestle Milo 400g Energy Drink", price: 3200, brand: brandMap.samsung, desc: "Choco-malt energy drink fortified with ACTIV-GO for active kids and adults." },
    { name: "Dangote Sugar 1kg", price: 1800, brand: brandMap.samsung, desc: "Refined white sugar perfect for cooking, baking and beverages." },
    { name: "Indomie Instant Noodles Chicken Flavour 70g x 12", price: 2800, brand: brandMap.samsung, desc: "Nigeria's favourite instant noodles with delicious chicken seasoning." },
    { name: "Chi Exotic Fruit Juice 1L", price: 1500, brand: brandMap.samsung, desc: "Tropical fruit juice blend made from real fruits — refreshing taste." },
    { name: "Honeywell Wheat Meal 2kg", price: 2200, brand: brandMap.samsung, desc: "Premium quality wheat meal for preparing healthy semo and fufu." },
    { name: "Peak Full Cream Milk Powder 900g", price: 7500, brand: brandMap.samsung, desc: "Rich and creamy milk powder ideal for the whole family." },
  ];
  foodProducts.forEach((p) => {
    const r = seededRandom(idx);
    products.push({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.desc,
      price: p.price,
      comparePrice: Math.round(p.price * (1.1 + r * 0.25)),
      sku: makeSku("FOOD", idx),
      stock: Math.floor(seededRandom(idx + 100) * 495) + 5,
      status: seededRandom(idx + 200) > 0.15 ? "ACTIVE" : "DRAFT",
      isFeatured: r < 0.2,
      categoryId: categoryMap["food-drinks"],
      brandId: p.brand,
    });
    idx++;
  });

  console.log(`   📦 Built ${products.length} products`);
  const expansionCatalog = [
    { category: "electronics", sku: "ELECX", brandPool: [brandMap.samsung, brandMap.oraimo, brandMap.hp, brandMap.lenovo], names: ["Noise Cancelling Headphones", "Portable Bluetooth Speaker", "Smart LED Projector", "Wireless Gaming Mouse", "USB-C Charging Dock", "Solar Power Station", "4K Action Camera", "Smart Home Security Camera", "LED Ring Light Kit", "Portable Karaoke Speaker"], basePrice: 18000 },
    { category: "phones", sku: "PHONX", brandPool: [brandMap.apple, brandMap.samsung, brandMap.tecno, brandMap.infinix], names: ["Android Smartphone 128GB", "Flagship Smartphone 256GB", "Budget 4G Smartphone", "Foldable Display Smartphone", "Gaming Smartphone", "Pro Camera Phone", "Dual SIM Smartphone", "Rugged Outdoor Phone", "5G Business Phone", "Compact Smartphone"], basePrice: 85000 },
    { category: "computers", sku: "COMPX", brandPool: [brandMap.hp, brandMap.lenovo, brandMap.apple, brandMap.samsung], names: ["Business Laptop 14-inch", "Gaming Laptop RTX Edition", "All-in-One Desktop", "Portable SSD 1TB", "Mechanical Keyboard", "USB-C Monitor", "Laptop Stand", "Wireless Office Mouse", "Mini Desktop PC", "Creator Laptop 16-inch"], basePrice: 45000 },
    { category: "fashion", sku: "FASHX", brandPool: [brandMap.nike, brandMap.adidas, brandMap.gucci], names: ["Ankara Midi Dress", "Leather Crossbody Bag", "Running Sneakers", "Cotton Polo Shirt", "Denim Jacket", "Athleisure Joggers", "Formal Loafers", "Streetwear Hoodie", "Canvas Tote Bag", "Performance Training Shorts"], basePrice: 6500 },
    { category: "home-kitchen", sku: "HOMEX", brandPool: [brandMap.samsung, brandMap.oraimo, brandMap.lenovo], names: ["Non-Stick Cookware Set", "Digital Air Fryer", "Stainless Blender", "Electric Pressure Cooker", "Compact Microwave", "Tabletop Gas Cooker", "Smart Robot Vacuum", "Ceramic Dinner Set", "Kitchen Storage Rack", "Electric Coffee Maker"], basePrice: 9000 },
    { category: "beauty", sku: "BTYX", brandPool: [brandMap.oraimo, brandMap.gucci, brandMap.samsung], names: ["Matte Lipstick Set", "Hydrating Face Serum", "Professional Hair Clipper", "Body Wave Hair Bundle", "Makeup Brush Kit", "Vitamin C Face Cream", "Sonic Facial Brush", "Perfume Gift Set", "Nail Care Kit", "Setting Spray"], basePrice: 3500 },
    { category: "sports", sku: "SPRTX", brandPool: [brandMap.nike, brandMap.adidas], names: ["Training Dumbbell Pair", "Yoga Mat Pro", "Running Shoe", "Football Training Ball", "Gym Duffel Bag", "Compression Tights", "Fitness Resistance Bands", "Basketball Jersey", "Tennis Racket", "Cycling Helmet"], basePrice: 5500 },
    { category: "books", sku: "BOOKX", brandPool: [brandMap.samsung, brandMap.hp], names: ["Business Strategy Book", "Personal Finance Guide", "Children Story Collection", "African Fiction Novel", "Startup Playbook", "Leadership Workbook", "Exam Prep Textbook", "Cookbook Collection", "Self Improvement Journal", "Tech Career Handbook"], basePrice: 2500 },
    { category: "toys", sku: "TOYX", brandPool: [brandMap.samsung, brandMap.lenovo], names: ["Building Blocks Set", "Remote Control Car", "Learning Tablet Toy", "Plush Animal Gift", "Kids Puzzle Board", "STEM Robot Kit", "Doll House Set", "Toy Kitchen Set", "Board Game Set", "Outdoor Bubble Machine"], basePrice: 3000 },
    { category: "automotive", sku: "AUTOX", brandPool: [brandMap.oraimo, brandMap.samsung], names: ["Car Phone Mount", "Dual USB Car Charger", "Dash Camera", "Portable Tire Inflator", "Car Vacuum Cleaner", "Jump Starter Pack", "Seat Organizer", "Wireless Car Charger", "Car Air Purifier", "Bluetooth FM Transmitter"], basePrice: 4500 },
    { category: "health", sku: "HLTHX", brandPool: [brandMap.oraimo, brandMap.infinix, brandMap.samsung], names: ["Digital Blood Pressure Monitor", "Smart Body Scale", "Pulse Oximeter", "Infrared Thermometer", "Massage Gun", "Fitness Smart Band", "First Aid Kit", "Nebulizer Machine", "Posture Corrector", "Sleep Eye Mask"], basePrice: 3500 },
    { category: "food-drinks", sku: "FOODX", brandPool: [brandMap.samsung, brandMap.tecno], names: ["Organic Coffee Beans", "Premium Fruit Juice", "Breakfast Cereal Pack", "Instant Noodles Carton", "Energy Drink Pack", "Baking Flour Bag", "Milk Powder Tin", "Snack Variety Box", "Herbal Tea Set", "Rice Value Pack"], basePrice: 1500 },
  ];

  const variants = ["Classic", "Premium", "Urban", "Family", "Pro", "Value", "Compact", "Deluxe", "Everyday", "Limited"];
  const targetExtraProducts = 300;
  for (let extra = 0; extra < targetExtraProducts; extra += 1) {
    const group = expansionCatalog[extra % expansionCatalog.length];
    const nameBase = group.names[Math.floor(extra / expansionCatalog.length) % group.names.length];
    const variant = variants[extra % variants.length];
    const edition = Math.floor(extra / group.names.length) + 1;
    const r = seededRandom(idx);
    const price = Math.round((group.basePrice + (extra % 25) * group.basePrice * 0.12 + r * group.basePrice * 0.8) / 100) * 100;
    const name = `${variant} ${nameBase} ${edition}`;

    products.push({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: `${name} with reliable quality, practical details, and marketplace-ready inventory for Kwikseller shoppers.`,
      price,
      comparePrice: Math.round(price * (1.12 + r * 0.22)),
      sku: makeSku(group.sku, idx),
      stock: Math.floor(seededRandom(idx + 100) * 240) + 10,
      status: seededRandom(idx + 200) > 0.08 ? "ACTIVE" : "DRAFT",
      isFeatured: extra % 11 === 0,
      categoryId: categoryMap[group.category],
      brandId: group.brandPool[extra % group.brandPool.length],
    });
    idx++;
  }

  console.log(`   Built ${products.length} products`);
  return products;
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
  console.log("🌱 Starting Kwikseller database seed...\n");

  // ── 1. Super Admin ──────────────────────────────────────────
  console.log("👤 Creating Super Admin...");

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email_role: {
        email: SUPER_ADMIN_CONFIG.email,
        role: UserRole.SUPER_ADMIN,
      },
    },
  });

  if (existingAdmin) {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_CONFIG.password, 12);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { passwordHash },
    });
    console.log("   ⚠️  Super Admin already exists — password updated\n");
  } else {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_CONFIG.password, 12);
    await prisma.user.create({
      data: {
        email: SUPER_ADMIN_CONFIG.email,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        profile: {
          create: {
            firstName: SUPER_ADMIN_CONFIG.firstName,
            lastName: SUPER_ADMIN_CONFIG.lastName,
          },
        },
        adminPermission: {
          create: {
            role: AdminRole.SUPER_ADMIN,
            permissions: "*",
            grantedBy: "system",
            isActive: true,
          },
        },
      },
    });
    console.log("   ✅ Super Admin created\n");
  }

  // ── 2. System Configurations ───────────────────────────────
  console.log("⚙️  Seeding system configurations...");
  for (const config of SYSTEM_CONFIGS) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log(`   ✅ ${SYSTEM_CONFIGS.length} system configurations seeded\n`);

  // ── 3. Vendor Milestones ───────────────────────────────────
  console.log("🏆 Seeding vendor milestones...");
  for (const milestone of VENDOR_MILESTONES) {
    await prisma.milestone.upsert({
      where: { key: milestone.key },
      update: milestone,
      create: milestone,
    });
  }
  console.log(`   ✅ ${VENDOR_MILESTONES.length} vendor milestones seeded\n`);

  // ── 4. Currencies ──────────────────────────────────────────
  console.log("💱 Seeding currencies...");
  for (const curr of CURRENCIES) {
    await prisma.currency.upsert({
      where: { code: curr.code },
      update: curr,
      create: curr,
    });
  }
  console.log(`   ✅ ${CURRENCIES.length} currencies seeded\n`);

  // ── 5. Clean up existing seed data ─────────────────────────
  console.log("🧹 Cleaning up existing seed data...");
  try {
    await db.inventoryReservation?.deleteMany();
    await db.fulfillment?.deleteMany();
    await db.payment?.deleteMany();
    await db.orderItem?.deleteMany();
    await db.order?.deleteMany();
    await db.cartItem?.deleteMany();
    await db.cart?.deleteMany();
    await db.digitalAsset?.deleteMany();
    await db.inventoryItem?.deleteMany();
    await db.vendorPoolOffer?.deleteMany();
    await db.poolCampaign?.deleteMany();
    await db.poolProduct?.deleteMany();

    // Delete product images first (depends on products)
    await prisma.productImage.deleteMany();
    console.log("   🗑️  Cleared product images");

    // Delete products
    const deletedProducts = await prisma.product.deleteMany();
    console.log(`   🗑️  Cleared ${deletedProducts.count} products`);

    // Delete brands
    const deletedBrands = await prisma.brand.deleteMany();
    console.log(`   🗑️  Cleared ${deletedBrands.count} brands`);

    // Delete categories (except those that might be referenced elsewhere)
    const deletedCategories = await prisma.category.deleteMany();
    console.log(`   🗑️  Cleared ${deletedCategories.count} categories`);
  } catch (error) {
    console.log("   ⚠️  Cleanup warning (may be first run):", error instanceof Error ? error.message : error);
  }

  // ── 6. Create Demo Vendor + Store ──────────────────────────
  console.log("\n🏪 Creating demo vendor and store...");

  const vendorPasswordHash = await bcrypt.hash("DemoVendor@2024!", 12);

  const vendor = await prisma.user.upsert({
    where: {
      email_role: {
        email: "vendor@kwikseller.com",
        role: UserRole.VENDOR,
      },
    },
    update: {},
    create: {
      email: "vendor@kwikseller.com",
      passwordHash: vendorPasswordHash,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          firstName: "Kwik",
          lastName: "Vendor",
          bio: "Official Kwikseller demo store — showcasing Nigerian & African products.",
        },
      },
      store: {
        create: {
          name: "Kwikseller Demo Store",
          slug: "kwikseller-demo-store",
          description: "Official demo store showcasing top Nigerian and African products across electronics, fashion, and lifestyle categories.",
          logoUrl: brandImageUrl("Kwikseller Demo Store logo"),
          bannerUrl: bannerImageUrl("Kwikseller Demo Store banner"),
          category: "Multi-category",
          isVerified: true,
          onboardingComplete: true,
          verificationStatus: "APPROVED" as any,
        },
      },
      subscription: {
        create: {
          plan: "SCALE" as any,
          status: "ACTIVE" as any,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          productLimit: 1000,
          autoRenew: false,
        },
      },
      kwikCoins: {
        create: {
          balance: 5000,
          totalEarned: 5000,
        },
      },
      wallet: {
        create: {
          availableBalance: 250000,
          pendingBalance: 50000,
          totalEarned: 500000,
        },
      },
    },
    include: { store: true },
  });

  if (!vendor.store) {
    // In case the store wasn't created (already existed but wasn't fetched)
    const store = await prisma.store.upsert({
      where: { slug: "kwikseller-demo-store" },
      update: {},
      create: {
        vendorId: vendor.id,
        name: "Kwikseller Demo Store",
        slug: "kwikseller-demo-store",
        description: "Official demo store showcasing top Nigerian and African products.",
        logoUrl: brandImageUrl("Kwikseller Demo Store logo"),
        bannerUrl: bannerImageUrl("Kwikseller Demo Store banner"),
        category: "Multi-category",
        isVerified: true,
        onboardingComplete: true,
      },
    });
    console.log(`   ✅ Demo vendor & store ready (Store ID: ${store.id})\n`);
  } else {
    console.log(`   ✅ Demo vendor & store ready (Store ID: ${vendor.store.id})\n`);
  }

  const storeId = vendor.store?.id || (await prisma.store.findUnique({ where: { slug: "kwikseller-demo-store" } }))!.id;

  const secondVendor = await prisma.user.upsert({
    where: {
      email_role: {
        email: "vendor2@kwikseller.com",
        role: UserRole.VENDOR,
      },
    },
    update: {},
    create: {
      email: "vendor2@kwikseller.com",
      passwordHash: vendorPasswordHash,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          firstName: "Amina",
          lastName: "Stores",
        },
      },
      store: {
        create: {
          name: "Amina Urban Market",
          slug: "amina-urban-market",
          description: "A second demo vendor for split checkout testing across fashion, digital, and lifestyle products.",
          logoUrl: brandImageUrl("Amina Urban Market logo"),
          bannerUrl: bannerImageUrl("Amina Urban Market banner"),
          category: "Lifestyle",
          isVerified: true,
          onboardingComplete: true,
        },
      },
      kwikCoins: {
        create: {
          balance: 3000,
          totalEarned: 3000,
        },
      },
      wallet: {
        create: {
          availableBalance: 125000,
          pendingBalance: 15000,
          totalEarned: 220000,
        },
      },
    },
    include: { store: true },
  });

  if (!secondVendor.store) {
    await prisma.store.upsert({
      where: { slug: "amina-urban-market" },
      update: {},
      create: {
        vendorId: secondVendor.id,
        name: "Amina Urban Market",
        slug: "amina-urban-market",
        description: "A second demo vendor for split checkout testing across fashion, digital, and lifestyle products.",
        logoUrl: brandImageUrl("Amina Urban Market logo"),
        bannerUrl: bannerImageUrl("Amina Urban Market banner"),
        category: "Lifestyle",
        isVerified: true,
        onboardingComplete: true,
      },
    });
  }

  const secondStore = await prisma.store.findUnique({ where: { slug: "amina-urban-market" } });
  const secondStoreId = secondStore!.id;
  await db.storefrontDesign?.upsert({
    where: { storeId: secondStoreId },
    update: {
      themePreset: "FRESH",
      primaryColor: "#064E3B",
      accentColor: "#14B8A6",
      heroTitle: "Amina Urban Market",
      heroSubtitle: "Curated lifestyle essentials, vendor stock, and digital guides for modern buyers.",
      sections: JSON.stringify(["hero", "products", "policies"]),
    },
    create: {
      storeId: secondStoreId,
      themePreset: "FRESH",
      primaryColor: "#064E3B",
      accentColor: "#14B8A6",
      heroTitle: "Amina Urban Market",
      heroSubtitle: "Curated lifestyle essentials, vendor stock, and digital guides for modern buyers.",
      sections: JSON.stringify(["hero", "products", "policies"]),
    },
  });
  console.log(`   ✅ Second demo vendor ready for split checkout (Store ID: ${secondStoreId})\n`);

  // ── 7. Create 10 Brands ────────────────────────────────────
  console.log("🏷️  Creating 10 brands...");
  for (const brand of BRANDS) {
    await prisma.brand.create({
      data: {
        ...brand,
        image: brandImageUrl(brand.name),
      },
    });
  }
  console.log(`   ✅ ${BRANDS.length} brands created\n`);

  // Build brand lookup
  const brandRecords = await prisma.brand.findMany();
  const brandMap: Record<string, string> = {};
  for (const b of brandRecords) {
    brandMap[b.slug] = b.id;
  }

  // ── 8. Create 12 Categories ────────────────────────────────
  console.log("📂 Creating 12 categories...");
  for (const category of CATEGORIES) {
    await prisma.category.create({
      data: { ...category, imageUrl: imageUrl(category.name), isActive: true },
    });
  }
  console.log(`   ✅ ${CATEGORIES.length} categories created\n`);

  // Build category lookup
  const categoryRecords = await prisma.category.findMany();
  const categoryMap: Record<string, string> = {};
  for (const c of categoryRecords) {
    categoryMap[c.slug] = c.id;
  }

  // ── 9. Create 100 Products ─────────────────────────────────
  console.log("🛍️  Building 100 products...");
  const products = await buildProducts(categoryMap, brandMap, storeId);

  console.log("   ⏳ Inserting products into database...");
  let insertedCount = 0;

  // Insert products in batches for efficiency
  const BATCH_SIZE = 20;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    await prisma.product.createMany({
      data: batch.map((p) => ({
        storeId,
        name: p.name,
        slug: `${p.slug}-${Math.random().toString(36).substring(2, 7)}`,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        sku: p.sku,
        stock: p.stock,
        productType: "PHYSICAL",
        productSource: "VENDOR_STOCK",
        inventoryPolicy: "TRACKED",
        requiresShipping: true,
        trackInventory: true,
        status: p.status as ProductStatus,
        categoryId: p.categoryId,
        brandId: p.brandId,
        isFeatured: p.isFeatured,
      })) as any,
    });
    insertedCount += batch.length;
    process.stdout.write(`   📊 ${insertedCount}/${products.length} products inserted\r`);
  }
  console.log(`   ✅ ${insertedCount} products inserted\n`);

  // ── 10. Create Product Images ──────────────────────────────
  console.log("🖼️  Creating product images...");

  // Get all products to assign images
  const allProducts = await prisma.product.findMany({
    where: { storeId },
    select: { id: true, name: true, slug: true, sku: true, stock: true },
  });

  console.log("📦 Creating inventory records...");
  await db.inventoryItem?.createMany({
    data: allProducts.map((product) => ({
      productId: product.id,
      storeId,
      sku: product.sku,
      available: product.stock,
      reserved: 0,
      lowStockThreshold: 5,
      policy: "TRACKED",
    })),
  });
  console.log(`   ✅ ${allProducts.length} inventory records created\n`);

  const secondStoreProducts = await Promise.all([
    db.product?.create({
      data: {
        storeId: secondStoreId,
        name: "Amina Ankara Tote Bag",
        slug: `amina-ankara-tote-bag-${Math.random().toString(36).substring(2, 7)}`,
        description: "A physical product from the second demo vendor for multi-vendor checkout testing.",
        price: 18500,
        comparePrice: 24000,
        sku: "AMINA-TOTE-0001",
        stock: 42,
        productType: "PHYSICAL",
        productSource: "VENDOR_STOCK",
        inventoryPolicy: "TRACKED",
        requiresShipping: true,
        trackInventory: true,
        status: ProductStatus.ACTIVE,
        categoryId: categoryMap.fashion,
        isFeatured: true,
        inventoryItems: {
          create: {
            storeId: secondStoreId,
            sku: "AMINA-TOTE-0001",
            available: 42,
            reserved: 0,
            lowStockThreshold: 6,
            policy: "TRACKED",
          },
        },
      } as any,
    }),
    db.product?.create({
      data: {
        storeId: secondStoreId,
        name: "Amina Style Capsule Lookbook",
        slug: `amina-style-capsule-lookbook-${Math.random().toString(36).substring(2, 7)}`,
        description: "Digital lookbook from a second vendor; useful for testing mixed physical and digital carts.",
        price: 4500,
        comparePrice: 7000,
        sku: "AMINA-DIGI-0001",
        stock: 0,
        productType: "DIGITAL",
        productSource: "VENDOR_STOCK",
        inventoryPolicy: "UNLIMITED",
        requiresShipping: false,
        trackInventory: false,
        status: ProductStatus.ACTIVE,
        categoryId: categoryMap.fashion,
        digitalAssets: {
          create: {
            deliveryType: "DOWNLOAD",
            name: "Amina Style Capsule PDF",
            fileUrl: "https://example.com/kwikseller/amina-style-capsule.pdf",
            maxDownloads: 5,
            expiresAfterDays: 30,
          },
        },
      } as any,
    }),
  ]);
  console.log("   ✅ Second vendor physical and digital products created for split checkout testing\n");

  console.log("💾 Creating digital and Pool commerce samples...");
  const digitalProduct = await db.product?.create({
    data: {
      storeId,
      name: "Kwikseller Vendor Growth Playbook",
      slug: `kwikseller-vendor-growth-playbook-${Math.random().toString(36).substring(2, 7)}`,
      description: "A downloadable guide for vendors learning product listing, pricing, fulfillment, and Pool resale.",
      price: 7500,
      comparePrice: 12000,
      sku: "DIGI-0001",
      stock: 0,
      productType: "DIGITAL",
      productSource: "VENDOR_STOCK",
      inventoryPolicy: "UNLIMITED",
      requiresShipping: false,
      trackInventory: false,
      status: ProductStatus.ACTIVE,
      categoryId: categoryMap.books,
      isFeatured: true,
      digitalAssets: {
        create: {
          deliveryType: "DOWNLOAD",
          name: "Vendor Growth Playbook PDF",
          fileUrl: "https://example.com/kwikseller/vendor-growth-playbook.pdf",
          maxDownloads: 5,
          expiresAfterDays: 30,
        },
      },
    } as any,
  });

  const poolProduct = await db.poolProduct?.create({
    data: {
      name: "Pool Pack: Oraimo Smart Accessories",
      description: "Admin Pool Catalog sample for vendor resale with markup.",
      wholesalePrice: 18000,
      suggestedRetailPrice: 24500,
      productType: "PHYSICAL",
      status: "ACTIVE",
      categoryId: categoryMap.electronics,
      category: "Electronics",
      stock: 300,
      images: JSON.stringify([imageUrl("Oraimo Pool Pack", "10b981")]),
      isActive: true,
    },
  });

  await db.inventoryItem?.create({
    data: {
      poolProductId: poolProduct.id,
      storeId: null,
      sku: "POOL-ORAIMO-0001",
      available: 300,
      reserved: 0,
      lowStockThreshold: 25,
      policy: "TRACKED",
    },
  });

  const poolListing = await db.product?.create({
    data: {
      storeId,
      poolProductId: poolProduct.id,
      name: "Oraimo Smart Accessories Pool Resale Pack",
      slug: `oraimo-smart-accessories-pool-resale-${Math.random().toString(36).substring(2, 7)}`,
      description: "Vendor storefront listing backed by the Admin Pool Catalog.",
      price: 24500,
      comparePrice: 28000,
      sku: "POOL-LIST-0001",
      stock: 0,
      productType: "PHYSICAL",
      productSource: "POOL_RESALE",
      inventoryPolicy: "TRACKED",
      requiresShipping: true,
      trackInventory: true,
      status: ProductStatus.ACTIVE,
      categoryId: categoryMap.electronics,
      isPoolProduct: true,
      isFeatured: true,
    } as any,
  });

  await db.vendorPoolOffer?.create({
    data: {
      storeId,
      poolProductId: poolProduct.id,
      productId: poolListing.id,
      retailPrice: 24500,
      markup: 6500,
      status: "ACTIVE",
      isActive: true,
    },
  });

  await db.poolCampaign?.create({
    data: {
      poolProductId: poolProduct.id,
      title: "Group Buy: Smart Accessories Starter Pack",
      targetQuantity: 10,
      committedQuantity: 0,
      unitPrice: 21500,
      status: "SCHEDULED",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`   ✅ Digital sample created (${digitalProduct.name})`);
  console.log("   ✅ Pool catalog, vendor offer, and group-buy campaign samples created\n");

  const imageColors = ["f97316", "10b981", "8b5cf6", "ef4444", "06b6d4", "ec4899", "14b8a6", "f59e0b"];

  const productsForImages = [...allProducts, ...secondStoreProducts.filter(Boolean)];
  const imageData = productsForImages.flatMap((product) => {
    const shortName = product.name.length > 20 ? product.name.substring(0, 18) + "…" : product.name;
    const color = imageColors[product.id.length % imageColors.length];

    return [
      {
        productId: product.id,
        url: imageUrl(shortName, color),
        alt: product.name,
        position: 0,
        isMain: true,
      },
      {
        productId: product.id,
        url: imageUrl(`${shortName}-2`, "374151"),
        alt: `${product.name} - View 2`,
        position: 1,
        isMain: false,
      },
      {
        productId: product.id,
        url: imageUrl(`${shortName}-3`, "1e3a5f"),
        alt: `${product.name} - View 3`,
        position: 2,
        isMain: false,
      },
    ];
  });

  const IMAGE_BATCH_SIZE = 100;
  for (let i = 0; i < imageData.length; i += IMAGE_BATCH_SIZE) {
    const batch = imageData.slice(i, i + IMAGE_BATCH_SIZE);
    await prisma.productImage.createMany({ data: batch });
  }

  console.log(`   ✅ ${imageData.length} product images created\n`);

  // ── Summary ────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════");
  // ── 11. Create Admin User ─────────────────────────────────
  console.log("\n👤 Creating admin user...");

  const adminExisting = await prisma.user.findUnique({
    where: {
      email_role: {
        email: "admin@kwikseller.com",
        role: UserRole.ADMIN,
      },
    },
  });

  if (!adminExisting) {
    const adminHash = await bcrypt.hash("Admin123!", 12);
    await prisma.user.create({
      data: {
        email: "admin@kwikseller.com",
        passwordHash: adminHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        profile: {
          create: {
            firstName: "Admin",
            lastName: "User",
          },
        },
        adminPermission: {
          create: {
            role: AdminRole.SUPER_ADMIN,
            permissions: "*",
            grantedBy: "system",
            isActive: true,
          },
        },
      },
    });
    console.log("   ✅ Admin user created (admin@kwikseller.com / Admin123!)\n");
  } else {
    console.log("   ⚠️  Admin user already exists\n");
  }

  // ── 12. Create Banners ───────────────────────────────────
  console.log("🖼️  Creating banners...");
  await prisma.banner.deleteMany();

  const BANNERS = [
    {
      title: "Summer Electronics Sale",
      subTitle: "Up to 30% off on top electronics brands",
      image: bannerImageUrl("Summer Electronics Sale"),
      url: "/categories/electronics",
      bannerType: "MAIN_BANNER" as const,
      backgroundColor: "#f97316",
      buttonText: "Shop Now",
      position: 1,
      isActive: true,
    },
    {
      title: "New Fashion Collection",
      subTitle: "Discover the latest trends in Nigerian fashion",
      image: bannerImageUrl("New Fashion Collection"),
      url: "/categories/fashion",
      bannerType: "MAIN_BANNER" as const,
      backgroundColor: "#ec4899",
      buttonText: "Explore",
      position: 2,
      isActive: true,
    },
    {
      title: "Flash Deals This Week",
      subTitle: "Limited time offers on phones and gadgets",
      image: bannerImageUrl("Flash Deals This Week"),
      url: "/deals",
      bannerType: "PROMO_BANNER" as const,
      resourceType: "category",
      backgroundColor: "#10b981",
      buttonText: "View Deals",
      position: 3,
      isActive: true,
    },
  ];

  for (const banner of BANNERS) {
    await prisma.banner.create({ data: banner });
  }
  console.log(`   ✅ ${BANNERS.length} banners created\n`);

  // ── 13. Create Deals ─────────────────────────────────────
  console.log("🏷️  Creating deals...");
  await prisma.dealProduct.deleteMany();
  await prisma.deal.deleteMany();

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const DEALS = [
    {
      title: "Flash Sale - 25% Off Electronics",
      description: "Get 25% off on all electronics this week only",
      dealType: "FLASH_DEAL" as const,
      discountType: "PERCENTAGE" as const,
      discountValue: 25,
      startDate: now,
      endDate: weekLater,
      minOrderValue: 5000,
      maxUses: 500,
      isActive: true,
    },
    {
      title: "Free Shipping on Orders Over ₦10,000",
      description: "Enjoy free delivery on all orders above ₦10,000",
      dealType: "FEATURED_DEAL" as const,
      discountType: "FIXED_AMOUNT" as const,
      discountValue: 500,
      startDate: now,
      endDate: monthLater,
      minOrderValue: 10000,
      isActive: true,
    },
  ];

  for (const deal of DEALS) {
    await prisma.deal.create({ data: deal });
  }
  console.log(`   ✅ ${DEALS.length} deals created\n`);

  // ── 14. Create Coupons ───────────────────────────────────
  console.log("🎫 Creating coupons...");
  await prisma.coupon.deleteMany();

  const COUPONS = [
    {
      code: "WELCOME10",
      title: "10% Welcome Discount",
      description: "Get 10% off your first order",
      discountType: "PERCENTAGE" as const,
      discountValue: 10,
      minOrderValue: 2000,
      maxDiscount: 5000,
      maxUses: 1000,
      applicableTo: "all",
      startDate: now,
      endDate: monthLater,
      isActive: true,
    },
    {
      code: "FLASH20",
      title: "20% Flash Sale Coupon",
      description: "Extra 20% off during flash sales",
      discountType: "PERCENTAGE" as const,
      discountValue: 20,
      minOrderValue: 5000,
      maxDiscount: 10000,
      maxUses: 200,
      applicableTo: "specific_categories",
      applicableIds: JSON.stringify(["electronics", "phones"]),
      startDate: now,
      endDate: weekLater,
      isActive: true,
    },
  ];

  for (const coupon of COUPONS) {
    await prisma.coupon.create({ data: coupon });
  }
  console.log(`   ✅ ${COUPONS.length} coupons created\n`);

  console.log("✅ Kwikseller database seed completed successfully!");
  console.log("══════════════════════════════════════════════════\n");

  const stats = {
    brands: await prisma.brand.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    productImages: await prisma.productImage.count(),
    featuredProducts: await prisma.product.count({ where: { isFeatured: true } }),
    activeProducts: await prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    draftProducts: await prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
    inventoryItems: await db.inventoryItem?.count(),
    digitalAssets: await db.digitalAsset?.count(),
    poolProducts: await db.poolProduct?.count(),
    poolOffers: await db.vendorPoolOffer?.count(),
    poolCampaigns: await db.poolCampaign?.count(),
    currencies: await prisma.currency.count(),
  };

  console.log("📊 SEED SUMMARY:");
  console.log(`   🏷️  Brands:           ${stats.brands}`);
  console.log(`   📂 Categories:       ${stats.categories}`);
  console.log(`   🛍️  Products:         ${stats.products}`);
  console.log(`   🖼️  Product Images:   ${stats.productImages}`);
  console.log(`   ⭐ Featured:         ${stats.featuredProducts}`);
  console.log(`   ✅ Active:           ${stats.activeProducts}`);
  console.log(`   📝 Draft:            ${stats.draftProducts}`);
  console.log(`   📦 Inventory Items:  ${stats.inventoryItems ?? 0}`);
  console.log(`   💾 Digital Assets:   ${stats.digitalAssets ?? 0}`);
  console.log(`   🏊 Pool Products:    ${stats.poolProducts ?? 0}`);
  console.log(`   🏪 Pool Offers:      ${stats.poolOffers ?? 0}`);
  console.log(`   👥 Pool Campaigns:   ${stats.poolCampaigns ?? 0}`);
  console.log(`   💱 Currencies:       ${stats.currencies}\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 DEMO ACCOUNTS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   Super Admin:");
  console.log(`     Email:    ${SUPER_ADMIN_CONFIG.email}`);
  console.log(`     Password: ${SUPER_ADMIN_CONFIG.password}`);
  console.log("   Demo Vendor:");
  console.log("     Email:    vendor@kwikseller.com");
  console.log("     Password: DemoVendor@2024!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ============================================================
// RUN
// ============================================================
main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
