/**
 * marketplace.ts
 * ────────────────────────────────────────────────────────────────────────────
 * General marketplace constants: currency/locale, search history config, search
 * trending/preset data, category sort options, category style mapping, and the
 * orders-list filter tabs + status buckets. Components import these instead of
 * inlining them.
 *
 * NOTE: color classes referenced here are Tailwind utilities mapped to the
 * unified OKLCH design tokens. No raw hex values.
 */

import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BookOpen,
  Camera,
  Car,
  Clapperboard,
  Dog,
  Dumbbell,
  Gamepad2,
  Gem,
  Headphones,
  HeartPulse,
  Home as HomeIcon,
  Laptop,
  Music,
  Palette,
  Package,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sparkles,
  Trophy,
  UtensilsCrossed,
  Watch,
} from "lucide-react";
import type { SearchAutoSuggestItem } from "@kwikseller/ui";

// ─── Locale & currency ─────────────────────────────────────────────────────

/** BCP-47 locale used for currency/date formatting across the marketplace UI. */
export const MARKETPLACE_LOCALE = "en-NG";
/** ISO 4217 currency code used for all price formatting. */
export const MARKETPLACE_CURRENCY = "NGN";
/** Currency symbol rendered inline (cart totals, product cards, etc.). */
export const MARKETPLACE_CURRENCY_SYMBOL = "₦";

// ─── Search history (localStorage) ─────────────────────────────────────────

/**
 * localStorage key shared by the SearchAutoSuggest dropdown, the
 * EnhancedSearchOverlay, and the home-feed-page search-history widget. Keeping
 * it in one place prevents the three call sites from drifting.
 */
export const SEARCH_HISTORY_KEY = "kwikseller-search-history";
/** Maximum number of recent-search entries persisted to localStorage. */
export const SEARCH_HISTORY_MAX = 8;

// ─── Trending categories (search dropdown) ─────────────────────────────────

/**
 * Categories shown in the SearchAutoSuggest "Trending categories" list when the
 * dropdown opens with no query. Rendered as `SearchAutoSuggestItem[]`.
 */
export const TRENDING_SEARCH_CATEGORIES: SearchAutoSuggestItem[] = [
  { type: "category", text: "Fashion", subtext: "12K+ items" },
  { type: "category", text: "Electronics", subtext: "8K+ items" },
  { type: "category", text: "Phones", subtext: "10K+ items" },
  { type: "category", text: "Beauty", subtext: "6K+ items" },
  { type: "category", text: "Home & Garden", subtext: "9K+ items" },
  { type: "category", text: "Food & Drinks", subtext: "15K+ items" },
];

export interface FallbackSearchSuggestion {
  name: string;
  category: string;
  meta: string;
}

/**
 * Local fallback product-name suggestions used by SearchAutoSuggest when the
 * live productsApi search call fails or returns no results. Fed to the
 * similarity matcher (getSimilarSuggestions).
 */
export const FALLBACK_SEARCH_SUGGESTIONS: FallbackSearchSuggestion[] = [
  { name: "Ankara dresses", category: "Fashion", meta: "Popular" },
  { name: "Wireless earbuds", category: "Electronics", meta: "Trending" },
  { name: "iPhone 15", category: "Phones", meta: "Popular" },
  { name: "Brazilian hair", category: "Beauty", meta: "Trending" },
  { name: "Samsung TV", category: "Electronics", meta: "Popular" },
  { name: "Jordans", category: "Fashion", meta: "Popular" },
  { name: "Power bank", category: "Electronics", meta: "Trending" },
  { name: "Home furniture", category: "Home & Garden", meta: "Popular" },
];

// ─── Enhanced search overlay presets ───────────────────────────────────────

export interface TrendingSearchTerm {
  term: string;
  count: string;
}

/** "Trending searches" pills shown in the EnhancedSearchOverlay default state. */
export const TRENDING_SEARCH_TERMS: TrendingSearchTerm[] = [
  { term: "Ankara dresses", count: "12.5K results" },
  { term: "Wireless earbuds", count: "8.3K results" },
  { term: "iPhone 15", count: "15.2K results" },
  { term: "Brazilian hair", count: "6.7K results" },
  { term: "Samsung TV", count: "9.1K results" },
  { term: "Jordans", count: "11.8K results" },
];

