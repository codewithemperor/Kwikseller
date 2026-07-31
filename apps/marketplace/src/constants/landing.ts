/**
 * landing.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Single source of truth for landing-page data: community milestones, community
 * stats, marketplace metrics, testimonials, vendor spotlight, KwikCoins reward
 * tiers, referral program config, stats ticker strings, social-proof partners,
 * how-it-works steps, buyer-protection features, trust indicators, top vendors,
 * video testimonials, seller stories, and the pricing page (plans, comparison,
 * FAQs). Components import these instead of inlining them.
 *
 * NOTE: color classes referenced here (e.g. "bg-accent/10", "text-success",
 * "bg-pink-500", "bg-amber-500") are Tailwind utilities that map to the unified
 * OKLCH design tokens. No raw hex values are used anywhere in this file.
 */

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BadgePercent,
  BarChart3,
  Check,
  Clock,
  Code2,
  Coins,
  Crown,
  CreditCard,
  FileSpreadsheet,
  Gem,
  Gift,
  Globe,
  Headphones,
  Heart,
  HeartPulse,
  Layers,
  LifeBuoy,
  Link as LinkIcon,
  Lock,
  Mail,
  MessageCircle,
  Milestone,
  Package,
  Palette,
  Rocket,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Truck,
  Twitter,
  UserPlus,
  Users,
} from "lucide-react";

// ─── Community milestones ──────────────────────────────────────────────────

export interface MilestoneItem {
  date: string;
  title: string;
  description: string;
  icon: LucideIcon;
  stat: string;
  isLatest?: boolean;
}

/**
 * Timeline entries shown in the CommunityMilestones section. The last entry is
 * flagged with `isLatest` to drive the pulsing timeline node.
 */
export const COMMUNITY_MILESTONES: MilestoneItem[] = [
  {
    date: "Jan 2023",
    title: "Platform Launch",
    description: "KWIKSELLER was founded with a vision to empower African entrepreneurs",
    icon: Rocket,
    stat: "Day 1",
  },
  {
    date: "Jun 2023",
    title: "1,000 Vendors",
    description: "Reached our first major milestone with vendors across 5 African countries",
    icon: Users,
    stat: "5 Countries",
  },
  {
    date: "Nov 2023",
    title: "100K Products",
    description: "Product catalog crossed the 100,000 mark with diverse categories",
    icon: Package,
    stat: "100K+ Items",
  },
  {
    date: "Mar 2024",
    title: "KwikCoins Launch",
    description: "Introduced our rewards program to incentivize vendor growth",
    icon: Coins,
    stat: "Loyalty Rewards",
  },
  {
    date: "Jul 2024",
    title: "500K Orders",
    description: "Half a million orders processed through our escrow-protected system",
    icon: ShoppingCart,
    stat: "₦2B+ GMV",
  },
  {
    date: "Oct 2024",
    title: "15 Countries",
    description: "Expanded operations to 15 African countries with local delivery networks",
    icon: Globe,
    stat: "Pan-African",
  },
  {
    date: "Jan 2025",
    title: "10K Vendors",
    description: "Community of 10,000+ active vendors building businesses on KWIKSELLER",
    icon: Store,
    stat: "10K+ Stores",
  },
  {
    date: "Apr 2025",
    title: "2M+ Orders",
    description: "Over 2 million orders delivered with 99.9% satisfaction rate",
    icon: TrendingUp,
    stat: "2M+ Delivered",
    isLatest: true,
  },
];

/** Icon used by the CommunityMilestones section header chip. */
export const COMMUNITY_MILESTONES_HEADER_ICON = Milestone;
/** Icon used by the CommunityMilestones bottom CTA button. */
export const COMMUNITY_MILESTONES_CTA_ICON = ArrowRight;

// ─── Community stats ───────────────────────────────────────────────────────

export interface StatItem {
  label: string;
  display: string;
  /** Numeric target for the counter (e.g. 500 for 500K). */
  target: number;
  /** Suffix appended to the counter value (e.g. "K+" or "M+"). */
  suffix: string;
  /** Decimal places — only used by the rating stat (1). */
  decimals: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  subLabel: string;
}

/**
 * The six big number cards rendered in the CommunityStats section. The "Average
 * Rating" entry uses `target: 48` so the counter can render a /10 fractional
 * display ("4.8/5"); see the StatCard component's formatting logic.
 */
