"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { useWishlistStore } from "@/stores";
import { MarketplaceShellProvider } from "@/components/layout/marketplace-shell-context";
import {
  MarketplaceFloatingChrome,
  MarketplaceMainWidgets,
  MarketplacePageLoader,
} from "@/components/layout/marketplace-floating-chrome";
import { MarketplaceHeader } from "@/components/layout/marketplace-header";
import { MobileDrawerFrame } from "@/components/layout/marketplace-mobile-drawer";
import { useMarketplaceShellController } from "@/components/layout/marketplace-shell-hooks";
import {
  ACCOUNT_NAV_LINKS,
  AccountNavLinks,
} from "@/components/layout/account-navigation";
import { AccountUserChip } from "@/components/layout/account-user-chip";
import { AccountDrawerContent } from "@/components/drawers/account-nav-drawer";

export function AccountLayout({ children }: { children: ReactNode }) {
  const shell = useMarketplaceShellController();
  const wishlistCount = useWishlistStore((state) => state.itemCount);

  return (
    <MarketplaceShellProvider
      value={{
        openSearch: () => shell.setIsSearchOpen(true),
        showFilters: shell.showFilters,
        setShowFilters: shell.setShowFilters,
      }}
    >
      <div className="flex h-dvh flex-col overflow-hidden bg-[#f6f7f8]" data-account-layout>
        <MarketplacePageLoader isLoading={shell.isPageLoading} />
        <OfflineBanner />

        <MarketplaceHeader
          variant="account"
          drawerLabel="Open account menu"
          drawerButtonClassName="lg:hidden"
          headerRef={shell.headerRef}
          isScrolled={shell.isScrolled}
          isSearchPage={shell.isSearchPage}
          searchQuery={shell.searchQuery}
          showFilters={shell.showFilters}
          cartItemCount={shell.cartItemCount}
          cartBadgeKey={shell.cartItemCount}
          isClientMounted={shell.isClientMounted}
          isAuthenticated={shell.isAuthenticated}
          isAuthLoading={shell.isAuthLoading}
          user={shell.user}
          onOpenDrawer={() => shell.setIsDrawerOpen(true)}
          onOpenSearch={() => shell.setIsSearchOpen(true)}
          onOpenCart={() => shell.setCartOpen(true)}
          onSearchSubmit={shell.handleSearchSubmit}
          onSearchBack={shell.handleSearchBack}
          onToggleFilters={shell.handleToggleFilters}
          onNavigateStart={shell.startNavigationLoading}
          onLogout={shell.handleLogout}
        />

        <MobileDrawerFrame
          isOpen={shell.isDrawerOpen}
          onClose={shell.closeDrawer}
          dialogLabel="Account navigation"
          visibilityClassName="lg:hidden"
        >
          <AccountDrawerContent
            onClose={shell.closeDrawer}
            onLogout={shell.handleLogout}
            pathname={shell.pathname}
            cartCount={shell.cartItemCount}
            wishlistCount={wishlistCount}
            links={ACCOUNT_NAV_LINKS}
            userChip={<AccountUserChip clickable={false} />}
          />
        </MobileDrawerFrame>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="hidden h-full w-64 shrink-0 border-r border-[#e9eaec] bg-white lg:block">
            <div className="flex h-full flex-col overflow-y-auto p-4">
              <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
                Account
              </p>
              <AccountNavLinks
                pathname={shell.pathname}
                cartCount={shell.cartItemCount}
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
                onClick={shell.handleLogout}
                className="mt-1 flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-kwik-red transition-colors hover:bg-kwik-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-red focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <main className="h-full min-w-0 flex-1 overflow-y-auto p-0">
            <MarketplaceMainWidgets />
            {children}
          </main>
        </div>

        <MarketplaceFloatingChrome
          isSearchOverlayOpen={shell.isSearchOpen}
          isWishlistOpen={shell.isWishlistOpen}
          showSearchOverlay={!shell.isSearchPage}
          showFooter={false}
          showMobileBottomNav={false}
          onCloseSearchOverlay={() => shell.setIsSearchOpen(false)}
          onCloseWishlist={() => shell.setIsWishlistOpen(false)}
          onNavigateStart={shell.startNavigationLoading}
        />
      </div>
    </MarketplaceShellProvider>
  );
}
