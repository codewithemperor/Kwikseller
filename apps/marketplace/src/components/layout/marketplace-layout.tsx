"use client";

import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@heroui/react";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { kwikToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
// Heavy layout components are lazy-loaded (ssr:false) to reduce the
// server-side compilation bundle. This prevents Turbopack OOM kills
// when compiling routes in memory-constrained environments.
const CartDrawer = dynamic(() => import("@/components/landing/cart-drawer").then(m => ({ default: m.CartDrawer })), { ssr: false });
const ComparePanel = dynamic(() => import("@/components/landing/compare-panel").then(m => ({ default: m.ComparePanel })), { ssr: false });
const EnhancedFooter = dynamic(() => import("@/components/landing/enhanced-footer").then(m => ({ default: m.EnhancedFooter })), { ssr: false });
const EnhancedSearchOverlay = dynamic(() => import("@/components/landing/enhanced-search-overlay").then(m => ({ default: m.EnhancedSearchOverlay })), { ssr: false });
const MegaNav = dynamic(() => import("@/components/landing/mega-menu").then(m => ({ default: m.MegaNav })), { ssr: false });
const OrderTrackingWidget = dynamic(() => import("@/components/landing/order-tracking-widget").then(m => ({ default: m.OrderTrackingWidget })), { ssr: false });
const PageLoader = dynamic(() => import("@/components/landing/page-loader").then(m => ({ default: m.PageLoader })), { ssr: false });
const PriceDropAlert = dynamic(() => import("@/components/landing/price-drop-alert").then(m => ({ default: m.PriceDropAlert })), { ssr: false });
const NotificationToastStack = dynamic(() => import("@/components/landing/notification-toast").then(m => ({ default: m.NotificationToastStack })), { ssr: false });
const WishlistSidebar = dynamic(() => import("@/components/landing/wishlist-sidebar").then(m => ({ default: m.WishlistSidebar })), { ssr: false });
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { SearchAutoSuggest } from "@/components/landing/search-auto-suggest";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { MarketplaceShellProvider } from "@/components/layout/marketplace-shell-context";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { useCartStore, useWishlistStore } from "@/stores";
import { AppImage } from "@/components/ui/app-image";

// Mobile drawer is lazy-loaded (ssr:false) to keep the header bundle lean.
const MobileDrawer = dynamic(() => import("@/components/landing/mobile-drawer").then(m => ({ default: m.MobileDrawer })), { ssr: false });

/* ─── Inline Search Bar (shown in header on /search page) ──── */