export const COMMUNITY_STATS: StatItem[] = [
  {
    label: "Active Buyers",
    display: "500K+",
    target: 500,
    suffix: "K+",
    decimals: 0,
    icon: Users,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    subLabel: "and growing daily",
  },
  {
    label: "Verified Sellers",
    display: "10K+",
    target: 10,
    suffix: "K+",
    decimals: 0,
    icon: Store,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    subLabel: "verified businesses",
  },
  {
    label: "Products Listed",
    display: "2M+",
    target: 2,
    suffix: "M+",
    decimals: 0,
    icon: Package,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    subLabel: "across all categories",
  },
  {
    label: "Countries Served",
    display: "15+",
    target: 15,
    suffix: "+",
    decimals: 0,
    icon: Globe,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    subLabel: "across Africa & beyond",
  },
  {
    label: "Monthly Transactions",
    display: "50K+",
    target: 50,
    suffix: "K+",
    decimals: 0,
    icon: CreditCard,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    subLabel: "secure payments processed",
  },
  {
    label: "Average Rating",
    display: "4.8/5",
    target: 48,
    suffix: "",
    decimals: 0,
    icon: Star,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    subLabel: "from verified reviews",
  },
];

/** Icon used by the CommunityStats section header chip + CTA arrow. */
export const COMMUNITY_STATS_HEADER_ICON = Activity;
export const COMMUNITY_STATS_CTA_ICON = ArrowRight;

// ─── Marketplace metrics ───────────────────────────────────────────────────

export interface MetricData {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  sparkline: number[];
}

/**
 * The four KPI cards (GMV / Active Orders / Avg. Delivery Time / Seller
 * Satisfaction) shown in the MarketplaceMetrics section. The delivery-time
 * metric is flagged isPositive=true even though the change is negative because
 * a faster delivery time is a good outcome.
 */
export const MARKETPLACE_METRICS: MetricData[] = [
  {
    label: "Total GMV",
    value: "₦2.4B",
    change: "+18.3%",
    isPositive: true,
    icon: TrendingUp,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    sparkline: [40, 55, 45, 65, 58, 75, 90],
  },
  {
    label: "Active Orders",
    value: "12,847",
    change: "+24.1%",
    isPositive: true,
    icon: Package,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    sparkline: [30, 42, 50, 38, 62, 70, 85],
  },
  {
    label: "Avg. Delivery Time",
    value: "2.3 days",
    change: "-12.5%",
    isPositive: true, // Negative change in delivery time is good
    icon: Clock,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    sparkline: [80, 72, 65, 58, 50, 45, 38],
  },
  {
    label: "Seller Satisfaction",
    value: "97.2%",
    change: "+2.1%",
    isPositive: true,
    icon: Heart,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    sparkline: [60, 65, 68, 72, 78, 82, 95],
  },
];

export interface WeeklyActivityItem {
  day: string;
  value: number;
}

/** Weekly activity bar chart values (Mon–Sun). Friday is the peak (index 4). */
export const WEEKLY_ACTIVITY: WeeklyActivityItem[] = [
  { day: "Mon", value: 68 },
  { day: "Tue", value: 85 },
  { day: "Wed", value: 72 },
  { day: "Thu", value: 92 },
  { day: "Fri", value: 100 },
  { day: "Sat", value: 78 },
  { day: "Sun", value: 45 },
];

// ─── Testimonials (enhanced) ───────────────────────────────────────────────

export interface ReviewData {
  id: string;
  name: string;
  initials: string;
  location: string;
  date: string;
  rating: number;
  text: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  product: string;
}

export interface RatingRow {
  stars: number;
  percentage: number;
}

/** Aggregate overall rating + total-review label shown in the summary card. */
export const TESTIMONIALS_OVERALL_RATING = 4.8;
export const TESTIMONIALS_TOTAL_REVIEWS = "2,500+";

/** Star distribution percentages rendered as bars next to the overall rating. */
export const TESTIMONIALS_RATING_BREAKDOWN: RatingRow[] = [
  { stars: 5, percentage: 68 },
  { stars: 4, percentage: 22 },
  { stars: 3, percentage: 7 },
  { stars: 2, percentage: 2 },
  { stars: 1, percentage: 1 },
];

/** The three featured review cards. */
export const TESTIMONIALS_REVIEWS: ReviewData[] = [
  {
    id: "1",
    name: "Sarah K.",
    initials: "SK",
    location: "Lagos",
    date: "2 weeks ago",
    rating: 5,
    text: "The best marketplace I've used in Africa! Fast delivery and genuine products.",
    verified: true,
    helpful: 47,
    unhelpful: 2,
    product: "Ankara Print Dress",
  },
  {
    id: "2",
    name: "Emmanuel T.",
    initials: "ET",
    location: "Accra",
    date: "2 weeks ago",
    rating: 5,
    text: "As a seller, Kwikseller has transformed my business. Sales tripled in 3 months!",
    verified: false,
    helpful: 35,
    unhelpful: 1,
    product: "Electronics Store",
  },
  {
    id: "3",
    name: "Fatima D.",
    initials: "FD",
    location: "Nairobi",
    date: "2 weeks ago",
    rating: 4,
    text: "Great escrow system gives me confidence when buying from new sellers.",
    verified: false,
    helpful: 28,
    unhelpful: 3,
    product: "Wireless Headphones",
  },
];

