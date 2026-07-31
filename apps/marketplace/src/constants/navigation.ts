/**
 * navigation.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Single source of truth for marketplace navigation data: mega-menu categories,
 * top-nav dropdown items, mobile drawer links, mobile bottom-nav items, and the
 * enhanced-footer link columns + social + legal links. Components import these
 * arrays directly — no inline nav data should live in component files.
 *
 * NOTE: color classes referenced here (e.g. "bg-kwik-orange-tint") are Tailwind
 * tokens that map to the unified OKLCH design system. No hex values.
 */

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  CreditCard,
  Droplets,
  Facebook,
  Grid3X3,
  Heart,
  HelpCircle,
  Home,
  Info,
  Instagram,
  LayoutGrid,
  Linkedin,
  Monitor,
  Package,
  Smartphone,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Twitter,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap,
  BookOpen,
  Car,
} from "lucide-react";

// ─── Mega-menu: category dropdown ──────────────────────────────────────────

export interface CategoryItem {
  icon: LucideIcon;
  name: string;
  slug: string;
  count: string;
  href: string;
}

/**
 * Categories shown inside the mega-menu's "Categories" dropdown.
 * Order = display order in the dropdown grid.
 */
export const MEGA_MENU_CATEGORIES: CategoryItem[] = [
  { icon: Sparkles, name: "Fashion", slug: "fashion", count: "12K+", href: "/categories?fashion" },
  { icon: Monitor, name: "Electronics", slug: "electronics", count: "8K+", href: "/categories?electronics" },
  { icon: Heart, name: "Beauty", slug: "beauty", count: "6K+", href: "/categories?beauty" },
  { icon: UtensilsCrossed, name: "Food", slug: "food", count: "15K+", href: "/categories?food" },
  { icon: Home, name: "Home", slug: "home", count: "9K+", href: "/categories?home" },
  { icon: Smartphone, name: "Phones", slug: "phones", count: "11K+", href: "/categories?phones" },
  { icon: Car, name: "Automobiles", slug: "auto", count: "4K+", href: "/categories?auto" },
  { icon: BookOpen, name: "Books", slug: "books", count: "3K+", href: "/categories?books" },
  { icon: Wrench, name: "Services", slug: "services", count: "7K+", href: "/categories?services" },
];

// ─── Mega-menu: standard dropdowns (Products / Vendors / Resources) ────────

export interface DropdownLink {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}

export interface NavItemConfig {
  label: string;
  links: DropdownLink[];
}

/**
 * The three top-level dropdown menus (Products / Vendors / Resources) shown in
 * the desktop mega-nav next to the Categories mega-menu.
 */
export const MEGA_MENU_NAV_ITEMS: NavItemConfig[] = [
  {
    label: "Products",
    links: [
      { icon: TrendingUp, label: "Trending", description: "Hot products right now", href: "/search?q=trending" },
      { icon: Package, label: "New Arrivals", description: "Just listed items", href: "/search?q=new+arrivals" },
      { icon: Star, label: "Top Rated", description: "Highest rated products", href: "/search?q=top+rated" },
      { icon: Zap, label: "Deals of the Day", description: "Limited-time offers", href: "/search?q=deals" },
    ],
  },
  {
    label: "Vendors",
    links: [
      { icon: Grid3X3, label: "Browse Vendors", description: "Explore all stores", href: "/vendors" },
      { icon: UserPlus, label: "Become a Vendor", description: "Start selling today", href: "/vendors" },
      { icon: Award, label: "Top Rated", description: "Best performing sellers", href: "/vendors" },
      { icon: LayoutGrid, label: "Vendor Categories", description: "Stores by category", href: "/vendors" },
    ],
  },
  {
    label: "Resources",
    links: [
      { icon: Info, label: "About Us", description: "Our story & mission", href: "/about" },
      { icon: CreditCard, label: "Pricing", description: "Simple, fair plans", href: "/pricing" },
      { icon: Droplets, label: "Pool Selling", description: "Sell without inventory", href: "/pool" },
      { icon: HelpCircle, label: "Help Center", description: "FAQs and support", href: "#" },
    ],
  },
];

// ─── Mobile drawer (hamburger) links ───────────────────────────────────────

export interface DrawerLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Top-level page links shown in the mobile hamburger drawer.
 */
export const MOBILE_DRAWER_LINKS: DrawerLink[] = [
  { label: "Marketplace", href: "/", icon: Store },
  { label: "Categories", href: "/categories", icon: Grid3X3 },
  { label: "About", href: "/about", icon: Info },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "Vendors", href: "/vendors", icon: Users },
  { label: "Pool Selling", href: "/pool", icon: Droplets },
];

// ─── Mobile bottom-nav (sticky tab bar) ────────────────────────────────────

export interface MobileNavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

/**
 * Items in the sticky mobile bottom-nav bar (Home / Categories / Vendors / Profile).
 */
export const MOBILE_BOTTOM_NAV_ITEMS: MobileNavItem[] = [
  { label: "Home", icon: LayoutGrid, href: "/" },
  { label: "Categories", icon: Grid3X3, href: "/categories" },
  { label: "Vendors", icon: Store, href: "/vendors" },
  { label: "Profile", icon: UserPlus, href: "/profile" },
];

// ─── Enhanced footer ───────────────────────────────────────────────────────

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * The four link columns in the enhanced footer.
 */
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Vendor Stock", href: "/search?source=vendor-stock" },
      { label: "Pool Resale", href: "/pool" },
      { label: "Group Buy", href: "/group-buy" },
      { label: "Digital Products", href: "/search?type=digital" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { label: "Vendor Dashboard", href: "/register?role=VENDOR" },
      { label: "Inventory", href: "/register?role=VENDOR" },
      { label: "Pool Catalog", href: "/pool" },
      { label: "Order Handling", href: "/vendors" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/about" },
      { label: "Buyer Protection", href: "/terms" },
      { label: "Payments", href: "/pricing" },
      { label: "Contact", href: "/about" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/about" },
      { label: "Careers", href: "/about" },
      { label: "Status", href: "/about" },
    ],
  },
];

export interface SocialLink {
  icon: LucideIcon;
  href: string;
  label: string;
}

/**
 * Social media icons row in the footer's brand column.
 */
export const FOOTER_SOCIAL_LINKS: SocialLink[] = [
  { icon: Facebook, href: "https://www.facebook.com/kwikseller", label: "Facebook" },
  { icon: Twitter, href: "https://x.com/kwikseller", label: "X" },
  { icon: Instagram, href: "https://www.instagram.com/kwikseller", label: "Instagram" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/kwikseller", label: "LinkedIn" },
];

/**
 * Bottom legal/sitemap links shown to the right of the copyright line.
 */
export const FOOTER_BOTTOM_LINKS: FooterLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/privacy#cookies" },
  { label: "Sitemap", href: "/search" },
];

/**
 * Arrow icon used by the footer's newsletter "Join" button. Re-exported so
 * component files don't need to import it separately just for that one slot.
 */
export const FOOTER_NEWSLETTER_ICON = ArrowRight;
