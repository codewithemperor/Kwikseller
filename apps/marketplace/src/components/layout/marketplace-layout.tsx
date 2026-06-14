"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Droplets,
  Grid3X3,
  Heart,
  Info,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Separator } from "@heroui/react";
import { OfflineBanner } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartDrawer } from "@/components/landing/cart-drawer";
import { ComparePanel } from "@/components/landing/compare-panel";
import { EnhancedFooter } from "@/components/landing/enhanced-footer";
import { EnhancedSearchOverlay } from "@/components/landing/enhanced-search-overlay";
import { MegaNav } from "@/components/landing/mega-menu";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { SearchAutoSuggest } from "@/components/landing/search-auto-suggest";
import { PageLoader } from "@/components/landing/page-loader";
import { PriceDropAlert } from "@/components/landing/price-drop-alert";
import { NotificationToastStack } from "@/components/landing/notification-toast";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { OrderTrackingWidget } from "@/components/landing/order-tracking-widget";
import { WishlistSidebar } from "@/components/landing/wishlist-sidebar";
import { MarketplaceShellProvider } from "@/components/layout/marketplace-shell-context";
import { useCartStore, useWishlistStore } from "@/stores";
import { AppImage } from "@/components/ui/app-image";

function MobileDrawerContent({
  onClose,
  isAuthenticated,
  user,
  isAuthLoading,
  handleLogout,
  router,
  onNavigateStart,
}: {
  onClose: () => void;
  isAuthenticated: boolean;
  user: any;
  isAuthLoading: boolean;
  handleLogout: () => void;
  router: ReturnType<typeof useRouter>;
  onNavigateStart?: () => void;
}) {
  const pathname = usePathname();

  const pageLinks = [
    { label: "Marketplace", href: "/", icon: Store },
    { label: "Categories", href: "/categories", icon: Grid3X3 },
    { label: "About", href: "/about", icon: Info },
    { label: "Pricing", href: "/pricing", icon: CreditCard },
    { label: "Vendors", href: "/vendors", icon: Users },
    { label: "Pool Selling", href: "/pool", icon: Droplets },
  ];

  const handleNavClick = (href: string) => {
    onClose();
    onNavigateStart?.();
    router.push(href);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="KWIKSELLER"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-bold">KWIKSELLER</span>
        </div>
        <Button
          isIconOnly
          variant="ghost"
          onPress={onClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="mb-4 flex flex-col gap-1">
        {pageLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <button
              key={link.href}
              type="button"
              onClick={() => handleNavClick(link.href)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-medium transition-colors ${
                isActive
                  ? "bg-kwik-orange-tint text-kwik-orange"
                  : "text-kwik-gray hover:bg-kwik-bg-surface hover:text-kwik-dark"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </button>
          );
        })}
      </nav>

      <Separator className="mb-4" />

      <div className="mt-auto flex flex-col gap-3">
        {isAuthLoading ? null : isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-kwik-bg-surface px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kwik-orange font-semibold text-white">
                {(user.profile?.firstName || user.email.split("@")[0])
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {user.profile?.firstName || user.email.split("@")[0]}
                </div>
                <div className="text-xs text-kwik-gray-light">{user.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onPress={() => {
                handleLogout();
                onClose();
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="w-full"
              onPress={() => {
                onNavigateStart?.();
                router.push("/login");
                onClose();
              }}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              className="w-full bg-kwik-orange text-white"
              onPress={() => {
                onNavigateStart?.();
                router.push("/register");
                onClose();
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [isClientMounted, setIsClientMounted] = useState(false);

  const isSearchPage = pathname === "/search";
  const isCartPage = pathname === "/cart";
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  const isVendorStorefrontRoute = pathname.startsWith("/vendor/");
  const hideTopNav = isCartPage || isAuthPage || isVendorStorefrontRoute;
  const searchQuery = searchParams.get("q") || "";
  const startNavigationLoading = useCallback(() => {
    isPageLoadingRef.current = true;
    setIsPageLoading(true);
  }, []);

  useEffect(() => {
    setIsClientMounted(true);
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

  useEffect(() => {
    isPageLoadingRef.current = true;
    setIsPageLoading(true);
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

  // Reset filters when leaving search page
  useEffect(() => {
    if (!isSearchPage) setShowFilters(false);
  }, [isSearchPage]);

  const cartItemCount = useCartStore((s) =>
    s.items.length,
  );
  const [prevCartCount, setPrevCartCount] = useState(cartItemCount);
  const [badgeKey, setBadgeKey] = useState(0);

  // Animate badge when cart count changes
  useEffect(() => {
    if (cartItemCount !== prevCartCount) {
      setBadgeKey((k) => k + 1);
      setPrevCartCount(cartItemCount);
    }
  }, [cartItemCount, prevCartCount]);
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
      <div className="flex min-h-screen flex-col bg-white dark:bg-[#07111f]">
        {!isVendorStorefrontRoute && <PageLoader isLoading={isPageLoading} />}
        <OfflineBanner />
        {!isSearchPage && !isVendorStorefrontRoute && (
          <EnhancedSearchOverlay
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        )}

        {!hideTopNav && (
          <>
            <header
              className={`fixed inset-x-0 top-0 z-[80] bg-background/95 backdrop-blur-md transition-shadow duration-300 dark:bg-[#07111f]/95 ${
                isScrolled
                  ? "shadow-md border-b border-kwik-orange/10"
                  : "border-b border-kwik-border"
              }`}
            >
              <div className="container mx-auto px-0 md:px-4">
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

                    {/* Logo */}
                    <button
                      type="button"
                      onClick={() => {
                        startNavigationLoading();
                        router.push("/");
                      }}
                      className="flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-80 md:gap-2"
                    >
                      <div className="y-2">
                        <Image
                          src="/icon.png"
                          alt="KWIKSELLER"
                          width={20}
                          height={20}
                          className="rounded-md md:rounded-lg md:h-8! md:w-8!"
                        />
                      </div>
                      <span className="truncate text-lg font-bold text-kwik-dark md:text-xl">
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

                    <ThemeToggle />

                    <div className="hidden items-center gap-3 md:flex">
                      {!isClientMounted || isAuthLoading ? null : isAuthenticated && user ? (
                        <>
                          <span className="hidden items-center gap-2 text-sm text-kwik-gray lg:inline-flex">
                            <User className="h-4 w-4" />
                            {user.profile?.firstName || user.email.split("@")[0]}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={handleLogout}
                            className="text-kwik-gray"
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => {
                              startNavigationLoading();
                              router.push("/login");
                            }}
                          >
                            Sign In
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onPress={() => {
                              startNavigationLoading();
                              router.push("/register");
                            }}
                            className="bg-kwik-orange text-white"
                          >
                            Get Started
                          </Button>
                        </>
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
            <div aria-hidden className="h-[112px] shrink-0 md:h-16" />
          </>
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
                <MobileDrawerContent
                  onClose={closeDrawer}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  isAuthLoading={isAuthLoading}
                  handleLogout={handleLogout}
                  router={router}
                  onNavigateStart={startNavigationLoading}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className={isVendorStorefrontRoute ? "flex-1" : "flex-1 pb-20 md:pb-0"}>
          {!isVendorStorefrontRoute && <PriceDropAlert />}
          {!isVendorStorefrontRoute && <NotificationToastStack />}
          {children}
        </main>

        {!isVendorStorefrontRoute && <ScrollProgress />}
        {!isVendorStorefrontRoute && <OrderTrackingWidget />}
        {!isVendorStorefrontRoute && <CartDrawer />}
        {!isVendorStorefrontRoute && <ComparePanel />}
        {!isVendorStorefrontRoute && (
          <WishlistSidebar
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
          />
        )}
        {!isVendorStorefrontRoute && <MobileBottomNav onNavigateStart={startNavigationLoading} />}
        {!isVendorStorefrontRoute && <EnhancedFooter />}
      </div>
    </MarketplaceShellProvider>
  );
}
