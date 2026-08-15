/**
 * navigation.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Single source of truth for marketplace navigation.
 *
 * The Marketplace header has FIVE primary navigation items:
 *
 *   Categories | Products | Vendors | Deals | Resources
 *
 * Each item carries a consistent icon (design-system reason: visual scanning
 * aid on desktop + icon-led mobile accordion). Categories is special — its
 * children are fetched from the backend (`useCategories()`) at render time,
 * so no hardcoded category list lives here. The other four items define
 * their dropdown links inline.
 *
 * Routing principles enforced here:
 *   - Collections use semantic collection routes  (/products/trending, /deals, …)
 *   - Individual entities use dynamic [id] routes  (/products/[id], /deals/[id])
 *   - Resources point to real informational pages (/about, /pricing, /pool, /help)
 *
 * NOTE: color classes referenced here (e.g. "bg-kwik-orange-tint") are Tailwind
 * tokens. No hex values, no gradients.
 */

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  CreditCard,
  Droplets,
  Facebook,
  Flame,
  Grid3X3,
  HelpCircle,
  Info,
  Instagram,
  LayoutGrid,
  Linkedin,
  Package,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  Twitter,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

// ─── Primary navigation items ──────────────────────────────────────────────

export interface DropdownLink {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}

export interface NavItemConfig {
  /** Visible label in the header bar. */
  label: string;
  /** Icon shown beside the label (consistent across all five items). */
  icon: LucideIcon;
  /** Top-level destination when the label itself is clicked. */
  href: string;
  /**
   * `"categories"` → the dropdown is populated from the backend
   * (`useCategories()`). `"standard"` → uses the static `links` array.
   */
  kind: "categories" | "standard";
  /** Static dropdown links (used when `kind === "standard"`). */
  links?: DropdownLink[];
}

/**
 * The five primary navigation items, in display order.
 *
 * Categories is special: its dropdown children are fetched live from the
 * API so the menu always reflects the real category tree. The other four
 * items ship static, curated link sets that point at semantic routes.
 */
export const PRIMARY_NAV_ITEMS: NavItemConfig[] = [
  {
    label: "Categories",
    icon: LayoutGrid,
    href: "/categories",
    kind: "categories",
  },
  {
    label: "Products",
    icon: Package,
    href: "/products",
    kind: "standard",
    links: [
      { icon: TrendingUp, label: "Trending", description: "Hot products right now", href: "/products/trending" },
      { icon: Sparkles, label: "New Arrivals", description: "Recently listed items", href: "/products/new-arrivals" },
      { icon: Star, label: "Top Rated", description: "Highest rated products", href: "/products/top-rated" },
    ],
  },
  {
    label: "Vendors",
    icon: Store,
    href: "/vendors",
    kind: "standard",
    links: [
      { icon: Grid3X3, label: "Browse Vendors", description: "Explore all stores", href: "/vendors" },
      { icon: Award, label: "Top Rated Vendors", description: "Best performing sellers", href: "/vendors?sort=top-rated" },
      { icon: UserPlus, label: "Become a Vendor", description: "Start selling today", href: "/register?role=VENDOR" },
    ],
  },
  {
    label: "Deals",
    icon: Tag,
    href: "/deals",
    kind: "standard",
    links: [
      { icon: Zap, label: "All Deals", description: "Every active promotion", href: "/deals" },
      { icon: Flame, label: "Flash Deals", description: "Limited-time price drops", href: "/deals?dealType=FLASH_DEAL" },
      { icon: Sparkles, label: "Deals of the Day", description: "Daily handpicked offers", href: "/deals?dealType=DEAL_OF_THE_DAY" },
      { icon: Users, label: "Group Buy", description: "Buy together, save together", href: "/group-buy" },
    ],
  },
  {
    label: "Resources",
    icon: Info,
    href: "/about",
    kind: "standard",
    links: [
      { icon: Info, label: "About Us", description: "Our story & mission", href: "/about" },
      { icon: CreditCard, label: "Pricing", description: "Simple, fair plans", href: "/pricing" },
      { icon: Droplets, label: "Pool Selling", description: "Sell without inventory", href: "/pool" },
      { icon: HelpCircle, label: "Help Center", description: "FAQs and support", href: "/help" },
    ],
  },
];

// ─── Mobile bottom-nav (sticky tab bar) ────────────────────────────────────

export interface MobileNavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

/**
 * Items in the sticky mobile bottom-nav bar.
 * Home / Categories / Deals / Vendors / Profile.
 */
export const MOBILE_BOTTOM_NAV_ITEMS: MobileNavItem[] = [
  { label: "Home", icon: LayoutGrid, href: "/" },
  { label: "Categories", icon: Grid3X3, href: "/categories" },
  { label: "Deals", icon: Tag, href: "/deals" },
  { label: "Vendors", icon: Store, href: "/vendors" },
  { label: "Profile", icon: Users, href: "/profile" },
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
      { label: "All Products", href: "/products" },
      { label: "Trending", href: "/products/trending" },
      { label: "New Arrivals", href: "/products/new-arrivals" },
      { label: "Top Rated", href: "/products/top-rated" },
    ],
  },
  {
    title: "Deals",
    links: [
      { label: "All Deals", href: "/deals" },
      { label: "Flash Deals", href: "/deals?dealType=FLASH_DEAL" },
      { label: "Deals of the Day", href: "/deals?dealType=DEAL_OF_THE_DAY" },
      { label: "Group Buy", href: "/group-buy" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { label: "Browse Vendors", href: "/vendors" },
      { label: "Become a Vendor", href: "/register?role=VENDOR" },
      { label: "Pool Selling", href: "/pool" },
      { label: "Vendor Dashboard", href: "/register?role=VENDOR" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Help Center", href: "/help" },
      { label: "Terms", href: "/terms" },
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