// ─── Vendor spotlight ──────────────────────────────────────────────────────

export interface VendorSpotlightItem {
  id: string;
  storeName: string;
  initials: string;
  category: string;
  location: string;
  description: string;
  products: string;
  rating: number;
  sold: string;
  badge: "Featured" | "Top Rated" | "Rising Star";
  badgeColor: string;
  coverColor: string;
  tags: string[];
}

/**
 * Six highest-performing vendors featured in the VendorSpotlight carousel.
 * `coverColor` / `badgeColor` are Tailwind bg utilities (token-mapped).
 */
export const VENDOR_SPOTLIGHT: VendorSpotlightItem[] = [
  {
    id: "1",
    storeName: "Zara's Collection",
    initials: "ZC",
    category: "Fashion",
    location: "Lagos, Nigeria",
    description:
      "Nigeria's premier fashion destination for authentic African wear and contemporary designs.",
    products: "1.2K Items",
    rating: 4.9,
    sold: "8.5K Sold",
    badge: "Featured",
    badgeColor: "bg-amber-500",
    coverColor: "bg-pink-500",
    tags: ["Ankara", "Ready-to-Wear", "Accessories"],
  },
  {
    id: "2",
    storeName: "TechHub Africa",
    initials: "TA",
    category: "Electronics",
    location: "Nairobi, Kenya",
    description:
      "Your trusted source for quality electronics and gadgets at competitive prices.",
    products: "856 Items",
    rating: 4.8,
    sold: "12K Sold",
    badge: "Top Rated",
    badgeColor: "bg-emerald-500",
    coverColor: "bg-cyan-500",
    tags: ["Phones", "Laptops", "Accessories"],
  },
  {
    id: "3",
    storeName: "Glow Beauty Bar",
    initials: "GB",
    category: "Beauty",
    location: "Accra, Ghana",
    description:
      "Premium beauty products from top global and African brands curated just for you.",
    products: "634 Items",
    rating: 4.9,
    sold: "6.2K Sold",
    badge: "Featured",
    badgeColor: "bg-amber-500",
    coverColor: "bg-violet-500",
    tags: ["Skincare", "Makeup", "Hair"],
  },
  {
    id: "4",
    storeName: "FreshMart Express",
    initials: "FE",
    category: "Food & Drinks",
    location: "Kano, Nigeria",
    description:
      "Fresh produce and packaged goods delivered to your door with reliable logistics.",
    products: "2.1K Items",
    rating: 4.7,
    sold: "15K Sold",
    badge: "Rising Star",
    badgeColor: "bg-sky-500",
    coverColor: "bg-green-500",
    tags: ["Groceries", "Beverages", "Snacks"],
  },
  {
    id: "5",
    storeName: "HomeVibe Decor",
    initials: "HV",
    category: "Home & Garden",
    location: "Enugu, Nigeria",
    description:
      "Transform your space with our curated home decor collection for every style.",
    products: "478 Items",
    rating: 4.8,
    sold: "3.8K Sold",
    badge: "Rising Star",
    badgeColor: "bg-sky-500",
    coverColor: "bg-orange-500",
    tags: ["Furniture", "Decor", "Kitchen"],
  },
  {
    id: "6",
    storeName: "AutoParts NG",
    initials: "AN",
    category: "Automobiles",
    location: "Lagos, Nigeria",
    description:
      "Genuine auto parts and accessories for all vehicle types with fast delivery.",
    products: "923 Items",
    rating: 4.6,
    sold: "5.1K Sold",
    badge: "Top Rated",
    badgeColor: "bg-emerald-500",
    coverColor: "bg-red-500",
    tags: ["Car Parts", "Motorcycle", "Tools"],
  },
];

// ─── KwikCoins rewards ─────────────────────────────────────────────────────

export interface RewardTier {
  name: string;
  coinRange: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconBg: string;
  borderGradient: string;
  progressColor: string;
  perks: string[];
  progressPercent: number;
}

