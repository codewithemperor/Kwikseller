"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  CreditCard,
  Droplets,
  Info,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
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
                  ? "bg-[#fff7ed] text-[#ea580c]"
                  : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="mb-4 rounded-2xl bg-[#f9fafb] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#ea580c]">
          Shop categories
        </p>
        <div className="grid grid-cols-1 gap-1">
          {marketplaceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleNavClick(`/#${category.id}`)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[#4b5563] transition-colors hover:bg-white hover:text-[#111827]"
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
            <div className="flex items-center gap-3 rounded-xl bg-[#f9fafb] px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ea580c] font-semibold text-white">
                {(user.profile?.firstName || user.email.split("@")[0])
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {user.profile?.firstName || user.email.split("@")[0]}
                </div>
                <div className="text-xs text-[#6b7280]">{user.email}</div>
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
              className="w-full bg-[#ea580c] text-white"
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

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const isPageLoadingRef = useRef(true);

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

  return (
    <MarketplaceShellProvider
      value={{ openSearch: () => setIsSearchOpen(true) }}
    >
      <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
        <PageLoader isLoading={isPageLoading} />
        <OfflineBanner />
        <EnhancedSearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        <header
          className={`sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/95 backdrop-blur-md ${
            isScrolled ? "shadow-sm" : ""
          }`}
        >
          <div className="container mx-auto px-0 md:px-4 ">
            <div className="flex h-16 items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                <Image
                  src="/icon.png"
                  alt="KWIKSELLER"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-[#111827]">
                  KWIKSELLER
                </span>
              </button>

              <MegaNav />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="hidden h-11 min-w-[190px] items-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 text-sm text-[#6b7280] transition-colors hover:border-[#ea580c] md:inline-flex lg:min-w-[260px]"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">Search for...</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex h-10 max-w-[150px] items-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-3 text-sm text-[#6b7280] transition-colors hover:border-[#ea580c] md:hidden"
                  aria-label="Open search"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">Search for...</span>
                </button>

                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  onPress={() => setCartOpen(true)}
                  aria-label="Shopping cart"
                  className="relative text-[#6b7280]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ea580c] text-[10px] font-bold text-white">
                      {cartItemCount > 9 ? "9+" : cartItemCount}
                    </span>
                  )}
                </Button>

                <ThemeToggle />

                <div className="hidden items-center gap-3 md:flex">
                  {isAuthLoading ? null : isAuthenticated && user ? (
                    <>
                      <span className="hidden items-center gap-2 text-sm text-[#4b5563] lg:inline-flex">
                        <User className="h-4 w-4" />
                        {user.profile?.firstName || user.email.split("@")[0]}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={handleLogout}
                        className="text-[#4b5563]"
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
                        className="bg-[#ea580c] text-white"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  isIconOnly
                  variant="ghost"
                  className="md:hidden"
                  onPress={() => setIsDrawerOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
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
                className="fixed bottom-0 right-0 top-0 z-50 w-[300px] max-w-[85vw] border-l border-[#e5e7eb] bg-white shadow-2xl md:hidden"
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
