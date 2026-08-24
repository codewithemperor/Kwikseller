"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { kwikToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { useCartStore } from "@/stores";
import { MarketplaceShellProvider } from "@/components/layout/marketplace-shell-context";
import {
  MarketplaceFloatingChrome,
  MarketplaceMainWidgets,
  MarketplacePageLoader,
} from "@/components/layout/marketplace-floating-chrome";
import { MarketplaceHeader } from "@/components/layout/marketplace-header";
import { MarketplaceMobileDrawer } from "@/components/layout/marketplace-mobile-drawer";
import { getMarketplaceChromeVisibility } from "@/components/layout/marketplace-route-rules";

export function MarketplaceLayout({ children }: { children: ReactNode }) {
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

  const headerRef = useRef<HTMLElement>(null);
  const isClientMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { isAuthPage, isSearchPage, hideFullChrome, hideTopNav } =
    getMarketplaceChromeVisibility(pathname);
  const searchQuery = searchParams.get("q") || "";
  const cartItemCount = useCartStore((state) => state.items.length);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const startNavigationLoading = useCallback(() => {
    setIsPageLoading(true);
  }, []);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      kwikToast.success("Logged out successfully");
      router.refresh();
    } catch {
      kwikToast.error("Failed to log out");
    }
  }, [logout, router]);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      const params = new URLSearchParams();
      params.set("q", query);

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
    setShowFilters((previous) => !previous);

    if (!isSearchPage) return;

    const params = new URLSearchParams(searchParams.toString());
    if (!showFilters) {
      params.set("filters", "true");
    } else {
      params.delete("filters");
    }

    startNavigationLoading();
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [isSearchPage, router, searchParams, showFilters, startNavigationLoading]);

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
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const syncHeaderHeight = () => {
      const height = el.offsetHeight;
      if (height > 0) {
        document.documentElement.style.setProperty("--header-height", `${height}px`);
      }
    };

    syncHeaderHeight();
    const resizeObserver = new ResizeObserver(syncHeaderHeight);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [isSearchPage, hideTopNav]);

  useEffect(() => {
    queueMicrotask(() => setIsPageLoading(true));

    const timer = setTimeout(() => {
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
      if (
        nextUrl.pathname === window.location.pathname &&
        nextUrl.search === window.location.search
      ) {
        return;
      }

      startNavigationLoading();
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [startNavigationLoading]);

  useEffect(() => {
    if (!isSearchPage) {
      queueMicrotask(() => setShowFilters(false));
    }
  }, [isSearchPage]);

  return (
    <MarketplaceShellProvider
      value={{
        openSearch: () => setIsSearchOpen(true),
        showFilters,
        setShowFilters,
      }}
    >
      <div
        className={
          isAuthPage
            ? "flex h-dvh flex-col overflow-hidden bg-background"
            : "flex min-h-screen flex-col bg-background"
        }
      >
        {!hideFullChrome ? <MarketplacePageLoader isLoading={isPageLoading} /> : null}
        <OfflineBanner />

        {!hideTopNav ? (
          <MarketplaceHeader
            headerRef={headerRef}
            isScrolled={isScrolled}
            isSearchPage={isSearchPage}
            searchQuery={searchQuery}
            showFilters={showFilters}
            cartItemCount={cartItemCount}
            cartBadgeKey={cartItemCount}
            isClientMounted={isClientMounted}
            isAuthenticated={isAuthenticated}
            isAuthLoading={isAuthLoading}
            user={user}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenCart={() => setCartOpen(true)}
            onSearchSubmit={handleSearchSubmit}
            onSearchBack={handleSearchBack}
            onToggleFilters={handleToggleFilters}
            onNavigateStart={startNavigationLoading}
            onLogout={handleLogout}
          />
        ) : null}

        <MarketplaceMobileDrawer
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          onNavigateStart={startNavigationLoading}
          isAuthenticated={isAuthenticated}
          user={user}
          isAuthLoading={isAuthLoading}
          onLogout={handleLogout}
        />

        <main
          className={
            isAuthPage
              ? "min-h-0 flex-1 overflow-hidden"
              : hideFullChrome
                ? "flex-1"
                : "flex-1 pb-20 md:pb-0"
          }
        >
          {!hideFullChrome ? <MarketplaceMainWidgets /> : null}
          {hideFullChrome ? children : <div className="mx-auto w-full">{children}</div>}
        </main>

        {!hideFullChrome ? (
          <MarketplaceFloatingChrome
            isSearchOverlayOpen={isSearchOpen}
            isWishlistOpen={isWishlistOpen}
            showSearchOverlay={!isSearchPage}
            onCloseSearchOverlay={() => setIsSearchOpen(false)}
            onCloseWishlist={() => setIsWishlistOpen(false)}
            onNavigateStart={startNavigationLoading}
          />
        ) : null}
      </div>
    </MarketplaceShellProvider>
  );
}
