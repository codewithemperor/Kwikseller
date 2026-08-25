"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Heart,
  HelpCircle,
  MapPin,
  Package,
  ShoppingCart,
  Store,
  Tag,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountNavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

export const ACCOUNT_NAV_LINKS: AccountNavLink[] = [
  { href: "/profile", label: "Profile", icon: UserIcon, match: (p) => p === "/profile" },
  { href: "/orders", label: "Orders", icon: Package, match: (p) => p === "/orders" },
  {
    href: "/profile/addresses",
    label: "Addresses",
    icon: MapPin,
    match: (p) => p === "/profile/addresses",
  },
  { href: "/profile/wallet", label: "KwikCoins", icon: Wallet, match: (p) => p === "/profile/wallet" },
  {
    href: "/profile/notifications",
    label: "Notifications",
    icon: Bell,
    match: (p) => p === "/profile/notifications",
  },
  { href: "/coupons", label: "Promo Codes", icon: Tag, match: (p) => p === "/coupons" },
  { href: "/wishlist", label: "Wishlist", icon: Heart, match: (p) => p === "/wishlist" },
  { href: "/cart", label: "Cart", icon: ShoppingCart, match: (p) => p === "/cart" },
  { href: "/vendor-orders", label: "Vendor Orders", icon: Store, match: (p) => p === "/vendor-orders" },
  { href: "/vendor-analytics", label: "Vendor Analytics", icon: BarChart3, match: (p) => p === "/vendor-analytics" },
  { href: "/help", label: "Help & Support", icon: HelpCircle, match: (p) => p === "/help" },
];

export function AccountNavLinks({
  pathname,
  cartCount,
  wishlistCount,
  links = ACCOUNT_NAV_LINKS,
  onNavigate,
}: {
  pathname: string;
  cartCount: number;
  wishlistCount: number;
  links?: AccountNavLink[];
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Account" className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.match(pathname);
        const badge =
          link.href === "/cart"
            ? cartCount
            : link.href === "/wishlist"
              ? wishlistCount
              : 0;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? "bg-kwik-orange/10 text-kwik-orange"
                : "text-kwik-muted hover:bg-kwik-bg-surface hover:text-kwik-dark",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-kwik-orange" : "text-kwik-gray-light group-hover:text-kwik-dark",
              )}
            />
            <span className="flex-1">{link.label}</span>
            {badge > 0 ? (
              <span
                aria-label={`${badge} item${badge > 1 ? "s" : ""}`}
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-kwik-orange px-1.5 text-[10px] font-bold text-white"
              >
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