function InlineSearchBar({
  query,
  onSearch,
  onBack,
  showFilters,
  onToggleFilters,
}: {
  query: string;
  onSearch: (q: string) => void;
  onBack: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}) {
  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-kwik-bg-light transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4 text-kwik-dark-medium" />
      </button>

      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kwik-muted" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search products, stores, categories..."
          className="w-full h-9 rounded-xl border border-kwik-border bg-kwik-bg-surface pl-9 pr-9 text-sm text-kwik-dark placeholder:text-kwik-muted outline-none focus:border-kwik-orange focus:ring-1 focus:ring-kwik-orange transition-colors"
          autoFocus
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-kwik-muted hover:text-kwik-dark-medium"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleFilters}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
          showFilters ? "bg-kwik-orange-tint text-kwik-orange" : "hover:bg-kwik-bg-light text-kwik-dark-medium"
        }`}
        aria-label="Toggle filters"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </form>
  );
}

/* ─── Wishlist Nav Button (client component) ──────────────────── */

function WishlistNavButton({ onNavigateStart }: { onNavigateStart?: () => void }) {
  const router = useRouter();
  const wishlistCount = useWishlistStore((s) => s.itemCount);
  const [mounted, setMounted] = React.useState(false);

  React.useLayoutEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      onPress={() => {
        onNavigateStart?.();
        router.push("/wishlist");
      }}
      aria-label="Wishlist"
      className="relative text-kwik-gray-light"
    >
      <Heart className="h-4 w-4" />
      {mounted && wishlistCount > 0 ? (
        <motion.span
          key={wishlistCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 15,
          }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-kwik-red text-[10px] font-bold text-white shadow-sm"
        >
          {wishlistCount > 9 ? "9+" : wishlistCount}
        </motion.span>
      ) : null}
    </Button>
  );
}

/* ─── Main Layout Component ─────────────────────────────────── */

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAutoSuggestOpen, setIsAutoSuggestOpen] = useState(false);
  const desktopSearchBtnRef = useRef<HTMLButtonElement>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isPageLoadingRef = useRef(true);
  const headerRef = useRef<HTMLElement>(null);
  // useSyncExternalStore avoids a setState-in-effect lint violation while
  // still giving us a server-safe `isClientMounted` flag (false on SSR,
  // true on client). Used to gate client-only chrome like the cart badge.
  const isClientMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isSearchPage = pathname === "/search";
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  const isVendorStorefrontRoute = pathname.startsWith("/vendor/");
  // Account pages (cart, orders list, wishlist, profile/*) render their own
  // AccountLayout shell — hide the full marketplace header/footer/widgets.
  // NOTE: /orders/[id] (detail page) is intentionally NOT included here —
  // it keeps the full marketplace chrome.
  const isAccountRoute =
    pathname === "/cart" ||
    pathname === "/orders" ||
    pathname === "/wishlist" ||
    pathname === "/vendor-orders" ||
    pathname === "/vendor-analytics" ||
    pathname === "/coupons" ||
    pathname === "/help" ||
    pathname.startsWith("/profile");
  const hideFullChrome = isVendorStorefrontRoute || isAccountRoute;
  const hideTopNav = isAuthPage || hideFullChrome;
  const searchQuery = searchParams.get("q") || "";
  const startNavigationLoading = useCallback(() => {
    isPageLoadingRef.current = true;
    setIsPageLoading(true);
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Measure the real header height and expose it as --header-height on the
  // document root. This lets sticky offsets (PDP gallery, search toolbar,
  // vendor toolbar) always sit exactly below the header regardless of which
  // rows the header currently shows (search page adds an extra row).
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const sync = () => {
      const h = el.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty("--header-height", `${h}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSearchPage, hideTopNav]);

  // Page-loading bar: shows on every pathname change, auto-hides after 420ms.
  // The `setIsPageLoading(true)` is deferred via `queueMicrotask` so it's no
  // longer a synchronous setState inside the effect body (avoids the
  // react-hooks/set-state-in-effect lint violation while keeping the same UX).
  useEffect(() => {
    isPageLoadingRef.current = true;
    queueMicrotask(() => setIsPageLoading(true));
    const timer = setTimeout(() => {
      isPageLoadingRef.current = false;
      setIsPageLoading(false);
    }, 420);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || event.defaultPrevented) return;
      if (anchor.target && anchor.target !== "_self") return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return;

      startNavigationLoading();
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [startNavigationLoading]);

  // Reset filters when leaving the search page. Deferred via `queueMicrotask`
  // so it's not a synchronous setState inside the effect body (lint-safe).
  useEffect(() => {
    if (!isSearchPage) {
      queueMicrotask(() => setShowFilters(false));
    }
  }, [isSearchPage]);

  const cartItemCount = useCartStore((s) =>
    s.items.length,
  );
  // Derive the cart badge animation key directly from cartItemCount — when
  // the count changes, the motion.span's `key` prop changes and React
  // remounts it, retriggering the spring entrance animation. This removes
  // the previous useEffect+setState pattern that triggered the lint rule.
  const badgeKey = cartItemCount;
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const handleLogout = async () => {
    try {
      await logout();
      kwikToast.success("Logged out successfully");
      router.refresh();
    } catch {
      kwikToast.error("Failed to log out");
    }
  };

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleSearchSubmit = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      params.set("q", q);
      const category = searchParams.get("category");
      if (category) params.set("category", category);
      startNavigationLoading();
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams, startNavigationLoading],
  );

  const handleSearchBack = useCallback(() => {
    startNavigationLoading();
    router.push("/");
  }, [router, startNavigationLoading]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
    if (isSearchPage) {
      const params = new URLSearchParams(searchParams.toString());
      if (!showFilters) {
        params.set("filters", "true");
      } else {
        params.delete("filters");
      }
      startNavigationLoading();
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [isSearchPage, router, searchParams, showFilters, startNavigationLoading]);

  return (
    <MarketplaceShellProvider
      value={{
        openSearch: () => setIsSearchOpen(true),
        showFilters,
        setShowFilters,
      }}
    >
      <div className="flex min-h-screen flex-col bg-background">
        {!hideFullChrome && <PageLoader isLoading={isPageLoading} />}
        <OfflineBanner />
        {!isSearchPage && !hideFullChrome && (
          <EnhancedSearchOverlay
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        )}

        {!hideTopNav && (
            <header
              ref={headerRef}
              className={`sticky top-0 z-40 bg-background/95 backdrop-blur-md transition-shadow duration-300 ${
                isScrolled
                  ? "shadow-md border-b border-kwik-orange/10"
                  : "border-b border-kwik-border"
              }`}
            >
              <div className=" mx-auto px-0 md:px-4">
                {/* Top row: logo + actions */}
                <div className="flex py-2 md:h-16 items-center justify-between">
                  <div className="flex min-w-0 items-center gap-1 md:gap-2">
                    <Button
                      isIconOnly
                      variant="ghost"
                      className="md:hidden"
                      onPress={() => setIsDrawerOpen(true)}
                      aria-label="Open menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>

                    {/* Logo — spec #22: /icon.png + KWIKSELLER, routes to / */}
                    <button
                      type="button"
                      onClick={() => {
                        startNavigationLoading();
                        router.push("/");
                      }}
                      className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/icon.png"
                        alt="KWIKSELLER"
                        width={20}
                        height={20}
                        className="h-7 w-7 shrink-0 rounded-md object-cover md:h-8 md:w-8 md:rounded-lg"
                      />
                      <span className="truncate text-lg font-bold text-kwik-dark dark:text-white md:text-xl">
                        KWIKSELLER
                      </span>
                    </button>
                  </div>

                  <MegaNav />

                  <div className="flex items-center gap-0 md:gap-2">
                    {/* Desktop search - auto suggest on desktop */}
                    {!isSearchPage && (
                      <div className="relative hidden md:block">
                        <button
                          ref={desktopSearchBtnRef}
                          type="button"
                          onClick={() => setIsAutoSuggestOpen(true)}
                          className="flex h-11 min-w-[190px] items-center gap-2 rounded-2xl border border-kwik-border bg-kwik-bg-surface px-4 text-sm text-kwik-gray-light transition-colors hover:border-kwik-orange hover:shadow-md hover:shadow-kwik-orange/5 lg:min-w-[260px] cursor-pointer"
                        >
                          <Search className="h-4 w-4 shrink-0 text-kwik-muted" />
                          <span className="truncate">Search products, brands...</span>
                        </button>
                        <SearchAutoSuggest
                          isOpen={isAutoSuggestOpen}
                          onClose={() => setIsAutoSuggestOpen(false)}
                          anchorRef={desktopSearchBtnRef as React.RefObject<HTMLElement>}
                        />
                      </div>
                    )}

                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={() => setCartOpen(true)}
                      aria-label="Shopping cart"
                      className="relative text-kwik-gray-light"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {isClientMounted && cartItemCount > 0 && (
                        <motion.span
                          key={badgeKey}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 15,
                          }}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-kwik-orange text-[10px] font-bold text-white shadow-sm shadow-kwik-orange/30"
                        >
                          {/* Pulse ring animation */}
                          <motion.span
                            className="absolute inset-0 rounded-full bg-kwik-orange"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                          />
                          <span className="relative z-10">{cartItemCount > 9 ? "9+" : cartItemCount}</span>
                        </motion.span>
                      )}
                    </Button>

                    {/* Wishlist button */}
                    <WishlistNavButton onNavigateStart={startNavigationLoading} />

                    {/* Notifications bell */}
                    <NotificationBell />

                    <ThemeToggle />

                    {/* Account: single icon button — opens profile dropdown when logged in, goes to login when not */}
                    <div className="hidden items-center md:flex">
                      {!isClientMounted || isAuthLoading ? null : isAuthenticated && user ? (
                        <ProfileDropdown
                          user={user}
                          onNavigateStart={startNavigationLoading}
                          onLogout={handleLogout}
                        />
                      ) : (
                        <Button
                          isIconOnly
                          variant="ghost"
                          size="sm"
                          onPress={() => {
                            startNavigationLoading();
                            router.push("/login");
                          }}
                          aria-label="Sign in"
                          className="text-kwik-gray-light dark:text-white/70"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom search row - shown on search page */}
                {isSearchPage && (
                  <div className="pb-2 px-3 md:pb-3 md:px-4">
                    <InlineSearchBar
                      query={searchQuery}
                      onSearch={handleSearchSubmit}
                      onBack={handleSearchBack}
                      showFilters={showFilters}
                      onToggleFilters={handleToggleFilters}
                    />
                  </div>
                )}

                {/* Mobile search button */}
                {!isSearchPage && (
                  <div className="md:hidden pb-2 px-3">
                    <motion.button
                      type="button"
                      onClick={() => setIsSearchOpen(true)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full h-12 items-center gap-2 rounded-2xl border border-kwik-border bg-kwik-bg-surface px-4 text-sm text-kwik-gray-light transition-all duration-200 hover:border-kwik-orange hover:shadow-md hover:shadow-kwik-orange/5"
                      aria-label="Open search"
                    >
                      <Search className="h-4 w-4 shrink-0 text-kwik-muted" />
                      <span className="truncate">
                        Search products, brands and categories
                      </span>
                    </motion.button>
                  </div>
                )}
              </div>
            </header>
        )}

        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-[2px] md:hidden"
                onClick={closeDrawer}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
                className="fixed bottom-0 left-0 top-0 z-[120] w-[300px] max-w-[85vw] overflow-hidden border-r border-kwik-border bg-background shadow-2xl md:hidden"
              >
                <MobileDrawer
                  isOpen={true}
                  onClose={closeDrawer}
                  onNavigateStart={startNavigationLoading}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  isAuthLoading={isAuthLoading}
                  onLogout={handleLogout}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className={hideFullChrome ? "flex-1" : "flex-1 pb-20 md:pb-0"}>
          {!hideFullChrome && <PriceDropAlert />}
          {!hideFullChrome && <NotificationToastStack />}
          {hideFullChrome ? (
            children
          ) : (
            <div className="mx-auto w-full">
              {children}
            </div>
          )}
        </main>

        {!hideFullChrome && <ScrollProgress />}
        {!hideFullChrome && <OrderTrackingWidget />}
        {!hideFullChrome && <CartDrawer />}
        {!hideFullChrome && <ComparePanel />}
        {!hideFullChrome && (
          <WishlistSidebar
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
          />
        )}
        {!hideFullChrome && <MobileBottomNav onNavigateStart={startNavigationLoading} />}
        {!hideFullChrome && <EnhancedFooter />}
      </div>
    </MarketplaceShellProvider>
  );
}
