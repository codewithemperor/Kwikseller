"use client";

import type { ReactNode } from "react";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { MarketplaceShellProvider } from "@/components/layout/marketplace-shell-context";
import {
  MarketplaceFloatingChrome,
  MarketplaceMainWidgets,
  MarketplacePageLoader,
} from "@/components/layout/marketplace-floating-chrome";
import { MarketplaceHeader } from "@/components/layout/marketplace-header";
import { MarketplaceMobileDrawer } from "@/components/layout/marketplace-mobile-drawer";
import { useMarketplaceShellController } from "@/components/layout/marketplace-shell-hooks";

export function MarketplaceLayout({ children }: { children: ReactNode }) {
  const shell = useMarketplaceShellController();

  return (
    <MarketplaceShellProvider
      value={{
        openSearch: () => shell.setIsSearchOpen(true),
        showFilters: shell.showFilters,
        setShowFilters: shell.setShowFilters,
      }}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <MarketplacePageLoader isLoading={shell.isPageLoading} />
        <OfflineBanner />

        <MarketplaceHeader
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

        <MarketplaceMobileDrawer
          isOpen={shell.isDrawerOpen}
          onClose={shell.closeDrawer}
          onNavigateStart={shell.startNavigationLoading}
          isAuthenticated={shell.isAuthenticated}
          user={shell.user}
          isAuthLoading={shell.isAuthLoading}
          onLogout={shell.handleLogout}
        />

        <main className="flex-1 pb-20 md:pb-0">
          <MarketplaceMainWidgets />
          <div className="mx-auto w-full">{children}</div>
        </main>

        <MarketplaceFloatingChrome
          isSearchOverlayOpen={shell.isSearchOpen}
          isWishlistOpen={shell.isWishlistOpen}
          showSearchOverlay={!shell.isSearchPage}
          onCloseSearchOverlay={() => shell.setIsSearchOpen(false)}
          onCloseWishlist={() => shell.setIsWishlistOpen(false)}
          onNavigateStart={shell.startNavigationLoading}
        />
      </div>
    </MarketplaceShellProvider>
  );
}