export interface PopularCategoryTile {
  icon: LucideIcon;
  name: string;
  count: string;
  color: string;
}

/** Popular-category tiles rendered in the EnhancedSearchOverlay default state. */
export const POPULAR_SEARCH_CATEGORIES: PopularCategoryTile[] = [
  { icon: Shirt, name: "Fashion", count: "12K+", color: "bg-pink-500/10 text-pink-500" },
  { icon: Smartphone, name: "Electronics", count: "8K+", color: "bg-cyan-500/10 text-cyan-500" },
  { icon: Gem, name: "Beauty", count: "6K+", color: "bg-purple-500/10 text-purple-500" },
  { icon: HomeIcon, name: "Home & Garden", count: "9K+", color: "bg-amber-500/10 text-amber-500" },
  { icon: Smartphone, name: "Phones", count: "10K+", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: UtensilsCrossed, name: "Food & Drinks", count: "15K+", color: "bg-orange-500/10 text-orange-500" },
];

export interface SearchProductSuggestion {
  name: string;
  price: string;
  category: string;
  initials: string;
  color: string;
}

/**
 * Hardcoded product suggestions shown by the EnhancedSearchOverlay when the
 * user types a query. Filtered client-side by substring match with a similarity
 * fallback via getSimilarSuggestions.
 */
export const SEARCH_PRODUCT_SUGGESTIONS: SearchProductSuggestion[] = [
  { name: "Ankara Maxi Dress", price: "₦8,500", category: "Fashion", initials: "AM", color: "bg-pink-500" },
  { name: "iPhone 15 Pro Max", price: "₦850,000", category: "Phones", initials: "IP", color: "bg-gray-800" },
  { name: 'Samsung 55" Smart TV', price: "₦320,000", category: "Electronics", initials: "ST", color: "bg-blue-600" },
  { name: "Brazilian Body Wave Hair", price: "₦45,000", category: "Beauty", initials: "BH", color: "bg-purple-500" },
  { name: "AirPods Pro 2nd Gen", price: "₦95,000", category: "Electronics", initials: "AP", color: "bg-gray-700" },
  { name: "Jordans Retro 4", price: "₦180,000", category: "Fashion", initials: "JR", color: "bg-red-500" },
  { name: "Whitening Face Cream", price: "₦3,500", category: "Beauty", initials: "WF", color: "bg-rose-400" },
  { name: "King Size Bed Frame", price: "₦150,000", category: "Home & Garden", initials: "KB", color: "bg-amber-600" },
  { name: "Wireless Bluetooth Speaker", price: "₦12,000", category: "Electronics", initials: "WS", color: "bg-teal-500" },
  { name: "Orijin Bitter Lemon", price: "₦800", category: "Food & Drinks", initials: "OB", color: "bg-green-600" },
  { name: "Samsung Galaxy S24", price: "₦650,000", category: "Phones", initials: "SG", color: "bg-indigo-500" },
  { name: "Lace Complete Material", price: "₦25,000", category: "Fashion", initials: "LC", color: "bg-fuchsia-500" },
  { name: "Portable Power Bank", price: "₦5,500", category: "Electronics", initials: "PP", color: "bg-slate-600" },
  { name: "Coffee Maker Machine", price: "₦35,000", category: "Home & Garden", initials: "CM", color: "bg-yellow-700" },
  { name: "MAC Matte Lipstick", price: "₦6,500", category: "Beauty", initials: "ML", color: "bg-red-600" },
];

// ─── Sort options ──────────────────────────────────────────────────────────

export interface SortOption {
  value: string;
  label: string;
}

/**
 * Sort dropdown options shown on the categories + search results pages.
 * Declared `as const` so callers can derive a union type from the values.
 */
export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
] as const satisfies readonly SortOption[];

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─── Category styles (categories page) ─────────────────────────────────────

export interface CategoryStyle {
  color: string;
  textColor: string;
  Icon: LucideIcon;
}

