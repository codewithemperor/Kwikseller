import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  CarFront,
  Headset,
  HeartPulse,
  Home,
  ShieldCheck,
  Shirt,
  Smartphone,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

export interface MarketplaceCategory {
  id: string;
  name: string;
  itemCount: string;
  description: string;
  image: string;
  icon: LucideIcon;
}

export interface MarketplaceReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
}

export interface MarketplaceTrustItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface MarketplaceHeroBanner {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  badge: string;
}

export interface MarketplacePromoBanner {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
}

export interface MarketplaceSeller {
  id: string;
  name: string;
  tagline: string;
  image: string;
  logo: string;
  location: string;
  rating: number;
  productCount: string;
}

export interface MarketplaceBrand {
  id: string;
  name: string;
  image: string;
  href: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  store: string;
  category: string;
  isNew?: boolean;
  tag?: string;
  dimensions?: string;
  description?: string;
  images?: string[];
  features?: string[];
  specifications?: Array<{ label: string; value: string }>;
  reviews?: MarketplaceReview[];
}

export const marketplaceSearchSuggestions = [
  "Search for phones",
  "Search for fashion",
  "Search for skincare",
  "Search for kitchen items",
];

export const marketplaceCategories: MarketplaceCategory[] = [
  {
    id: "fashion",
    name: "Fashion",
    itemCount: "12,500+ items",
    description: "Clothing, shoes, bags and wardrobe essentials.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    icon: Shirt,
  },
  {
    id: "electronics",
    name: "Electronics",
    itemCount: "8,200+ items",
    description: "Phones, gadgets, accessories and home electronics.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    icon: Smartphone,
  },
  {
    id: "beauty",
    name: "Beauty & Health",
    itemCount: "6,100+ items",
    description: "Skincare, wellness, makeup and personal care.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    icon: HeartPulse,
  },
  {
    id: "home",
    name: "Home & Living",
    itemCount: "9,300+ items",
    description: "Furniture, kitchenware, decor and home needs.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    icon: Home,
  },
  {
    id: "food",
    name: "Food & Groceries",
    itemCount: "15,000+ items",
    description: "Fresh staples, pantry items, snacks and beverages.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    icon: UtensilsCrossed,
  },
  {
    id: "auto",
    name: "Automobile",
    itemCount: "4,700+ items",
    description: "Accessories, maintenance items and car essentials.",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
    icon: CarFront,
  },
];

export const marketplaceTrustItems: MarketplaceTrustItem[] = [
  {
    id: "escrow",
    title: "Escrow Protected",
    description: "Your money stays secure until delivery is confirmed.",
    icon: ShieldCheck,
  },
  {
    id: "delivery",
    title: "Fast Delivery",
    description: "Reliable delivery options across major cities.",
    icon: Truck,
  },
  {
    id: "deals",
    title: "Best Deals",
    description: "Daily discounts on trusted products and brands.",
    icon: BadgePercent,
  },
  {
    id: "support",
    title: "Responsive Support",
    description: "Get help quickly whenever you need assistance.",
    icon: Headset,
  },
];

export const marketplaceHeroBanners: MarketplaceHeroBanner[] = [
  {
    id: "hero-1",
    title: "Big home deals up to 50% off",
    subtitle: "Shop furniture, decor and storage essentials from top sellers.",
    href: "/products/home-1",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    badge: "Home deals",
  },
  {
    id: "hero-2",
    title: "Upgrade your everyday tech",
    subtitle: "Phones, earbuds and smart devices with secure checkout.",
    href: "/products/tech-1",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
    badge: "Tech picks",
  },
  {
    id: "hero-3",
    title: "Fresh fashion arrivals this week",
    subtitle: "Discover standout pieces from trusted African fashion stores.",
    href: "/products/fashion-1",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80",
    badge: "Fashion",
  },
];

export const marketplacePromoBanners: MarketplacePromoBanner[] = [
  {
    id: "promo-1",
    title: "Weekend clearance sale",
    subtitle: "Extra discounts on selected categories",
    href: "/products/clearance-1",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "promo-2",
    title: "Kitchen upgrade essentials",
    subtitle: "Cookware, appliances and pantry picks",
    href: "/products/kitchen-1",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80",
  },
];

const baseMarketplaceReviews: MarketplaceReview[] = [
  {
    id: "review-1",
    name: "Amina K.",
    location: "Lagos, Nigeria",
    rating: 5,
    text: "The marketplace feels safer to shop from because the product details are clear and checkout is straightforward.",
  },
  {
    id: "review-2",
    name: "Joseph M.",
    location: "Nairobi, Kenya",
    rating: 5,
    text: "I like how easy it is to compare products quickly without too much clutter on the page.",
  },
  {
    id: "review-3",
    name: "Fatou D.",
    location: "Accra, Ghana",
    rating: 4,
    text: "The categories are easier to understand now, and product cards show the information I actually need before clicking.",
  },
];

export const marketplaceReviews = baseMarketplaceReviews;