/**
 * The four reward tiers (Bronze / Silver / Gold / Platinum) shown in the
 * KwikCoinsRewards section. Perk lists and progress percentages are part of
 * the data so they can be tuned without touching the renderer.
 */
export const KWIKCOINS_REWARD_TIERS: RewardTier[] = [
  {
    name: "Bronze",
    coinRange: "1–100 coins",
    subtitle: "Getting Started",
    description:
      "Begin your rewards journey. Every sale earns you coins to unlock better perks.",
    icon: Coins,
    color: "text-amber-700 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    borderGradient: "from-amber-500 to-orange-500",
    progressColor: "bg-amber-500",
    perks: ["Earn 1 coin per sale", "Basic analytics", "Standard support"],
    progressPercent: 65,
  },
  {
    name: "Silver",
    coinRange: "101–500 coins",
    subtitle: "Growing Fast",
    description:
      "Scale your business with enhanced tools and priority access to support.",
    icon: Star,
    color: "text-slate-600 dark:text-slate-300",
    iconBg: "bg-slate-100 dark:bg-slate-800/60",
    borderGradient: "from-slate-400 to-gray-500",
    progressColor: "bg-slate-400",
    perks: [
      "Earn 2 coins per sale",
      "Advanced analytics",
      "Priority support",
      "5% ad discount",
    ],
    progressPercent: 40,
  },
  {
    name: "Gold",
    coinRange: "501–2,000 coins",
    subtitle: "Top Seller",
    description:
      "Unlock premium features and get your products featured on the marketplace.",
    icon: Trophy,
    color: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-50 dark:bg-yellow-900/30",
    borderGradient: "from-yellow-400 to-amber-500",
    progressColor: "bg-yellow-500",
    perks: [
      "Earn 3 coins per sale",
      "Full analytics suite",
      "24/7 support",
      "15% ad discount",
      "Featured placement",
    ],
    progressPercent: 75,
  },
  {
    name: "Platinum",
    coinRange: "2,000+ coins",
    subtitle: "Elite Vendor",
    description:
      "The ultimate seller tier with maximum visibility and dedicated account management.",
    icon: Crown,
    color: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    borderGradient: "from-purple-500 to-violet-600",
    progressColor: "bg-purple-500",
    perks: [
      "Earn 5 coins per sale",
      "Premium dashboard",
      "Dedicated manager",
      "25% ad discount",
      "Homepage feature",
    ],
    progressPercent: 30,
  },
];

export interface EarningMethod {
  icon: LucideIcon;
  title: string;
  coins: string;
  description: string;
  color: string;
  bg: string;
}

/** Three "Earning Methods" cards shown below the reward tiers. */
export const KWIKCOINS_EARNING_METHODS: EarningMethod[] = [
  {
    icon: ShoppingBag,
    title: "Make a Sale",
    coins: "+1–5 coins",
    description: "Earn coins for every successful transaction based on your tier",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    icon: UserPlus,
    title: "Refer a Friend",
    coins: "+50 coins",
    description: "Get rewarded when new vendors sign up using your referral link",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    icon: Target,
    title: "Complete Milestone",
    coins: "+100 coins",
    description: "Hit sales targets and achieve marketplace goals for bonus rewards",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/40",
  },
];

// ─── Referral program ──────────────────────────────────────────────────────

