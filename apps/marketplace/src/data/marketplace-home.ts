/**
 * marketplace-home.ts
 * Types for marketplace home page components.
 * ALL data comes from the API — no mock/dummy data.
 */

import type { LucideIcon } from "lucide-react";

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug?: string;
  itemCount: string;
  description: string;
  image: string;
  icon?: LucideIcon;
}

export interface MarketplaceReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  createdAt?: string;
  title?: string;
  verified?: boolean;
  helpful?: number;
  images?: string[];
  vendorReply?: {
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  };
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
  slug?: string;
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

export interface ProductVariant {
  id: string;
  name: string;
  options: string;
  price: number;
  stock: number;
}

export interface MarketplaceProduct {
  id: string;
  slug?: string;
  name: string;
  price: number;
  comparePrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  store: string;
  storeId?: string;
  storeSlug?: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  productType?: "PHYSICAL" | "DIGITAL";
  productSource?: "VENDOR_STOCK" | "POOL_RESALE" | "GROUP_BUY";
  requiresShipping?: boolean;
  trackInventory?: boolean;
  lowStock?: number;
  poolProductId?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  tag?: string;
  tags?: string[];
  inStock?: boolean;
  dimensions?: string;
  description?: string;
  images?: string[];
  features?: string[];
  specifications?: Array<{ label: string; value: string }>;
  reviews?: MarketplaceReview[];
  variants?: ProductVariant[];
  stock?: number;
}

export const marketplaceTrendingProducts: MarketplaceProduct[] = [];

export const marketplaceTrendingFilters: Array<{
  id: string;
  label: string;
  value: string;
}> = [];