export const marketplaceProducts: MarketplaceProduct[] = [
  {
    id: "chair-1",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "home",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description:
      "A clean modern chair with a warm oak finish, designed for compact living rooms, waiting areas and reading corners.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
    ],
    features: [
      "Solid oak frame",
      "Smooth matte finish",
      "Compact footprint for apartments",
      "Easy to pair with side tables and lounges",
    ],
    specifications: [
      { label: "Material", value: "Oak wood" },
      { label: "Width", value: "58 cm" },
      { label: "Height", value: "79 cm" },
      { label: "Depth", value: "60 cm" },
      { label: "Assembly", value: "No assembly required" },
    ],
    reviews: baseMarketplaceReviews,
  },
  {
    id: "chair-2",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "featured",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description: "Premium oak chair with a minimalist silhouette.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["Solid oak frame", "Minimal silhouette"],
    specifications: [{ label: "Material", value: "Oak wood" }],
    reviews: baseMarketplaceReviews,
  },
  {
    id: "chair-3",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "featured",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description: "Premium oak chair with a minimalist silhouette.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["Solid oak frame", "Minimal silhouette"],
    specifications: [{ label: "Material", value: "Oak wood" }],
    reviews: baseMarketplaceReviews,
  },
  {
    id: "chair-4",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "deals",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description: "Premium oak chair with a minimalist silhouette.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["Solid oak frame", "Minimal silhouette"],
    specifications: [{ label: "Material", value: "Oak wood" }],
    reviews: baseMarketplaceReviews,
  },
  {
    id: "chair-5",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "new",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description: "Premium oak chair with a minimalist silhouette.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["Solid oak frame", "Minimal silhouette"],
    specifications: [{ label: "Material", value: "Oak wood" }],
    reviews: baseMarketplaceReviews,
  },
  {
    id: "chair-6",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "new",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description: "Premium oak chair with a minimalist silhouette.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["Solid oak frame", "Minimal silhouette"],
    specifications: [{ label: "Material", value: "Oak wood" }],
    reviews: baseMarketplaceReviews,
  },
  {
    id: "chair-7",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "related",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description: "Premium oak chair with a minimalist silhouette.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["Solid oak frame", "Minimal silhouette"],
    specifications: [{ label: "Material", value: "Oak wood" }],
    reviews: baseMarketplaceReviews,
  },
  {
    id: "chair-8",
    name: "Merano Accent Chair",
    price: 199000,
    comparePrice: 399000,
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviewCount: 148,
    store: "Oak Living",
    category: "related",
    tag: "Oak",
    dimensions: "58 x 79 x 60",
    description: "Premium oak chair with a minimalist silhouette.",
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["Solid oak frame", "Minimal silhouette"],
    specifications: [{ label: "Material", value: "Oak wood" }],
    reviews: baseMarketplaceReviews,
  },
];

export const marketplaceFeaturedProducts = marketplaceProducts.filter(
  (product) => product.category === "featured",
);

export const marketplaceFeaturedDeals = marketplaceProducts.filter(
  (product) => product.category === "deals",
);

export const marketplaceNewArrivals = marketplaceProducts.filter(
  (product) => product.category === "new",
);

export const marketplaceRelatedProducts = marketplaceProducts.filter(
  (product) => product.category === "related",
);

export const marketplaceTrendingFilters = [
  { label: "All", value: "all" },
  { label: "Featured", value: "featured" },
  { label: "Deals", value: "deals" },
  { label: "New arrivals", value: "new" },
];

export const marketplaceTrendingProducts = marketplaceProducts.filter((product) =>
  ["featured", "deals", "new"].includes(product.category),
);

export const marketplaceTopSellers: MarketplaceSeller[] = [
  {
    id: "seller-1",
    name: "Oak Living",
    tagline: "Premium furniture and home decor",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    logo:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=300&q=80",
    location: "Lagos, Nigeria",
    rating: 4.9,
    productCount: "240 products",
  },
  {
    id: "seller-2",
    name: "Studio Casa",
    tagline: "Curated lifestyle furniture and decor",
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
    logo:
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=300&q=80",
    location: "Accra, Ghana",
    rating: 4.8,
    productCount: "180 products",
  },
  {
    id: "seller-3",
    name: "Casa Modern",
    tagline: "Modern chairs, tables and office pieces",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    logo:
      "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=300&q=80",
    location: "Nairobi, Kenya",
    rating: 4.7,
    productCount: "315 products",
  },
];

export const marketplaceBrands: MarketplaceBrand[] = [
  {
    id: "brand-1",
    name: "Oak Living",
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=300&q=80",
    href: "/brands/oak-living",
  },
  {
    id: "brand-2",
    name: "Studio Casa",
    image:
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=300&q=80",
    href: "/brands/studio-casa",
  },
  {
    id: "brand-3",
    name: "Casa Modern",
    image:
      "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=300&q=80",
    href: "/brands/casa-modern",
  },
  {
    id: "brand-4",
    name: "Nord Home",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80",
    href: "/brands/nord-home",
  },
];

export function getMarketplaceProduct(productId: string) {
  return marketplaceProducts.find((product) => product.id === productId);
}