export interface ReferralEarningCard {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const REFERRAL_EARNINGS_CARDS: ReferralEarningCard[] = [
  {
    title: "Referral Reward",
    value: "₦500",
    subtitle: "+ 5% commission on their first 5 orders",
    icon: CreditCard,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    title: "Friend Bonus",
    value: "₦200",
    subtitle: "Welcome credit for your friend",
    icon: Gift,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    title: "Monthly Bonus",
    value: "₦2,000",
    subtitle: "For 10+ referrals in a month",
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/40",
  },
];

export interface ReferralShareButton {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  hoverBg: string;
}

export const REFERRAL_SHARE_BUTTONS: ReferralShareButton[] = [
  {
    label: "Copy Link",
    icon: LinkIcon,
    color: "text-default-600 dark:text-default-300",
    bg: "bg-default-100 dark:bg-default-200/30",
    hoverBg: "hover:bg-default-200 dark:hover:bg-default-200/50",
  },
  {
    label: "WhatsApp",
    icon: MessageCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    hoverBg: "hover:bg-emerald-200 dark:hover:bg-emerald-900/60",
  },
  {
    label: "Twitter/X",
    icon: Twitter,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-900/40",
    hoverBg: "hover:bg-sky-200 dark:hover:bg-sky-900/60",
  },
  {
    label: "Email",
    icon: Mail,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/40",
    hoverBg: "hover:bg-rose-200 dark:hover:bg-rose-900/60",
  },
];

export interface ReferralHowStep {
  number: number;
  title: string;
  description: string;
}

export const REFERRAL_HOW_STEPS: ReferralHowStep[] = [
  {
    number: 1,
    title: "Share Your Link",
    description: "Send your unique referral code to friends and family",
  },
  {
    number: 2,
    title: "Friend Signs Up",
    description: "They register on Kwikseller using your referral code",
  },
  {
    number: 3,
    title: "Both Earn Rewards",
    description: "You earn ₦500 and your friend gets ₦200 welcome credit",
  },
];

export interface ReferralStatPill {
  label: string;
  icon: LucideIcon;
}

export const REFERRAL_STATS: ReferralStatPill[] = [
  { label: "24 Referrals", icon: Users },
  { label: "₦12,000 Earned", icon: CreditCard },
  { label: "8 Active", icon: Check },
];

/** Sample referral code shown in the "Your Referral Code" card. */
export const REFERRAL_SAMPLE_CODE = "KWIK-EMMA-2024";

// ─── Stats ticker ──────────────────────────────────────────────────────────

/**
 * Strings shown in the infinite-marquee stats ticker. Joined with the
 * STATS_TICKER_SEPARATOR on render.
 */
export const STATS_TICKER_ITEMS: string[] = [
  "12,543 orders processed today",
  "₦45M+ in transactions this month",
  "847 new vendors joined this week",
  "2.3M+ products and counting",
  "15 countries and growing",
  "Free delivery on 10K+ orders",
  "99.9% uptime guaranteed",
  "24/7 customer support",
  "Escrow protection on all payments",
  "15K+ 5-star reviews",
];

/** Separator string rendered between every stats-ticker item. */
export const STATS_TICKER_SEPARATOR = "  •  ";

// ─── Social proof partners ─────────────────────────────────────────────────

export interface SocialProofPartner {
  name: string;
  /** Two-letter logo placeholder rendered in the marquee tile. */
  logo: string;
}

/**
 * Partner brands shown in the dual-row SocialProof marquee. Row 1 = first 6,
 * Row 2 = remaining 6.
 */
export const SOCIAL_PROOF_PARTNERS: SocialProofPartner[] = [
  { name: "Paystack", logo: "PS" },
  { name: "Flutterwave", logo: "FW" },
  { name: "FedEx", logo: "FX" },
  { name: "DHL", logo: "DH" },
  { name: "GIG Logistics", logo: "GL" },
  { name: "Bolt", logo: "BL" },
  { name: "MTN", logo: "MT" },
  { name: "Airtel", logo: "AI" },
  { name: "MoMo", logo: "MM" },
  { name: "Opay", logo: "OP" },
  { name: "PalmPay", logo: "PP" },
  { name: "Cowrywise", logo: "CW" },
];

// ─── How it works ──────────────────────────────────────────────────────────

export interface HowItWorksStep {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse thousands of products from verified sellers across Africa. Filter by category, price, and location.",
  },
  {
    number: 2,
    icon: ShoppingCart,
    title: "Add to Cart",
    description:
      "Select your items, compare prices, and add them to your cart. Save favorites for later.",
  },
  {
    number: 3,
    icon: ShieldCheck,
    title: "Secure Payment",
    description:
      "Pay safely with Paystack, MoMo, bank transfer, or card. All payments are escrow-protected.",
  },
  {
    number: 4,
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Track your order in real time and receive fast, reliable delivery right to your doorstep.",
  },
];

// ─── Buyer protection features ─────────────────────────────────────────────

export interface BuyerProtectionFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  border: string;
}

export const BUYER_PROTECTION_FEATURES: BuyerProtectionFeature[] = [
  {
    icon: CreditCard,
    title: "Escrow Payment Protection",
    description:
      "Your money is held safely in escrow until you confirm delivery. Sellers only get paid when you are satisfied.",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    border: "border-accent/10",
  },
  {
    icon: HeartPulse,
    title: "Money-Back Guarantee",
    description:
      "Get a full refund if your item does not match the description. No questions asked — your satisfaction comes first.",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    border: "border-success/10",
  },
  {
    icon: UserPlus,
    title: "Verified Sellers",
    description:
      "Every vendor is verified with government-issued ID and business documents so you can shop with confidence.",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    border: "border-warning/10",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description:
      "All transactions are encrypted with industry-standard SSL technology. Your card details are never stored on our servers.",
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    border: "border-danger/10",
  },
  {
    icon: LifeBuoy,
    title: "Dispute Resolution",
    description:
      "Our dedicated support team is available 24/7 to mediate and resolve any issues between buyers and sellers quickly.",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    border: "border-accent/10",
  },
  {
    icon: Gem,
    title: "Product Authenticity",
    description:
      "We guarantee that every product listed is authentic. If you receive a counterfeit item, you get your money back.",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    border: "border-success/10",
  },
];

