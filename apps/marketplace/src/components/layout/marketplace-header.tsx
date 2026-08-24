"use client";

import { useRef, useState, type RefObject } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchAutoSuggest } from "@/components/landing/search-auto-suggest";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import type { UserStore } from "@/stores/auth-store";
import { InlineSearchBar } from "./inline-search-bar";
import { WishlistNavButton } from "./wishlist-nav-button";

const MegaNav = dynamic(
  () => import("@/components/landing/mega-menu").then((module) => ({ default: module.MegaNav })),
  { ssr: false },
);

interface MarketplaceHeaderProps {
  headerRef: RefObject<HTMLElement | null>;
  isScrolled: boolean;
  isSearchPage: boolean;
  searchQuery: string;
  showFilters: boolean;
  cartItemCount: number;
  cartBadgeKey: number;
  isClientMounted: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: UserStore | null;
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onSearchSubmit: (query: string) => void;
  onSearchBack: () => void;
  onToggleFilters: () => void;
  onNavigateStart: () => void;
  onLogout: () => Promise<void>;
}

export function MarketplaceHeader({
  headerRef,
  isScrolled,
  isSearchPage,
  searchQuery,
  showFilters,
  cartItemCount,
  cartBadgeKey,
  isClientMounted,
  isAuthenticated,
  isAuthLoading,
  user,
  onOpenDrawer,
  onOpenSearch,
  onOpenCart,
  onSearchSubmit,
  onSearchBack,
  onToggleFilters,
  onNavigateStart,
  onLogout,
}: MarketplaceHeaderProps) {
  const router = useRouter();
  const desktopSearchBtnRef = useRef<HTMLButtonElement>(null);
  const [isAutoSuggestOpen, setIsAutoSuggestOpen] = useState(false);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 bg-background/95 backdrop-blur-md transition-shadow duration-300 ${
        isScrolled ? "border-b border-kwik-orange/10 shadow-md" : "border-b border-kwik-border"
      }`}
    >
      <div className="mx-auto px-0 md:px-4">
        <div className="flex items-center justify-between py-2 md:h-16">
          <div className="flex min-w-0 items-center gap-1 md:gap-2">
            <Button
              isIconOnly
              variant="ghost"
              className="md:hidden"
              onPress={onOpenDrawer}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <button
              type="button"
              onClick={() => {
                onNavigateStart();
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
            {!isSearchPage ? (
              <div className="relative hidden md:block">
                <button
                  ref={desktopSearchBtnRef}
                  type="button"
                  onClick={() => setIsAutoSuggestOpen(true)}
                  className="flex h-11 min-w-[190px] cursor-pointer items-center gap-2 rounded-2xl border border-kwik-border bg-kwik-bg-surface px-4 text-sm text-kwik-gray-light transition-colors hover:border-kwik-orange hover:shadow-md hover:shadow-kwik-orange/5 lg:min-w-[260px]"
                >
                  <Search className="h-4 w-4 shrink-0 text-kwik-muted" />
                  <span className="truncate">Search products, brands...</span>
                </button>
                <SearchAutoSuggest
                  isOpen={isAutoSuggestOpen}
                  onClose={() => setIsAutoSuggestOpen(false)}
                  anchorRef={desktopSearchBtnRef as RefObject<HTMLElement>}
                />
              </div>
            ) : null}

            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onOpenCart}
              aria-label="Shopping cart"
              className="relative text-kwik-gray-light"
            >
              <ShoppingCart className="h-4 w-4" />
              {isClientMounted && cartItemCount > 0 ? (
                <motion.span
                  key={cartBadgeKey}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-kwik-orange text-[10px] font-bold text-white shadow-sm shadow-kwik-orange/30"
                >
                  <motion.span
                    className="absolute inset-0 rounded-full bg-kwik-orange"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <span className="relative z-10">{cartItemCount > 9 ? "9+" : cartItemCount}</span>
                </motion.span>
              ) : null}
            </Button>

            <WishlistNavButton onNavigateStart={onNavigateStart} />
            <NotificationBell />
            <ThemeToggle />

            <div className="hidden items-center md:flex">
              {!isClientMounted || isAuthLoading ? null : isAuthenticated && user ? (
                <ProfileDropdown user={user} onNavigateStart={onNavigateStart} onLogout={onLogout} />
              ) : (
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    onNavigateStart();
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

        {isSearchPage ? (
          <div className="px-3 pb-2 md:px-4 md:pb-3">
            <InlineSearchBar
              query={searchQuery}
              onSearch={onSearchSubmit}
              onBack={onSearchBack}
              showFilters={showFilters}
              onToggleFilters={onToggleFilters}
            />
          </div>
        ) : null}

        {!isSearchPage ? (
          <div className="px-3 pb-2 md:hidden">
            <motion.button
              type="button"
              onClick={onOpenSearch}
              whileTap={{ scale: 0.98 }}
              className="flex h-12 w-full items-center gap-2 rounded-2xl border border-kwik-border bg-kwik-bg-surface px-4 text-sm text-kwik-gray-light transition-all duration-200 hover:border-kwik-orange hover:shadow-md hover:shadow-kwik-orange/5"
              aria-label="Open search"
            >
              <Search className="h-4 w-4 shrink-0 text-kwik-muted" />
              <span className="truncate">Search products, brands and categories</span>
            </motion.button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