/**
 * Per-slug category styling for the categories page. Keyed by category slug
 * (lowercased). Falls back to DEFAULT_CATEGORY_STYLE when no slug match is
 * found.
 */
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  fashion: { color: "bg-pink-500", textColor: "text-pink-600", Icon: Shirt },
  electronics: { color: "bg-blue-500", textColor: "text-blue-600", Icon: Smartphone },
  phones: { color: "bg-cyan-500", textColor: "text-cyan-600", Icon: Smartphone },
  beauty: { color: "bg-rose-500", textColor: "text-rose-600", Icon: Sparkles },
  home: { color: "bg-amber-500", textColor: "text-amber-600", Icon: HomeIcon },
  food: { color: "bg-orange-500", textColor: "text-orange-600", Icon: UtensilsCrossed },
  automobile: { color: "bg-red-500", textColor: "text-red-600", Icon: Car },
  sports: { color: "bg-green-500", textColor: "text-green-600", Icon: Trophy },
  health: { color: "bg-emerald-500", textColor: "text-emerald-600", Icon: HeartPulse },
  books: { color: "bg-indigo-500", textColor: "text-indigo-600", Icon: BookOpen },
  gaming: { color: "bg-violet-500", textColor: "text-violet-600", Icon: Gamepad2 },
  kids: { color: "bg-yellow-500", textColor: "text-yellow-600", Icon: Baby },
  jewelry: { color: "bg-fuchsia-500", textColor: "text-fuchsia-600", Icon: Gem },
  groceries: { color: "bg-lime-500", textColor: "text-lime-600", Icon: ShoppingCart },
  computers: { color: "bg-sky-500", textColor: "text-sky-600", Icon: Laptop },
  fitness: { color: "bg-teal-500", textColor: "text-teal-600", Icon: Dumbbell },
  music: { color: "bg-purple-500", textColor: "text-purple-600", Icon: Music },
  cameras: { color: "bg-slate-500", textColor: "text-slate-600", Icon: Camera },
  accessories: { color: "bg-stone-500", textColor: "text-stone-600", Icon: Watch },
  art: { color: "bg-pink-600", textColor: "text-pink-700", Icon: Palette },
  pets: { color: "bg-orange-600", textColor: "text-orange-700", Icon: Dog },
  movies: { color: "bg-red-600", textColor: "text-red-700", Icon: Clapperboard },
  audio: { color: "bg-violet-600", textColor: "text-violet-700", Icon: Headphones },
};

/** Fallback style for any category slug not present in CATEGORY_STYLES. */
export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  color: "bg-gray-500",
  textColor: "text-gray-600",
  Icon: Package,
};

/** Accent bg colors cycled through for unstyled category cards. */
export const CATEGORY_CARD_ACCENT_COLORS: string[] = [
  "bg-kwik-orange",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
];

/** Accent text colors paired (by index) with CATEGORY_CARD_ACCENT_COLORS. */
export const CATEGORY_CARD_TEXT_COLORS: string[] = [
  "text-kwik-orange",
  "text-blue-600",
  "text-emerald-600",
  "text-violet-600",
  "text-pink-600",
  "text-amber-600",
  "text-cyan-600",
  "text-rose-600",
  "text-indigo-600",
  "text-teal-600",
];

// ─── Orders list filter tabs + status buckets ──────────────────────────────

export type OrderListTabKey = "all" | "active" | "completed" | "cancelled";

export interface OrderListTab {
  key: OrderListTabKey;
  label: string;
}

/** Tabs shown above the orders-list page. */
export const ORDER_LIST_TABS: OrderListTab[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

/**
 * Order status buckets used by the orders-list page's tab filter. Each tab maps
 * to an allow-list of backend order status strings.
 */
export const ACTIVE_ORDER_STATUSES: string[] = [
  "PENDING",
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "FULFILLED",
];

export const COMPLETED_ORDER_STATUSES: string[] = ["DELIVERED"];

export const CANCELLED_ORDER_STATUSES: string[] = ["CANCELLED", "REFUNDED"];
