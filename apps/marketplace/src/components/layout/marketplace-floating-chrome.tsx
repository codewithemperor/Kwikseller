"use client";

import dynamic from "next/dynamic";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { ScrollProgress } from "@/components/landing/scroll-progress";

const CartDrawer = dynamic(
  () => import("@/components/landing/cart-drawer").then((module) => ({ default: module.CartDrawer })),
  { ssr: false },
);
const ComparePanel = dynamic(
  () => import("@/components/landing/compare-panel").then((module) => ({ default: module.ComparePanel })),
  { ssr: false },
);
const EnhancedFooter = dynamic(
  () =>
    import("@/components/landing/enhanced-footer").then((module) => ({
      default: module.EnhancedFooter,
    })),
  { ssr: false },
);
const EnhancedSearchOverlay = dynamic(
  () =>
    import("@/components/landing/enhanced-search-overlay").then((module) => ({
      default: module.EnhancedSearchOverlay,
    })),
  { ssr: false },
);
const OrderTrackingWidget = dynamic(
  () =>
    import("@/components/landing/order-tracking-widget").then((module) => ({
      default: module.OrderTrackingWidget,
    })),
  { ssr: false },
);
const PageLoader = dynamic(
  () => import("@/components/landing/page-loader").then((module) => ({ default: module.PageLoader })),
  { ssr: false },
);
const PriceDropAlert = dynamic(
  () =>
    import("@/components/landing/price-drop-alert").then((module) => ({
      default: module.PriceDropAlert,
    })),
  { ssr: false },
);
const NotificationToastStack = dynamic(
  () =>
    import("@/components/landing/notification-toast").then((module) => ({
      default: module.NotificationToastStack,
    })),
  { ssr: false },
);
const WishlistSidebar = dynamic(
  () =>
    import("@/components/landing/wishlist-sidebar").then((module) => ({
      default: module.WishlistSidebar,
    })),
  { ssr: false },
);

interface MarketplaceFloatingChromeProps {
  isSearchOverlayOpen: boolean;
  isWishlistOpen: boolean;
  showSearchOverlay: boolean;
  onCloseSearchOverlay: () => void;
  onCloseWishlist: () => void;
  onNavigateStart: () => void;
}

export function MarketplacePageLoader({ isLoading }: { isLoading: boolean }) {
  return <PageLoader isLoading={isLoading} />;
}

export function MarketplaceSearchOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <EnhancedSearchOverlay isOpen={isOpen} onClose={onClose} />;
}

export function MarketplaceMainWidgets() {
  return (
    <>
      <PriceDropAlert />
      <NotificationToastStack />
    </>
  );
}

export function MarketplaceFloatingChrome({
  isSearchOverlayOpen,
  isWishlistOpen,
  showSearchOverlay,
  onCloseSearchOverlay,
  onCloseWishlist,
  onNavigateStart,
}: MarketplaceFloatingChromeProps) {
  return (
    <>
      {showSearchOverlay ? (
        <MarketplaceSearchOverlay isOpen={isSearchOverlayOpen} onClose={onCloseSearchOverlay} />
      ) : null}
      <ScrollProgress />
      <OrderTrackingWidget />
      <CartDrawer />
      <ComparePanel />
      <WishlistSidebar isOpen={isWishlistOpen} onClose={onCloseWishlist} />
      <MobileBottomNav onNavigateStart={onNavigateStart} />
      <EnhancedFooter />
    </>
  );
}