/** Header chip icon for the BuyerProtection section. */
export const BUYER_PROTECTION_HEADER_ICON = Shield;

// ─── Trust indicators ──────────────────────────────────────────────────────

export interface TrustFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bg: string;
}

export const TRUST_FEATURES: TrustFeature[] = [
  {
    icon: Shield,
    title: "Escrow Protection",
    description: "Your money is held safely until you confirm delivery",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Reliable delivery across 15+ African countries",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support team ready to help anytime",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Hassle-free returns within 7 days of delivery",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export interface PaymentBadge {
  icon: LucideIcon;
  label: string;
}

export const TRUST_PAYMENT_BADGES: PaymentBadge[] = [
  { icon: CreditCard, label: "Visa" },
  { icon: CreditCard, label: "Mastercard" },
  { icon: Lock, label: "Paystack" },
  { icon: Smartphone, label: "MoMo" },
  { icon: Smartphone, label: "Flutterwave" },
  { icon: Store, label: "Bank Transfer" },
];

// ─── Top vendors ───────────────────────────────────────────────────────────

export interface TopVendorItem {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  totalSales: string;
  badge: string;
  isVerified: boolean;
  accentColor: string;
}

export const TOP_VENDORS: TopVendorItem[] = [
  {
    id: "1",
    name: "Nneka's Fabrics",
    slug: "nnekas-fabrics",
    avatar: "NF",
    description: "Premium African fabrics and textiles",
    location: "Lagos, Nigeria",
    rating: 4.9,
    reviewCount: 1240,
    totalSales: "15K+",
    badge: "Top Seller",
    isVerified: true,
    accentColor: "from-pink-500 to-rose-500",
  },
  {
    id: "2",
    name: "TechHub Ghana",
    slug: "techhub-ghana",
    avatar: "TH",
    description: "Electronics and gadgets at best prices",
    location: "Accra, Ghana",
    rating: 4.8,
    reviewCount: 890,
    totalSales: "8K+",
    badge: "Verified",
    isVerified: true,
    accentColor: "from-cyan-500 to-blue-500",
  },
  {
    id: "3",
    name: "Fati's Kitchen",
    slug: "fatis-kitchen",
    avatar: "FK",
    description: "Authentic African food and spices",
    location: "Abuja, Nigeria",
    rating: 4.9,
    reviewCount: 2100,
    totalSales: "25K+",
    badge: "Top Seller",
    isVerified: true,
    accentColor: "from-orange-500 to-amber-500",
  },
  {
    id: "4",
    name: "EcoWear Nairobi",
    slug: "ecowear-nairobi",
    avatar: "EW",
    description: "Sustainable fashion and accessories",
    location: "Nairobi, Kenya",
    rating: 4.7,
    reviewCount: 560,
    totalSales: "4K+",
    badge: "Rising Star",
    isVerified: true,
    accentColor: "from-green-500 to-emerald-500",
  },
];

// ─── Video testimonials ────────────────────────────────────────────────────

export interface VideoTestimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  initials: string;
  color: string;
  duration: string;
  category: string;
}

export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    id: "1",
    name: "Adaeze Okonkwo",
    role: "Fashion Designer, Lagos",
    rating: 5,
    quote:
      "KWIKSELLER transformed my small Ankara business into a brand serving customers across West Africa. The pool selling feature is genius!",
    initials: "AO",
    color: "bg-pink-500",
    duration: "2:34",
    category: "Fashion",
  },
  {
    id: "2",
    name: "Emmanuel Mensah",
    role: "Electronics Dealer, Accra",
    rating: 5,
    quote:
      "The delivery network is incredible. My customers in Kumasi get their orders same-day. Revenue tripled in 6 months.",
    initials: "EM",
    color: "bg-blue-500",
    duration: "1:58",
    category: "Electronics",
  },
  {
    id: "3",
    name: "Fatima Abubakar",
    role: "Beauty Entrepreneur, Kano",
    rating: 4,
    quote:
      "KwikCoins rewards keep me motivated. I've earned enough coins for free ads that brought in 200 new customers.",
    initials: "FA",
    color: "bg-purple-500",
    duration: "3:12",
    category: "Beauty",
  },
  {
    id: "4",
    name: "David Mwangi",
    role: "Phone Accessories, Nairobi",
    rating: 5,
    quote:
      "Starting with zero inventory was a game-changer. Pool selling let me test products risk-free before stocking them.",
    initials: "DM",
    color: "bg-green-500",
    duration: "2:07",
    category: "Phones",
  },
  {
    id: "5",
    name: "Aisha Diallo",
    role: "Food Vendor, Dakar",
    rating: 5,
    quote:
      "The escrow protection gives my customers confidence. My return rate dropped to near zero since joining KWIKSELLER.",
    initials: "AD",
    color: "bg-orange-500",
    duration: "1:45",
    category: "Food & Drinks",
  },
  {
    id: "6",
    name: "Chidi Nwosu",
    role: "Home Decor, Enugu",
    rating: 4,
    quote:
      "Analytics dashboard shows me exactly what's trending. I adjust my inventory weekly and profits keep growing.",
    initials: "CN",
    color: "bg-teal-500",
    duration: "2:51",
    category: "Home & Garden",
  },
];

