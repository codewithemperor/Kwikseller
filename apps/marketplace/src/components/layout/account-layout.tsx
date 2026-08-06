"use client";

import React, { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  X,
} from "lucide-react";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { useCartStore, useWishlistStore } from "@/stores";
import { cn } from "@/lib/utils";

/* ─── Account navigation config ─────────────────────────────── */

type AccountNavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Exact pathname match for active-state highlighting. */
  match: (pathname: string) => boolean;
};

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
  onNavigate,
}: {
  pathname: string;
  cartCount: number;
  wishlistCount: number;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Account" className="flex flex-col gap-1">
      {ACCOUNT_NAV_LINKS.map((link) => {
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
    <div className="flex min-h-screen flex-col bg-kwik-bg-page" data-account-layout>
      {/* ─── Minimal top bar ─── */}
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

            {/* Back-to-shop link (logo + name) */}
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

      {/* ─── Body: sidebar (desktop) + main content ─── */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 flex max-h-[calc(100vh-4rem)] flex-col overflow-y-auto border-r border-kwik-border bg-background p-4">
            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
              Account
            </p>
            <NavLinks
              pathname={pathname}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* ─── Mobile drawer ─── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] lg:hidden"
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <motion.div
              id="account-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Account navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-kwik-border bg-background shadow-2xl lg:hidden"
            >
              {/* Drawer header */}
              <div className="flex h-16 items-center justify-between border-b border-kwik-border px-4">
                <Link
                  href="/"
                  onClick={closeDrawer}
                  className="flex items-center gap-2"
                  aria-label="Back to Kwikseller shop"
                >
                  <Image
                    src="/icon.png"
                    alt="Kwikseller logo"
                    width={24}
                    height={24}
                    className="rounded-md"
                  />
                  <span className="text-base font-bold text-kwik-dark">Kwikseller</span>
                </Link>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close account menu"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-kwik-muted transition-colors hover:bg-kwik-bg-surface hover:text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer user chip */}
              <div className="border-b border-kwik-border px-4 py-4">
                <UserChip clickable={false} />
              </div>

              {/* Drawer nav */}
              <div className="flex-1 p-4">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
                  Account
                </p>
                <NavLinks
                  pathname={pathname}
                  cartCount={cartCount}
                  wishlistCount={wishlistCount}
                  onNavigate={closeDrawer}
                />

                <div className="my-4 h-px bg-kwik-border-light" />

                <Link
                  href="/"
                  onClick={closeDrawer}
                  className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-kwik-muted transition-colors hover:bg-kwik-bg-surface hover:text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange"
                >
                  <ArrowLeft className="h-5 w-5 text-kwik-gray-light" />
                  <span>Back to Shop</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    handleLogout();
                  }}
                  className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-kwik-red transition-colors hover:bg-kwik-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-red"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
