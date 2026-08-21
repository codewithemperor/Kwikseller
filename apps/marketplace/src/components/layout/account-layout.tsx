"use client";

import React, { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Menu,
  Package,
  ShoppingCart,
  Store,
  Tag,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { kwikToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { useCartStore, useWishlistStore } from "@/stores";
import { cn } from "@/lib/utils";
import { AccountNavDrawer, type AccountNavLink } from "@/components/drawers/account-nav-drawer";

/* ─── Account navigation config ─────────────────────────────── */

const ACCOUNT_NAV_LINKS: AccountNavLink[] = [
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

/* ─── Shared nav links renderer ─────────────────────────────── */

function NavLinks({
  pathname,
  cartCount,
  wishlistCount,
  links,
  onNavigate,
}: {
  pathname: string;
  cartCount: number;
  wishlistCount: number;
  links: AccountNavLink[];
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
            {badge > 0 && (
              <span
                aria-label={`${badge} item${badge > 1 ? "s" : ""}`}
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-kwik-orange px-1.5 text-[10px] font-bold text-white"
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── User avatar chip ──────────────────────────────────────── */

function UserChip({ clickable = true }: { clickable?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  // useSyncExternalStore avoids a setState-in-effect lint violation while
  // still giving us a server-safe `mounted` flag (false on SSR, true on client).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const displayName =
    user?.profile?.firstName ||
    (user?.email ? user.email.split("@")[0] : "Guest");
  const initials = React.useMemo(() => {
    const first = user?.profile?.firstName?.[0] ?? "";
    const last = user?.profile?.lastName?.[0] ?? "";
    if (first || last) return (first + last).toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "G";
  }, [user]);

  const content = (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-kwik-gradient text-sm font-bold text-white ring-2 ring-white/40">
        {mounted && isAuthenticated && user?.profile?.avatarUrl ? (
          <Image
            src={user.profile.avatarUrl}
            alt={displayName}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="max-w-[140px] truncate text-sm font-semibold text-kwik-dark">
          {displayName}
        </span>
        <span className="text-[11px] text-kwik-muted">
          {mounted && isAuthenticated ? "Account" : "Browse as guest"}
        </span>
      </span>
    </span>
  );

  if (!clickable) return content;

  return (
    <button
      type="button"
      onClick={() => router.push("/profile")}
      className="flex min-h-[44px] items-center rounded-full px-2 py-1 transition-colors hover:bg-kwik-bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      aria-label={`View account profile for ${displayName}`}
    >
      {content}
    </button>
  );
}

/* ─── Account layout ────────────────────────────────────────── */

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hideTopBar = pathname === "/orders" || pathname.startsWith("/orders/");

  const cartCount = useCartStore((s) => s.items.length);
  const wishlistCount = useWishlistStore((s) => s.itemCount);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  // Close on Escape key.
  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isDrawerOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      kwikToast.success("Logged out successfully");
      router.push("/");
    } catch {
      kwikToast.error("Failed to log out");
    }
  }, [logout, router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f8]" data-account-layout>
      {/* ─── Minimal top bar ─── */}
      {!hideTopBar ? (
        <header className="sticky top-0 z-40 border-b border-kwik-border bg-background/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              {/* Mobile hamburger — toggles the drawer */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open account menu"
                aria-expanded={isDrawerOpen}
                aria-controls="account-drawer"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-kwik-muted transition-colors hover:bg-kwik-bg-surface hover:text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                aria-label="Back to Kwikseller shop"
              >
                <Image
                  src="/icon.png"
                  alt="Kwikseller logo"
                  width={28}
                  height={28}
                  className="rounded-md"
                />
                <span className="text-lg font-bold tracking-tight text-kwik-dark">
                  Kwikseller
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <UserChip />
            </div>
          </div>
        </header>
      ) : null}

      {/* ─── Body: sidebar (desktop) + main content ─── */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className={cn(
            "flex max-h-[calc(100vh-4rem)] flex-col overflow-y-auto border-r border-[#e9eaec] bg-white p-4",
            hideTopBar ? "sticky top-0 max-h-screen" : "sticky top-16",
          )}>
            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
              Account
            </p>
            <NavLinks
              pathname={pathname}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
              links={ACCOUNT_NAV_LINKS}
            />

            <div className="my-4 h-px bg-kwik-border-light" />

            <Link
              href="/"
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-kwik-muted transition-colors hover:bg-kwik-bg-surface hover:text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-5 w-5 text-kwik-gray-light" />
              <span>Back to Shop</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-kwik-red transition-colors hover:bg-kwik-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-red focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-0">
          {children}
        </main>
      </div>

      {/* ─── Mobile drawer ─── */}
      <AccountNavDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onLogout={handleLogout}
        pathname={pathname}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        links={ACCOUNT_NAV_LINKS}
        userChip={<UserChip clickable={false} />}
      />
    </div>
  );
}