// ─── Seller stories ────────────────────────────────────────────────────────

export type SellerStoryCategory = "All" | "Fashion" | "Electronics" | "Food" | "Services";

export interface SellerStory {
  id: string;
  name: string;
  location: string;
  category: SellerStoryCategory;
  quote: string;
  started: number;
  revenueGrowth: string;
  products: string;
  rating: number;
  avatar: string;
  avatarColor: string;
}

export const SELLER_STORIES: SellerStory[] = [
  {
    id: "1",
    name: "Amina's Fashion Hub",
    location: "Lagos, Nigeria",
    category: "Fashion",
    quote:
      "From selling in a local market to reaching customers across 8 African countries. KWIKSELLER changed everything for my business.",
    started: 2022,
    revenueGrowth: "+340%",
    products: "200+",
    rating: 4.9,
    avatar: "A",
    avatarColor: "bg-pink-500",
  },
  {
    id: "2",
    name: "TechConnect",
    location: "Nairobi, Kenya",
    category: "Electronics",
    quote:
      "The product pool feature lets us offer 500+ items without holding inventory. Our margins doubled in 6 months.",
    started: 2023,
    revenueGrowth: "+180%",
    products: "500+",
    rating: 4.8,
    avatar: "T",
    avatarColor: "bg-cyan-500",
  },
  {
    id: "3",
    name: "Mama Nkechi's Kitchen",
    location: "Accra, Ghana",
    category: "Food",
    quote:
      "I started with just 5 products. Now I have a full food brand with delivery across Ghana. The escrow system gives my customers confidence.",
    started: 2021,
    revenueGrowth: "+520%",
    products: "45",
    rating: 5.0,
    avatar: "M",
    avatarColor: "bg-green-500",
  },
  {
    id: "4",
    name: "QuickFix Services",
    location: "Kigali, Rwanda",
    category: "Services",
    quote:
      "As a service provider, I never thought an e-commerce platform would work for me. KWIKSELLER proved me wrong with their flexible listing system.",
    started: 2023,
    revenueGrowth: "+150%",
    products: "30+",
    rating: 4.7,
    avatar: "Q",
    avatarColor: "bg-orange-500",
  },
];

/** Tab labels shown in the seller stories filter bar (order = display order). */
export const SELLER_STORY_TABS: SellerStoryCategory[] = [
  "All",
  "Fashion",
  "Electronics",
  "Food",
  "Services",
];

// ─── Pricing page ──────────────────────────────────────────────────────────

export type PricingPlanKey = "free" | "growth" | "enterprise";

export interface PricingPlanTier {
  key: PricingPlanKey;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  icon: LucideIcon;
  popular: boolean;
  features: string[];
  ctaLabel: string;
}

/**
 * The three pricing tiers (Free / Growth / Enterprise) shown in the PricingPage
 * hero. Growth is the highlighted ("popular") plan.
 */
