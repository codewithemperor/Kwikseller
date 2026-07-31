/**
 * auth.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Single source of truth for marketplace (buyer) auth-page constants: portal
 * configs for login/register, password-strength rule definitions, role options
 * for the register role-selector, and the marketing feature cards shown in the
 * (auth) layout sidebar. Components import these instead of inlining them.
 */

import type { LucideIcon } from "lucide-react";
import {
  Layers3,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

// ─── Portal configs ────────────────────────────────────────────────────────

/**
 * The marketplace buyer portal config consumed by the shared LoginPage
 * component. Vendors/admin/riders each ship their own portal config in their
 * own apps; this is the marketplace (buyer) one.
 */
export const MARKETPLACE_LOGIN_PORTAL = {
  name: "KWIKSELLER",
  description: "Sign in to your account to continue shopping",
  themeColor: "blue" as const,
  redirectPath: "/",
  showRegisterLink: true,
  registerPath: "/register",
};

/**
 * The marketplace buyer portal config consumed by the shared RegisterPage
 * component. `vendorRegisterUrl` is resolved at module load from the
 * NEXT_PUBLIC_VENDOR_REGISTER_URL env var (with a localhost fallback for dev).
 */
const VENDOR_REGISTER_URL =
  process.env.NEXT_PUBLIC_VENDOR_REGISTER_URL ?? "http://localhost:3001/register";

export const MARKETPLACE_REGISTER_PORTAL = {
  name: "KWIKSELLER",
  description: "Join Africa's largest marketplace",
  themeColor: "blue" as const,
  redirectPath: "/",
  loginPath: "/login",
  defaultRole: "BUYER" as const,
  showRoleSelector: true,
  // Redirect vendors to the vendor app registration page
  vendorRegisterUrl: VENDOR_REGISTER_URL,
};

// ─── Role selector ─────────────────────────────────────────────────────────

export type RegisterRole = "BUYER" | "VENDOR";

export interface RoleOption {
  role: RegisterRole;
  /** Icon shown in the left tile of the role-selector. */
  icon: LucideIcon;
  /** Whether the icon tile uses the foreground or accent background. */
  variant: "foreground" | "accent";
  title: string;
  description: string;
  /** Optional popularity chip label — set on VENDOR tile only. */
  popularLabel?: string;
}

/**
 * The two role tiles rendered on the first step of the buyer/vendor register
 * flow. The VENDOR option forwards the user to the vendor app; the BUYER option
 * advances to step 2.
 */
export const REGISTER_ROLE_OPTIONS: RoleOption[] = [
  {
    role: "BUYER",
    icon: ShoppingBag,
    variant: "foreground",
    title: "I want to shop",
    description: "Browse products, track orders, and earn KwikCoins rewards",
  },
  {
    role: "VENDOR",
    icon: Store,
    variant: "accent",
    title: "I want to sell",
    description: "Create your store, list products, and grow your business",
    popularLabel: "Popular",
  },
];

// ─── Password strength rules ───────────────────────────────────────────────

export interface PasswordRule {
  label: string;
  /** Returns true when the supplied password satisfies the rule. */
  test: (password: string) => boolean;
}

/**
 * The five password-strength rules rendered as check-list items under the
 * password field on the register form. Order = display order.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  {
    label: "Special character",
    test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
];

/** Characters that count as "special" for the password rule. Re-exported for
 *  any other component that wants to display or validate the same set. */
export const PASSWORD_SPECIAL_CHARS = "!@#$%^&*(),.?\":{}|<>";

// ─── (auth) layout sidebar feature cards ───────────────────────────────────

export interface AuthFeatureCard {
  icon: LucideIcon;
  title: string;
  text: string;
}

/**
 * The three feature cards rendered in the dark sidebar of the (auth) layout
 * (Pool-aware cart / Manual dispatch ready / Secure checkout).
 */
export const AUTH_SIDEBAR_FEATURES: AuthFeatureCard[] = [
  {
    icon: Layers3,
    title: "Pool-aware cart",
    text: "Vendor stock, Pool resale, and group-buy discovery stay clearly separated.",
  },
  {
    icon: Truck,
    title: "Manual dispatch ready",
    text: "State and local government rates feed admin delivery assignment.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Paystack checkout is backed by server-side totals and validation.",
  },
];

/**
 * Short tagline + heading + body copy shown above the feature cards in the auth
 * sidebar. Centralised so the wording stays consistent across touch-ups.
 */
export const AUTH_SIDEBAR_HEADING = {
  heading:
    "Shop vendor stock, Pool resale, and digital products from one checkout.",
  body:
    "Kwikseller now validates inventory, delivery eligibility, digital fulfillment, and payment before every order moves to operations.",
  footerNote: "Buyer accounts are protected with email verification.",
};
