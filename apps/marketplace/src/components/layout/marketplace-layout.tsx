"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Droplets,
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
import { marketplaceCategories } from "@/data/marketplace-home";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartDrawer } from "@/components/landing/cart-drawer";
import { CookieConsentBanner } from "@/components/landing/cookie-consent-banner";
import { EnhancedFooter } from "@/components/landing/enhanced-footer";
import { EnhancedSearchOverlay } from "@/components/landing/enhanced-search-overlay";
import { MegaNav } from "@/components/landing/mega-menu";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { PageLoader } from "@/components/landing/page-loader";
import { WishlistSidebar } from "@/components/landing/wishlist-sidebar";
import { MarketplaceShellProvider } from "@/components/layout/marketplace-shell-context";
import { useCartStore } from "@/stores";

function MobileDrawerContent({
  onClose,
  isAuthenticated,
  user,
  isAuthLoading,
  handleLogout,
  router,
}: {
  onClose: () => void;
  isAuthenticated: boolean;
  user: any;
  isAuthLoading: boolean;
  handleLogout: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const pathname = usePathname();

  const pageLinks = [
    { label: "Marketplace", href: "/", icon: Store },
    { label: "About", href: "/about", icon: Info },
    { label: "Pricing", href: "/pricing", icon: CreditCard },
    { label: "Vendors", href: "/vendors", icon: Users },
    { label: "Pool Selling", href: "/pool", icon: Droplets },
  ];

  const handleNavClick = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="flex h-full flex-col px-6 py-6">
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

      <div className="mb-4 rounded-2xl bg-kwik-bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-kwik-orange">
          Shop categories
        </p>
        <div className="grid grid-cols-1 gap-1">
          {marketplaceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleNavClick(`/categories?${category.id}`)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-kwik-gray transition-colors hover:bg-background hover:text-kwik-dark"
              >
                <Icon className="h-4 w-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

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

/* ─── Main Layout Component ─────────────────────────────────── */

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isPageLoadingRef = useRef(true);

  const isSearchPage = pathname === "/search";
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    isPageLoadingRef.current = true;
    const timer = setTimeout(() => {
      isPageLoadingRef.current = false;
      setIsPageLoading(false);
    }, 220);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Reset filters when leaving search page
  useEffect(() => {
    if (!isSearchPage) setShowFilters(false);
  }, [isSearchPage]);

  const cartItemCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );
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
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearchBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
    // Also update URL so search page can read it
    if (isSearchPage) {
      const params = new URLSearchParams(searchParams.toString());
      if (!showFilters) {
        params.set("filters", "true");
      } else {
        params.delete("filters");
      }
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [isSearchPage, router, searchParams, showFilters]);

  return (
    <MarketplaceShellProvider
      value={{
        openSearch: () => setIsSearchOpen(true),
        showFilters,
        setShowFilters,
      }}
    >
      <div className="flex min-h-screen flex-col bg-kwik-bg-page">
        <PageLoader isLoading={isPageLoading} />
        <OfflineBanner />
        {!isSearchPage && (
          <EnhancedSearchOverlay
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        )}

        <header
          className={`sticky top-0 z-40 border-b border-kwik-border bg-background/95 backdrop-blur-md ${
            isScrolled ? "shadow-sm" : ""
          }`}
        >
          <div className="container mx-auto px-0 md:px-4">
            {/* Top row: logo + actions */}
            <div className="flex py-2 md:h-16 items-center justify-between">
              <Button
                isIconOnly
                variant="ghost"
                className="md:hidden"
                onPress={() => setIsDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Logo - always shown */}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 md:gap-2 transition-opacity hover:opacity-80"
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
                <span className="text-xl md:text-xl font-bold text-kwik-dark">
                  KWIKSELLER
                </span>
              </button>

              <MegaNav />

              <div className="flex items-center gap-0 md:gap-2">
                {/* Desktop search - hidden on mobile, hidden on search page */}
                {!isSearchPage && (
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="hidden h-11 min-w-[190px] items-center gap-2 rounded-2xl border border-kwik-border bg-kwik-bg-surface px-4 text-sm text-kwik-gray-light transition-colors hover:border-kwik-orange md:inline-flex lg:min-w-[260px]"
                  >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="truncate">Search for...</span>
                  </button>
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
                  {cartItemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-kwik-orange text-[10px] font-bold text-white">
                      {cartItemCount > 9 ? "9+" : cartItemCount}
                    </span>
                  )}
                </Button>

                <ThemeToggle />

                <div className="hidden items-center gap-3 md:flex">
                  {isAuthLoading ? null : isAuthenticated && user ? (
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
                        onPress={() => router.push("/login")}
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => router.push("/register")}
                        className="bg-kwik-orange text-white"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom search row - shown on search page for both mobile and desktop */}
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

            {/* Mobile search button - only when NOT on search page */}
            {!isSearchPage && (
              <div className="md:hidden pb-2 px-3">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex w-full h-12 items-center gap-2 rounded-2xl border border-kwik-border bg-kwik-bg-surface px-4 text-sm text-kwik-gray-light transition-colors hover:border-kwik-orange"
                  aria-label="Open search"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    Search products, brands and categories
                  </span>
                </button>
              </div>
            )}
          </div>
        </header>

        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50 md:hidden"
                onClick={closeDrawer}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
                className="fixed bottom-0 right-0 top-0 z-50 w-[300px] max-w-[85vw] border-l border-kwik-border bg-background shadow-2xl md:hidden"
              >
                <MobileDrawerContent
                  onClose={closeDrawer}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  isAuthLoading={isAuthLoading}
                  handleLogout={handleLogout}
                  router={router}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Temporarily disabled to keep the marketplace shell focused. */}
        {/* <RecentlyViewed /> */}
        {/* <AppPromoBanner /> */}
        <CartDrawer />
        <WishlistSidebar
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
        />
        {/* <UserPreferences /> */}
        {/* <OrderTrackingWidget /> */}
        {/* <ComparePanel /> */}
        {/* <FloatingButtons /> */}
        {/* <LiveActivityFeed /> */}
        <MobileBottomNav onSearchOpen={() => setIsSearchOpen(true)} />
        {/* <CookieConsentBanner /> */}
        <EnhancedFooter />
      </div>
    </MarketplaceShellProvider>
  );
}