export const PRICING_PLANS: PricingPlanTier[] = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for new sellers exploring the marketplace",
    icon: Rocket,
    popular: false,
    features: [
      "Up to 50 product listings",
      "Basic analytics dashboard",
      "Email support (48h response)",
      "Standard delivery integration",
      "5% transaction fee",
      "Kwikseller community access",
    ],
    ctaLabel: "Start Free",
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 5000,
    yearlyPrice: 48000,
    description: "For serious sellers ready to scale their business",
    icon: TrendingUp,
    popular: true,
    features: [
      "Unlimited product listings",
      "Advanced analytics & insights",
      "Priority support (4h response)",
      "Fast delivery integration",
      "3% transaction fee",
      "Pool selling access",
      "Custom store theme",
      "Featured placement in marketplace",
      "KwikCoins bonus: 100/month",
      "Marketing tools & promotions",
    ],
    ctaLabel: "Get Growth",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 15000,
    yearlyPrice: 144000,
    description: "Maximum power for established businesses & brands",
    icon: Crown,
    popular: false,
    features: [
      "Everything in Growth, plus:",
      "Dedicated account manager",
      "Full API access & webhooks",
      "Bulk listing tools (CSV/Excel)",
      "White-label options",
      "Custom integrations",
      "1% transaction fee",
      "SLA guarantee (99.9% uptime)",
      "Custom domain support",
      "KwikCoins bonus: 500/month",
      "Multi-store management",
      "Priority feature requests",
    ],
    ctaLabel: "Go Enterprise",
  },
];

export interface PricingComparisonRow {
  label: string;
  icon?: LucideIcon;
  free: string | boolean;
  growth: string | boolean;
  enterprise: string | boolean;
}

/**
 * Row-by-row feature comparison table (Free vs Growth vs Enterprise). A value
 * of `false` renders an X, `true` renders a check; string values are shown as
 * inline text.
 */
export const PRICING_COMPARISON_FEATURES: PricingComparisonRow[] = [
  { label: "Product Listings", icon: Package, free: "Up to 50", growth: "Unlimited", enterprise: "Unlimited" },
  { label: "Analytics", icon: BarChart3, free: "Basic", growth: "Advanced", enterprise: "Full Suite + API" },
  { label: "Support", icon: Headphones, free: "Email (48h)", growth: "Priority (4h)", enterprise: "Dedicated Manager" },
  { label: "Transaction Fee", icon: BadgePercent, free: "5%", growth: "3%", enterprise: "1%" },
  { label: "Delivery Speed", icon: Clock, free: "Standard", growth: "Fast", enterprise: "Priority" },
  { label: "Pool Selling", free: false, growth: true, enterprise: true },
  { label: "Custom Store Theme", icon: Palette, free: false, growth: true, enterprise: true },
  { label: "Featured Placement", icon: Star, free: false, growth: true, enterprise: true },
  { label: "Marketing Tools", free: false, growth: true, enterprise: true },
  { label: "KwikCoins Bonus", icon: Gift, free: "—", growth: "100/mo", enterprise: "500/mo" },
  { label: "API Access", icon: Code2, free: false, growth: false, enterprise: true },
  { label: "Bulk Listing Tools", icon: FileSpreadsheet, free: false, growth: false, enterprise: true },
  { label: "White-Label Options", icon: Layers, free: false, growth: false, enterprise: true },
  { label: "Custom Integrations", icon: Globe, free: false, growth: false, enterprise: true },
  { label: "Multi-Store Support", icon: Users, free: false, growth: false, enterprise: true },
  { label: "Custom Domain", free: false, growth: false, enterprise: true },
  { label: "SLA Guarantee", icon: ShieldCheck, free: false, growth: false, enterprise: "99.9%" },
];

export interface PricingFaq {
  question: string;
  answer: string;
}

export const PRICING_FAQS: PricingFaq[] = [
  {
    question: "Can I switch between plans at any time?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time from your dashboard. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the start of your next billing cycle, and you'll be credited the prorated difference.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept payments via Paystack and Flutterwave, which means you can pay with debit cards, bank transfers, USSD, and mobile money. All transactions are securely processed with bank-grade encryption.",
  },
  {
    question: "What happens to my data if I cancel my subscription?",
    answer:
      "Your data remains safe for 90 days after cancellation. During this period, you can reactivate your plan and pick up right where you left off. After 90 days, your store data will be permanently deleted in accordance with our privacy policy.",
  },
  {
    question: "How does the transaction fee work?",
    answer:
      "The transaction fee is a small percentage taken from each successful sale on the platform. Free plan sellers pay 5%, Growth sellers pay 3%, and Enterprise sellers enjoy the lowest rate at just 1%. This fee covers payment processing, platform maintenance, and buyer protection.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "Yes! Both Growth and Enterprise plans come with a 14-day free trial. You get full access to all plan features during the trial period — no credit card required. If you decide not to continue, your account simply reverts to the Free plan.",
  },
  {
    question:
      "Do you offer discounts for non-profits or educational institutions?",
    answer:
      "Absolutely! We offer special pricing for registered non-profits, educational institutions, and student entrepreneurs. Contact our sales team at sales@kwikseller.com with your organization details, and we'll create a custom plan for you.",
  },
];
