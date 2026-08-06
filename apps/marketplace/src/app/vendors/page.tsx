// KWIKSELLER - Enhanced Vendors Page
// Hero, Category Filters, Vendor Grid, Benefits, Stats, Categories, Onboarding, CTA

"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  Store,
  ArrowRight,
  Star,
  Users,
  Wallet,
  BarChart3,
  Search,
  ShieldCheck,
  Package,
  TrendingUp,
  MapPin,
  Zap,
  Droplets,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Shirt,
  Gem,
  Utensils,
  Home as HomeIcon,
  Car,
  Phone as PhoneIcon,
  Globe,
  Award,
  SlidersHorizontal,
} from "lucide-react";
import { Button, Card, Chip } from "@heroui/react";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { cn } from "@kwikseller/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStores } from "@/lib/api-hooks";
import { ProductGridSkeleton } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

// ─── Animation Helpers ─────────────────────────────────────────────

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerChild({
  children,
  className = "",
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: "easeOut" as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CounterAnimation({
  target,
  suffix = "",
  prefix = "",
  display,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  display?: string;
}) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  React.useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        setDone(true);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return (
    <span ref={ref}>
      {done && display
        ? display
        : `${prefix}${count.toLocaleString()}${suffix}`}
    </span>
  );
}

function AnimatedNumber({
  value,
  decimals = 1,
}: {
  value: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => v.toFixed(decimals));

  React.useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, {
        duration: 1.2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, motionVal, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// ─── Data ──────────────────────────────────────────────────────

type VendorCategory =
  | "All"
  | "Fashion"
  | "Electronics"
  | "Beauty"
  | "Food"
  | "Home"
  | "Automobiles"
  | "Phones";

const categories: VendorCategory[] = [
  "All",
  "Fashion",
  "Electronics",
  "Beauty",
  "Food",
  "Home",
  "Automobiles",
  "Phones",
];

const VENDOR_SORT_OPTIONS = [
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
  { value: "rating", label: "Top Rated" },
] as const;

type VendorSortValue = (typeof VENDOR_SORT_OPTIONS)[number]["value"];

const categoryIcons: Record<string, React.ElementType> = {
  Fashion: Shirt,
  Electronics: Zap,
  Beauty: Gem,
  Food: Utensils,
  Home: HomeIcon,
  Automobiles: Car,
  Phones: PhoneIcon,
};

interface VendorData {
  id: string;
  slug?: string;
  storeName: string;
  initials: string;
  category: string;
  location: string;
  description: string;
  products: string;
  rating: number;
  sold: string;
  badge: "Featured" | "Top Rated" | "Rising Star" | "Verified";
  badgeColor: string;
  coverColor: string;
  tags: string[];
  isVerified: boolean;
}

// ─── Store → VendorData mapping (drives the directory grid) ────────────────

const COVER_COLORS = [
  "bg-pink-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
];

const CATEGORY_KEYWORDS: Array<{ match: string; category: VendorCategory }> = [
  { match: "fashion", category: "Fashion" },
  { match: "apparel", category: "Fashion" },
  { match: "clothing", category: "Fashion" },
  { match: "electronic", category: "Electronics" },
  { match: "gadget", category: "Electronics" },
  { match: "tech", category: "Electronics" },
  { match: "beauty", category: "Beauty" },
  { match: "skincare", category: "Beauty" },
  { match: "cosmetic", category: "Beauty" },
  { match: "food", category: "Food" },
  { match: "grocery", category: "Food" },
  { match: "fresh", category: "Food" },
  { match: "home", category: "Home" },
  { match: "decor", category: "Home" },
  { match: "furniture", category: "Home" },
  { match: "auto", category: "Automobiles" },
  { match: "car", category: "Automobiles" },
  { match: "phone", category: "Phones" },
  { match: "mobile", category: "Phones" },
];

function inferCategory(haystack: string): VendorCategory {
  const lc = haystack.toLowerCase();
  for (const { match, category } of CATEGORY_KEYWORDS) {
    if (lc.includes(match)) return category;
  }
  return "Fashion";
}

function initialsFor(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "KS"
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function toVendorData(
  store: {
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    rating?: number;
    reviewCount?: number;
    productCount?: number;
    location?: string | null;
    isVerified?: boolean;
    category?: string | null;
  },
  index: number,
): VendorData {
  const category = inferCategory(
    `${store.name} ${store.description ?? ""} ${store.category ?? ""}`,
  );
  const rating = Number(store.rating ?? 0);
  const reviewCount = Number(store.reviewCount ?? 0);
  const productCount = Number(store.productCount ?? 0);
  const badge: VendorData["badge"] =
    rating >= 4.8 ? "Top Rated" : productCount >= 100 ? "Featured" : "Verified";
  const badgeColor =
    badge === "Featured"
      ? "bg-amber-500"
      : badge === "Top Rated"
        ? "bg-emerald-500"
        : "bg-gray-500";
  return {
    id: String(store.id),
    slug: store.slug,
    storeName: store.name,
    initials: initialsFor(store.name),
    category,
    location: store.location || "Africa",
    description:
      store.description ||
      "Verified vendor on Kwikseller — quality products, escrow protected.",
    products: formatCount(productCount),
    rating,
    sold: formatCount(reviewCount),
    badge,
    badgeColor,
    coverColor: COVER_COLORS[index % COVER_COLORS.length],
    tags: [category],
    isVerified: Boolean(store.isVerified ?? true),
  };
}

const whySellBenefits = [
  {
    icon: Wallet,
    title: "Zero Setup Fees",
    description:
      "No monthly charges, no hidden costs. Create your store and start listing products for free.",
    color: "bg-success/10 text-success",
  },
  {
    icon: ShieldCheck,
    title: "Escrow Protection",
    description:
      "Every transaction is secured with escrow. Get paid only after the buyer confirms delivery.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Droplets,
    title: "Pool Selling",
    description:
      "Sell without holding inventory. Pick products from the shared pool and earn commissions instantly.",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track your sales, traffic, conversion rates, and revenue trends with real-time analytics.",
    color: "bg-danger/10 text-danger",
  },
];

const vendorStats = [
  {
    value: 10000,
    suffix: "+",
    prefix: "",
    label: "Vendors",
    display: "10K+",
    icon: Users,
  },
  {
    value: 500000,
    suffix: "+",
    prefix: "",
    label: "Products",
    display: "500K+",
    icon: Package,
  },
  {
    value: 15,
    suffix: "+",
    prefix: "",
    label: "Countries",
    display: "15+",
    icon: Globe,
  },
  {
    value: 2000000,
    suffix: "+",
    prefix: "",
    label: "Orders",
    display: "2M+",
    icon: ShoppingBag,
  },
];

const topCategories = [
  {
    name: "Fashion & Apparel",
    count: "45K+",
    icon: Shirt,
    color: "bg-pink-500",
    bgLight: "bg-pink-50 dark:bg-pink-950/30",
    textColor: "text-pink-600 dark:text-pink-400",
  },
  {
    name: "Electronics",
    count: "38K+",
    icon: Zap,
    color: "bg-teal-500",
    bgLight: "bg-teal-50 dark:bg-teal-950/30",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  {
    name: "Phones & Tablets",
    count: "29K+",
    icon: Smartphone,
    color: "bg-amber-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    name: "Beauty & Health",
    count: "24K+",
    icon: Gem,
    color: "bg-violet-500",
    bgLight: "bg-violet-50 dark:bg-violet-950/30",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    name: "Home & Garden",
    count: "21K+",
    icon: HomeIcon,
    color: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-600 dark:text-green-400",
  },
  {
    name: "Food & Drinks",
    count: "18K+",
    icon: Utensils,
    color: "bg-orange-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
    textColor: "text-orange-600 dark:text-orange-400",
  },
];

const onboardingSteps = [
  {
    number: 1,
    title: "Register",
    description:
      "Create your free vendor account in under 2 minutes with just your email and basic details.",
    icon: Users,
    color: "bg-emerald-500",
  },
  {
    number: 2,
    title: "Set Up Store",
    description:
      "Customize your store with a logo, banner, and brand colors. Choose from beautiful templates.",
    icon: Store,
    color: "bg-amber-500",
  },
  {
    number: 3,
    title: "Add Products",
    description:
      "Upload photos, set prices in local currency, and organize your items into categories.",
    icon: Package,
    color: "bg-rose-500",
  },
  {
    number: 4,
    title: "Start Selling",
    description:
      "Go live and reach millions of buyers across Africa. Track every order from your dashboard.",
    icon: TrendingUp,
    color: "bg-violet-500",
  },
];

// ─── Vendor Card Component ────────────────────────────────────────

function VendorCard({ vendor, index }: { vendor: VendorData; index: number }) {
  const vendorSlug =
    vendor.slug ??
    vendor.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <StaggerChild index={index}>
      <Card className="overflow-hidden border border-divider rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full">
        {/* Cover Area */}
        <div className={cn("relative h-28 overflow-hidden")}>
          <div className={cn("absolute inset-0", vendor.coverColor)} />
          {/* Decorative geometric shapes */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute top-3 right-16 w-16 h-[2px] bg-white/20 rotate-12" />
          <div className="absolute bottom-6 left-10 w-12 h-[2px] bg-white/15 -rotate-6" />
          <div className="absolute top-10 left-20 w-4 h-4 rounded-full bg-white/15" />
          {/* Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-lg",
                vendor.badgeColor,
              )}
            >
              {vendor.badge === "Featured" && "⭐ "}
              {vendor.badge === "Top Rated" && "🏆 "}
              {vendor.badge === "Rising Star" && "🚀 "}
              {vendor.badge}
            </span>
          </div>
        </div>

        {/* Vendor Info */}
        <div className="relative px-5 pb-5">
          {/* Avatar overlapping cover */}
          <div className="flex items-end gap-3 -mt-8 mb-3">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-[3px] border-background shrink-0",
                vendor.coverColor,
              )}
            >
              {vendor.initials}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h3 className="font-semibold text-lg truncate leading-tight">
                {vendor.storeName}
              </h3>
              <div className="flex items-center gap-1 text-sm text-default-500 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{vendor.location}</span>
              </div>
            </div>
          </div>

          {/* Category + Verification */}
          <div className="flex items-center justify-between mb-4">
            <Chip size="sm" variant="soft" className="text-xs">
              {(() => {
                const CatIcon = categoryIcons[vendor.category];
                return CatIcon ? (
                  <span className="mr-1">
                    <CatIcon className="w-3 h-3" />
                  </span>
                ) : null;
              })()}
              {vendor.category}
            </Chip>
            {vendor.isVerified && (
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span className="text-xs font-medium text-success">
                  Verified
                </span>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between py-3 mb-4 border-y border-divider">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 text-sm">
                <Package className="w-3.5 h-3.5 text-default-400" />
                <span className="font-semibold">{vendor.products}</span>
              </div>
              <span className="text-[10px] text-default-400 uppercase tracking-wider">
                Products
              </span>
            </div>
            <div className="w-px h-8 bg-divider" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 text-sm">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                <span className="font-semibold text-warning">
                  <AnimatedNumber value={vendor.rating} /> ★
                </span>
              </div>
              <span className="text-[10px] text-default-400 uppercase tracking-wider">
                Rating
              </span>
            </div>
            <div className="w-px h-8 bg-divider" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-default-400" />
                <span className="font-semibold">{vendor.sold}</span>
              </div>
              <span className="text-[10px] text-default-400 uppercase tracking-wider">
                Sales
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {vendor.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-default-100 dark:bg-default-100/50 px-2.5 py-0.5 text-xs text-default-600 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Visit Store Button */}
          <Link
            href={`/vendor/${vendorSlug}`}
            className="group/btn inline-flex h-11 w-full items-center justify-center gap-2 border border-kwik-border bg-background px-4 text-sm font-semibold text-kwik-dark transition hover:border-kwik-orange hover:text-kwik-orange dark:border-white/15 dark:bg-white/5 dark:text-white"
          >
            Visit Store
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Card>
    </StaggerChild>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function VendorsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<VendorCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<VendorSortValue>("rating");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Fetch the vendor directory from the shared `useStores` hook (backed by
  // the dummy API when NEXT_PUBLIC_USE_DUMMY_DATA=true, the real backend
  // otherwise — no hardcoded fallback list).
  const storesQuery = useStores();
  const isLoadingVendors = storesQuery.isLoading;
  const apiVendors = useMemo<VendorData[]>(
    () =>
      ((storesQuery.data ?? []) as Array<Record<string, unknown>>).map(
        (store, index) =>
          toVendorData(
            {
              id: String(store.id ?? index),
              name: String(store.name ?? store.storeName ?? "Kwikseller vendor"),
              slug: store.slug ? String(store.slug) : store.username ? String(store.username) : undefined,
              description: (store.description ?? store.tagline) as string | null,
              logoUrl: (store.logoUrl ?? store.logo) as string | null,
              bannerUrl: store.bannerUrl as string | null,
              rating: Number(store.rating ?? store.averageRating ?? 0),
              reviewCount: Number(store.reviewCount ?? 0),
              productCount: Number(store.productCount ?? 0),
              location: (store.location ?? (store.address as { state?: string } | undefined)?.state) as string | null,
              isVerified: Boolean(store.isVerified ?? store.verified ?? true),
              category: store.category as string | null,
            },
            index,
          ),
      ),
    [storesQuery.data],
  );

  const filteredVendors = useMemo(() => {
    const result = apiVendors.filter((v) => {
      const matchesCategory =
        activeCategory === "All" || v.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        v.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    switch (sortBy) {
      case "az":
        result.sort((a, b) => a.storeName.localeCompare(b.storeName));
        break;
      case "za":
        result.sort((a, b) => b.storeName.localeCompare(a.storeName));
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [activeCategory, searchQuery, sortBy, apiVendors]);

  return (
    <>
      <section className="relative z-[95] border-b border-divider bg-white dark:bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-kwik-dark dark:text-white">Vendors</h1>
              <p className="mt-0.5 text-xs text-kwik-muted dark:text-white/60">
                {isLoadingVendors ? "Loading verified sellers" : "Browse verified sellers"}
              </p>
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSortOpen((value) => !value)}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-kwik-border bg-white px-3 text-xs font-semibold text-kwik-dark transition hover:border-kwik-orange dark:border-white/10 dark:bg-white/5 dark:text-white"
                aria-expanded={isSortOpen}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-kwik-orange" />
                Sort
              </button>
              {isSortOpen && (
                <div className="absolute right-0 top-11 z-[110] w-40 overflow-hidden rounded-md border border-kwik-border bg-background shadow-xl">
                  {VENDOR_SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.value);
                    setIsSortOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-xs font-medium transition ${
                    sortBy === opt.value
                      ? "bg-kwik-orange text-white"
                      : "text-kwik-gray-light hover:bg-neutral-50 hover:text-kwik-dark dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Hero section is intentionally omitted in this refactor — the
          directory header above already provides the page title and search
          affordance. Keeping the layout compact for a focused browse flow. */}

      {/* ─── 2. Vendor Categories Filter ─────────────────────── */}
      <section className="sticky top-[112px] z-[90] border-b border-divider bg-white/95 backdrop-blur dark:bg-background/95 md:top-16">
        <div className="container mx-auto px-0 md:px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-2 py-1.5 md:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0"
              >
                {activeCategory === cat && (
                  <motion.div
                    layoutId="active-vendor-filter"
                    className="absolute inset-0 bg-accent rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex items-center gap-1.5",
                    activeCategory === cat
                      ? "text-white"
                      : "text-default-500 hover:text-foreground",
                  )}
                >
                  {cat !== "All" &&
                    (() => {
                      const CatIcon = categoryIcons[cat];
                      return CatIcon ? (
                        <CatIcon className="w-3.5 h-3.5" />
                      ) : null;
                    })()}
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Featured Vendors Grid ────────────────────────── */}
      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-4 md:px-4">
          <AnimatedSection>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <Chip variant="soft" className="mb-2">
                  <Award className="w-4 h-4 mr-1" />
                  Featured Sellers
                </Chip>
                <h2 className="text-xl font-bold md:text-2xl">
                  Explore Top Vendors
                </h2>
              </div>
            </div>
          </AnimatedSection>

          {isLoadingVendors ? (
            <ProductGridSkeleton count={8} columns={4} />
          ) : filteredVendors.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVendors.map((vendor, index) => (
                <VendorCard key={vendor.id} vendor={vendor} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="search"
              icon={<Search className="h-12 w-12" />}
              title="No vendors found"
              description="Try adjusting your search or filter to find what you're looking for."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white hover:bg-kwik-orange-hover"
                >
                  Clear Filters
                </button>
              }
            />
          )}
        </div>
      </section>

    </>
  );
}
