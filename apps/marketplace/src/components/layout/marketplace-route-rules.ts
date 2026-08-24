const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function isMarketplaceAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isVendorStorefrontRoute(pathname: string) {
  return pathname.startsWith("/vendor/");
}

export function isAccountShellRoute(pathname: string) {
  return (
    pathname === "/cart" ||
    pathname === "/orders" ||
    pathname === "/wishlist" ||
    pathname === "/vendor-orders" ||
    pathname === "/vendor-analytics" ||
    pathname === "/coupons" ||
    pathname === "/help" ||
    pathname.startsWith("/profile")
  );
}

export function getMarketplaceChromeVisibility(pathname: string) {
  const isAuthPage = isMarketplaceAuthRoute(pathname);
  const hidesFullChrome =
    isAuthPage || isVendorStorefrontRoute(pathname) || isAccountShellRoute(pathname);

  return {
    isAuthPage,
    isSearchPage: pathname === "/search",
    hideFullChrome: hidesFullChrome,
    hideTopNav: hidesFullChrome,
  };
}
