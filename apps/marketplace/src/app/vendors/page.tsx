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
  CheckCircle,
} from "lucide-react";
import { Button, Card, Chip, Input } from "@heroui/react";
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
import Image from "next/image";

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

const vendors: VendorData[] = [
  {
    id: "1",
    storeName: "Zara's Collection",
    initials: "ZC",
    category: "Fashion",
    location: "Lagos, Nigeria",
    description:
      "Nigeria's premier fashion destination for authentic African wear and contemporary designs.",
    products: "1.2K",
    rating: 4.9,
    sold: "8.5K",
    badge: "Featured",
    badgeColor: "bg-amber-500",
    coverColor: "bg-pink-500",
    tags: ["Ankara", "Ready-to-Wear", "Accessories"],
    isVerified: true,
  },
  {
    id: "2",
    storeName: "TechHub Africa",
    initials: "TA",
    category: "Electronics",
    location: "Nairobi, Kenya",
    description:
      "Your trusted source for quality electronics and gadgets at competitive prices.",
    products: "856",
    rating: 4.8,
    sold: "12K",
    badge: "Top Rated",
    badgeColor: "bg-emerald-500",
    coverColor: "bg-cyan-500",
    tags: ["Phones", "Laptops", "Accessories"],
    isVerified: true,
  },
  {
    id: "3",
    storeName: "Glow Beauty Bar",
    initials: "GB",
    category: "Beauty",
    location: "Accra, Ghana",
    description:
      "Premium beauty products from top global and African brands curated just for you.",
    products: "634",
    rating: 4.9,
    sold: "6.2K",
    badge: "Featured",
    badgeColor: "bg-amber-500",
    coverColor: "bg-violet-500",
    tags: ["Skincare", "Makeup", "Hair"],
    isVerified: true,
  },
  {
    id: "4",
    storeName: "FreshMart Express",
    initials: "FE",
    category: "Food",
    location: "Kano, Nigeria",
    description:
      "Fresh produce and packaged goods delivered to your door with reliable logistics.",
    products: "2.1K",
    rating: 4.7,
    sold: "15K",
    badge: "Rising Star",
    badgeColor: "bg-sky-500",
    coverColor: "bg-green-500",
    tags: ["Groceries", "Beverages", "Snacks"],
    isVerified: true,
  },
  {
    id: "5",
    storeName: "HomeVibe Decor",
    initials: "HV",
    category: "Home",
    location: "Enugu, Nigeria",
    description:
      "Transform your space with our curated home decor collection for every style.",
    products: "478",
    rating: 4.8,
    sold: "3.8K",
    badge: "Rising Star",
    badgeColor: "bg-sky-500",
    coverColor: "bg-orange-500",
    tags: ["Furniture", "Decor", "Kitchen"],
    isVerified: true,
  },
  {
    id: "6",
    storeName: "AutoParts NG",
    initials: "AN",
    category: "Automobiles",
    location: "Lagos, Nigeria",
    description:
      "Genuine auto parts and accessories for all vehicle types with fast delivery.",
    products: "923",
    rating: 4.6,
    sold: "5.1K",
    badge: "Top Rated",
    badgeColor: "bg-emerald-500",
    coverColor: "bg-red-500",
    tags: ["Car Parts", "Motorcycle", "Tools"],
    isVerified: true,
  },
  {
    id: "7",
    storeName: "PhoneZone KE",
    initials: "PZ",
    category: "Phones",
    location: "Mombasa, Kenya",
    description:
      "Latest smartphones and accessories with warranty and fast shipping across East Africa.",
    products: "1.5K",
    rating: 4.8,
    sold: "9.3K",
    badge: "Featured",
    badgeColor: "bg-amber-500",
    coverColor: "bg-amber-500",
    tags: ["Smartphones", "Cases", "Chargers"],
    isVerified: true,
  },
  {
    id: "8",
    storeName: "Kente Weavers",
    initials: "KW",
    category: "Fashion",
    location: "Kumasi, Ghana",
    description:
      "Handwoven Kente cloth and traditional African textiles sourced directly from local artisans.",
    products: "312",
    rating: 4.9,
    sold: "4.7K",
    badge: "Top Rated",
    badgeColor: "bg-emerald-500",
    coverColor: "bg-yellow-500",
    tags: ["Kente", "Textiles", "Handwoven"],
    isVerified: true,
  },
  {
    id: "9",
    storeName: "SkinGlow SA",
    initials: "SG",
    category: "Beauty",
    location: "Johannesburg, South Africa",
    description:
      "South Africa's favorite beauty store with organic skincare and premium cosmetics.",
    products: "785",
    rating: 4.7,
    sold: "7.1K",
    badge: "Verified",
    badgeColor: "bg-gray-500",
    coverColor: "bg-rose-500",
    tags: ["Organic", "Skincare", "Cosmetics"],
    isVerified: true,
  },
  {
    id: "10",
    storeName: "DigiTech Rwanda",
    initials: "DT",
    category: "Electronics",
    location: "Kigali, Rwanda",
    description:
      "Cutting-edge electronics and smart home devices with after-sales support.",
    products: "445",
    rating: 4.8,
    sold: "2.9K",
    badge: "Rising Star",
    badgeColor: "bg-sky-500",
    coverColor: "bg-emerald-500",
    tags: ["Smart Home", "Gadgets", "Audio"],
    isVerified: true,
  },
  {
    id: "11",
    storeName: "Spice Route",
    initials: "SR",
    category: "Food",
    location: "Dar es Salaam, Tanzania",
    description:
      "Premium spices, seasonings, and local ingredients for authentic African cuisine.",
    products: "890",
    rating: 4.6,
    sold: "11K",
    badge: "Top Rated",
    badgeColor: "bg-emerald-500",
    coverColor: "bg-orange-600",
    tags: ["Spices", "Seasoning", "Local"],
    isVerified: true,
  },
  {
    id: "12",
    storeName: "FurnitureHub NG",
    initials: "FH",
    category: "Home",
    location: "Abuja, Nigeria",
    description:
      "Modern and traditional furniture for homes and offices with nationwide delivery.",
    products: "356",
    rating: 4.7,
    sold: "2.4K",
    badge: "Verified",
    badgeColor: "bg-gray-500",
    coverColor: "bg-amber-600",
    tags: ["Sofas", "Beds", "Office"],
    isVerified: true,
  },
];

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
          <Button variant="outline" className="w-full font-medium group/btn">
            Visit Store
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
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

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
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
  }, [activeCategory, searchQuery]);

  return (
    <>
      {/* ─── 1. Hero Section ─────────────────────────────────── */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
        {/* Decorative gradient orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  py-16 sm:py-20 md:py-24 relative z-10">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <Chip
                variant="soft"
                className="mb-5 bg-white/20 text-white border-white/20"
              >
                <Store className="w-3.5 h-3.5 mr-1" />
                Africa&apos;s Marketplace
              </Chip>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 text-shadow-md">
                Join <span className="text-accent">10,000+</span> Vendors
                <br className="hidden sm:block" /> Across Africa
              </h1>
              <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
                Discover verified sellers from Lagos to Nairobi, Accra to
                Johannesburg. Find quality products, trusted stores, and the
                best deals on Africa&apos;s fastest-growing marketplace.
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Input
                    placeholder="Search vendors by name, category, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="[&_input]:text-white [&_input]:placeholder:text-white/60"
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-8">
                {[
                  { value: "10K+", label: "Vendors" },
                  { value: "500K+", label: "Products" },
                  { value: "15+", label: "Countries" },
                  { value: "2M+", label: "Orders" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/60 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── 2. Vendor Categories Filter ─────────────────────── */}
      <section className="bg-white dark:bg-background border-b border-divider sticky top-12 md:top-16 z-20">
        <div className="container mx-auto px-0 md:px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1.5">
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
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-0 md:px-4 ">
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <Chip variant="soft" className="mb-3">
                  <Award className="w-4 h-4 mr-1" />
                  Featured Sellers
                </Chip>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  Explore Top Vendors
                </h2>
                <p className="text-default-500 mt-2 max-w-lg">
                  {activeCategory === "All"
                    ? "Browse our handpicked selection of verified sellers delivering exceptional quality across Africa."
                    : `Showing ${filteredVendors.length} vendors in ${activeCategory}`}
                </p>
              </div>
              <div className="text-sm text-default-400 shrink-0">
                {filteredVendors.length} vendor
                {filteredVendors.length !== 1 ? "s" : ""} found
              </div>
            </div>
          </AnimatedSection>

          {filteredVendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVendors.map((vendor, index) => (
                <VendorCard key={vendor.id} vendor={vendor} index={index} />
              ))}
            </div>
          ) : (
            <AnimatedSection>
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-default-100 dark:bg-default-100/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-default-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                <p className="text-default-500 text-sm max-w-sm mx-auto mb-4">
                  Try adjusting your search or filter to find what you&apos;re
                  looking for.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* ─── 4. Why Sell on Kwikseller ───────────────────────── */}
      <section className="py-16 sm:py-20 bg-default-50 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-success/5 blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Zap className="w-4 h-4 mr-1" />
                Why Kwikseller?
              </Chip>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Why Sell on Kwikseller?
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                Everything you need to launch, grow, and scale your business —
                all in one powerful platform.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whySellBenefits.map((benefit, index) => (
              <StaggerChild key={index} index={index}>
                <Card className="group border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 h-full text-center">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto transition-transform group-hover:scale-110",
                      benefit.color,
                    )}
                  >
                    <benefit.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-default-500 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Vendor Success Stats ─────────────────────────── */}
      <section className="py-16 sm:py-20 bg-accent relative">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip
                variant="soft"
                className="mb-4 bg-white/20 text-white border-white/20"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                By The Numbers
              </Chip>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Vendor Success Stats
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Real numbers from real sellers thriving on our platform every
                day.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {vendorStats.map((stat, index) => (
              <StaggerChild key={index} index={index}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center hover:bg-white/15 transition-colors border border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                    <CounterAnimation
                      target={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      display={stat.display}
                    />
                  </div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Top Vendor Categories ────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-0 md:px-4 ">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <ShoppingBag className="w-4 h-4 mr-1" />
                Popular Categories
              </Chip>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Top Vendor Categories
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                Explore the most popular product categories where our vendors
                are seeing the highest demand and growth.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {topCategories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <StaggerChild key={index} index={index}>
                  <Card className="group border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6 cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md group-hover:scale-110 transition-transform",
                          cat.color,
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">
                          {cat.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-default-400" />
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              cat.textColor,
                            )}
                          >
                            {cat.count}
                          </span>
                          <span className="text-xs text-default-400">
                            products
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-default-300 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>
                  </Card>
                </StaggerChild>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. Vendor Onboarding Steps ──────────────────────── */}
      <section className="py-16 sm:py-20 bg-default-50 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-14">
              <Chip variant="soft" className="mb-4">
                <Sparkles className="w-4 h-4 mr-1" />
                Get Started
              </Chip>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Vendor Onboarding in{" "}
                <span className="text-accent">4 Easy Steps</span>
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                From sign-up to your first sale — get started in minutes, not
                days.
              </p>
            </div>
          </AnimatedSection>

          {/* Steps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-accent/30" />

            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <StaggerChild key={step.number} index={index}>
                  <div className="relative text-center group">
                    {/* Step number circle */}
                    <div className="relative inline-flex items-center justify-center mb-6">
                      <div
                        className={cn(
                          "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10 text-white",
                          step.color,
                        )}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      {/* Floating step number */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-accent flex items-center justify-center text-sm font-bold text-accent z-20 shadow-sm">
                        {step.number}
                      </div>
                    </div>

                    {/* Connector arrow on mobile/tablet */}
                    {index < onboardingSteps.length - 1 && (
                      <div className="lg:hidden flex justify-center mb-4">
                        <ArrowRight className="w-5 h-5 text-default-300" />
                      </div>
                    )}

                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-default-500 text-sm leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </StaggerChild>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 8. CTA Section ──────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-0 md:px-4 ">
          <AnimatedSection>
            <Card className="border-none p-8 sm:p-10 md:p-14 bg-accent text-white overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] pointer-events-none" />

              <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Left content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-5 mx-auto lg:mx-0 backdrop-blur-sm">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-shadow-sm">
                    Start Your Free Store Today
                  </h2>
                  <p className="text-white/80 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    Join over 10,000 verified sellers on Africa&apos;s
                    fastest-growing marketplace. Set up your store for free,
                    reach millions of buyers, and start earning.
                  </p>

                  {/* Trust badges */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6">
                    {[
                      { icon: ShieldCheck, label: "Escrow Protected" },
                      { icon: Wallet, label: "Zero Setup Fees" },
                      { icon: Globe, label: "15+ Countries" },
                    ].map((badge) => (
                      <div
                        key={badge.label}
                        className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs"
                      >
                        <badge.icon className="w-3.5 h-3.5 text-white/90" />
                        <span className="text-white/90">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 flex-shrink-0">
                  <Button
                    size="lg"
                    className="bg-white text-accent font-semibold hover:bg-white/90 kwik-shadow-lg transition-all min-w-[200px]"
                    onPress={() => router.push("/register")}
                  >
                    <Sparkles className="mr-2 w-4 h-4" />
                    Register Now — It&apos;s Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 min-w-[200px]"
                    onPress={() => router.push("/")}
                  >
                    Explore Marketplace
                  </Button>
                </div>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
