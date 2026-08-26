"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { kwikToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { useCartStore } from "@/stores";

export function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);
}

export function useMarketplaceShellController() {
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

  const isSearchPage = pathname === "/search";
  const isProductListingPage =
    isSearchPage ||
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname.startsWith("/categories/") ||
    pathname === "/deals";
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

  useLockBodyScroll(isDrawerOpen);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return {
    pathname,
    user,
    isAuthenticated,
    isAuthLoading,
    isDrawerOpen,
    isSearchOpen,
    isWishlistOpen,
    isPageLoading,
    isScrolled,
    showFilters,
    headerRef,
    isClientMounted,
    isSearchPage,
    isProductListingPage,
    searchQuery,
    cartItemCount,
    setShowFilters,
    setIsDrawerOpen,
    setIsSearchOpen,
    setIsWishlistOpen,
    setCartOpen,
    closeDrawer,
    startNavigationLoading,
    handleLogout,
    handleSearchSubmit,
    handleSearchBack,
    handleToggleFilters,
  };
}
