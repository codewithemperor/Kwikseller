"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Home, LayoutGrid, Menu, Minus, Plus, ShoppingCart, Store } from "lucide-react";
import { marketplaceStoresApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import type { Product, Store as StoreType, StorefrontDesignConfig } from "@kwikseller/types";
import { AppImage } from "@/components/ui/app-image";
import { useCartStore } from "@/stores";
import type { MarketplaceProduct } from "@/data/marketplace-home";

export type PublicStoreView = Partial<StoreType> & {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  storefrontDesign?: StorefrontDesignConfig | null;
};

export type VendorStorefrontState = {
  store: PublicStoreView | null;
  products: Product[];
  isLoading: boolean;
  error: string | null;
};

export const STOREFRONT_TEMPLATE_DEFAULTS = {
  themePreset: "CLASSIC",
  navbarTemplate: "NAVBAR_CLASSIC",
  bottomNavTemplate: "BOTTOM_TABS_CLASSIC",
  layoutTemplate: "GRID_COMMERCE",
  cartTemplate: "CART_COMPACT",
  typographyPreset: "FIGTREE_QUESTRIAL",
  fontPairing: "FIGTREE_QUESTRIAL",
  headingFont: "SORA",
  bodyFont: "FIGTREE",
  heroLayout: "BANNER_LEFT",
  productCardStyle: "CLEAN_GRID",
} as const;

const storefrontFontMap: Record<string, string> = {
  SORA: "var(--font-heading)",
  FIGTREE: "var(--font-text)",
  INTER: "var(--font-store-inter)",
  POPPINS: "var(--font-store-poppins)",
  DM_SANS: "var(--font-store-dm-sans)",
  LATO: "var(--font-store-lato)",
  MONTSERRAT: "var(--font-store-montserrat)",
  PLAYFAIR_DISPLAY: "var(--font-store-playfair)",
  MERRIWEATHER: "var(--font-store-merriweather)",
};

function unwrap<T>(value: any): T {
  return (value?.data?.data ?? value?.data ?? value) as T;
}

function productImage(product: Product) {
  return product.images?.find((image) => image.isMain)?.url ?? product.images?.[0]?.url ?? "";
}

export function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function fallbackStore(slug: string): PublicStoreView {
  return {
    id: slug,
    slug,
    name: titleFromSlug(slug) || "Vendor Store",
    category: "Kwikseller vendor store",
    description: "This vendor storefront is ready. Live store details and products will appear as soon as the API is available.",
    storefrontDesign: {
      ...STOREFRONT_TEMPLATE_DEFAULTS,
      primaryColor: "#071A2F",
      accentColor: "#F97316",
      sections: ["hero", "products", "policies"],
    },
  };
}

export function normalizeDesign(design?: StorefrontDesignConfig | null): StorefrontDesignConfig {
  return {
    id: design?.id,
    ...STOREFRONT_TEMPLATE_DEFAULTS,
    ...design,
    primaryColor: design?.primaryColor ?? "#071A2F",
    accentColor: design?.accentColor ?? "#F97316",
    headingFont: design?.headingFont ?? "SORA",
    bodyFont: design?.bodyFont ?? "FIGTREE",
    sections: design?.sections?.length ? design.sections : ["hero", "products", "pool", "policies"],
    heroTitle: design?.heroTitle ?? null,
    heroSubtitle: design?.heroSubtitle ?? null,
  };
}

export function storefrontThemeStyle(design?: StorefrontDesignConfig | null) {
  const normalized = normalizeDesign(design);
  return {
    "--store-primary": normalized.primaryColor,
    "--store-accent": normalized.accentColor,
    "--store-font-heading": storefrontFontMap[normalized.headingFont ?? "SORA"] ?? "var(--font-heading)",
    "--store-font-body": storefrontFontMap[normalized.bodyFont ?? "FIGTREE"] ?? "var(--font-text)",
    fontFamily: `var(--store-font-body)`,
  } as React.CSSProperties;
}

export function toMarketplaceProduct(product: Product, store?: PublicStoreView | null): MarketplaceProduct {
  const scoredProduct = product as Product & { rating?: number; reviewCount?: number };
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price ?? 0),
    comparePrice: product.comparePrice,
    image: productImage(product),
    rating: Number(scoredProduct.rating ?? 0),
    reviewCount: Number(scoredProduct.reviewCount ?? 0),
    store: product.store?.name ?? store?.name ?? "Vendor store",
    storeId: product.storeId ?? store?.id,
    storeSlug: product.store?.slug ?? store?.slug,
    category: product.category?.name ?? store?.category ?? "Marketplace",
    productType: product.productType,
    productSource: product.productSource,
    requiresShipping: product.requiresShipping,
    description: product.description,
    stock: product.inventoryItems?.reduce((sum, item) => sum + Math.max(0, Number(item.available ?? 0)), 0),
  };
}

export function useVendorStorefront(slug?: string, options: { loadProducts?: boolean; productLimit?: number } = {}): VendorStorefrontState {
  const [state, setState] = React.useState<VendorStorefrontState>({
    store: null,
    products: [],
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    if (!slug) return;
    let active = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));
    const requests: Array<Promise<any>> = [marketplaceStoresApi.getBySlug(slug)];
    if (options.loadProducts !== false) {
      requests.push(marketplaceStoresApi.getProducts(slug, options.productLimit ? { limit: options.productLimit } : undefined));
    }

    Promise.all(requests)
      .then(([storeResponse, productsResponse]) => {
        if (!active) return;
        setState({
          store: unwrap<PublicStoreView>(storeResponse),
          products: productsResponse ? unwrap<Product[]>(productsResponse) : [],
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        setState({
          store: fallbackStore(slug),
          products: [],
          isLoading: false,
          error: err?.message ?? "This store could not be loaded",
        });
      });

    return () => {
      active = false;
    };
  }, [slug, options.loadProducts, options.productLimit]);

  return state;
}

export function formatStoreCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StoreLogo({ store }: { store: PublicStoreView }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt="" className="h-10 w-10 object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center bg-[var(--store-primary)] text-white">
      <Store className="h-5 w-5" />
    </div>
  );
}

export function VendorStorefrontShell({
  store,
  active = "store",
  children,
}: {
  store: PublicStoreView;
  active?: "store" | "products" | "cart" | "more";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const design = normalizeDesign(store.storefrontDesign);
  const cartCount = useCartStore((state) => state.getStoreItemCount(store.slug));
  const isMinimalBottom = design.bottomNavTemplate === "BOTTOM_NONE";
  const [canGoBack, setCanGoBack] = React.useState(false);

  React.useEffect(() => {
    setCanGoBack(window.history.length > 1 && document.referrer.startsWith(window.location.origin));
  }, []);

  React.useEffect(() => {
    const primaryColor = design.primaryColor ?? "#071A2F";
    const accentColor = design.accentColor ?? "#F97316";
    window.sessionStorage.setItem(
      "kwik.vendorLoader",
      JSON.stringify({
        slug: store.slug,
        name: store.name,
        logoUrl: store.logoUrl ?? null,
        primaryColor,
        accentColor,
      }),
    );
    document.documentElement.style.setProperty("--page-scrollbar", accentColor);
    document.documentElement.style.setProperty("--loader-primary", primaryColor);
    document.documentElement.style.setProperty("--loader-accent", accentColor);

    return () => {
      document.documentElement.style.removeProperty("--page-scrollbar");
      document.documentElement.style.removeProperty("--loader-primary");
      document.documentElement.style.removeProperty("--loader-accent");
    };
  }, [design.accentColor, design.primaryColor, store.logoUrl, store.name, store.slug]);

  const navItems = [
    { key: "store", label: "Store", href: `/vendor/${store.slug}`, icon: Home },
    { key: "products", label: "Products", href: `/vendor/${store.slug}/products`, icon: LayoutGrid },
    { key: "cart", label: "Cart", href: `/vendor/${store.slug}/cart`, icon: ShoppingCart },
    { key: "more", label: "More", href: `/vendor/${store.slug}/more`, icon: Menu },
  ] as const;

  return (
    <div className="storefront-themed min-h-screen bg-white text-kwik-dark dark:bg-[#07111f] dark:text-white" style={storefrontThemeStyle(design)}>
      <header className="sticky top-0 z-[80] border-b border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#07111f]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-6">
          {canGoBack && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex h-10 w-10 items-center justify-center text-[var(--store-primary)] dark:text-white"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Link href={`/vendor/${store.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
            <StoreLogo store={store} />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight">{store.name}</p>
              <p className="truncate text-xs text-kwik-muted dark:text-white/55">{store.category ?? "Vendor store"}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/vendors" className="hidden h-10 items-center px-3 text-xs font-semibold text-kwik-muted transition hover:text-[var(--store-primary)] sm:inline-flex">
              Marketplace
            </Link>
            <Link href={`/vendor/${store.slug}/cart`} className="relative inline-flex h-10 w-10 items-center justify-center bg-[var(--store-accent)] text-white" aria-label="Store cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--store-primary)] px-1 text-[10px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className={isMinimalBottom ? "min-h-[calc(100vh-64px)]" : "min-h-[calc(100vh-64px)] pb-20 md:pb-0"}>
        {children}
      </main>

      {!isMinimalBottom && (
        <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#07111f]/95 md:hidden" aria-label={`${store.name} navigation`}>
          <div className="grid grid-cols-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key || pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${isActive ? "text-[var(--store-accent)]" : "text-kwik-muted"}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function VendorProductCard({
  product,
  store,
  design,
}: {
  product: MarketplaceProduct;
  store: PublicStoreView;
  design?: StorefrontDesignConfig | null;
}) {
  const normalized = normalizeDesign(design);
  const addItem = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) =>
    state.items.some((item) => item.productId === product.id && item.storeSlug === store.slug),
  );
  const productSlug = product.slug ?? product.id;
  const compact = normalized.productCardStyle === "COMPACT_COMMERCE";
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: store.name,
      storeId: product.storeId ?? store.id,
      storeSlug: store.slug,
      storeName: store.name,
      productType: product.productType,
      productSource: product.productSource,
      requiresShipping: product.requiresShipping,
    });
    kwikToast.success(`${product.name} added to ${store.name} cart`);
  };

  return (
    <article
      className={`group flex min-w-0 flex-col border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/5 ${compact ? "p-2" : "p-3"}`}
    >
      <Link href={`/vendor/${store.slug}/product/${productSlug}`} className="relative block aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-white/5">
        <AppImage src={product.image} alt={product.name} fallbackVariant="product" fallbackHint={product.category} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {discount > 0 && (
          <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[11px] font-semibold text-[var(--store-primary)] shadow-sm">
            -{discount}%
          </span>
        )}
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <Link href={`/vendor/${store.slug}/product/${productSlug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-[var(--store-primary)]">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-kwik-muted dark:text-white/55">{product.category}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {product.comparePrice && (
              <p className="text-[10px] text-kwik-muted line-through dark:text-white/50">{formatStoreCurrency(product.comparePrice)}</p>
            )}
            <p className="text-base font-bold text-kwik-dark dark:text-white">{formatStoreCurrency(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center text-white ${isInCart ? "bg-emerald-600" : "bg-[var(--store-accent)]"}`}
            aria-label={isInCart ? "Added to cart" : "Add to cart"}
          >
            {isInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function StorefrontLoading({ storeName, logoUrl, slug }: { storeName?: string; logoUrl?: string | null; slug?: string }) {
  const name = storeName ?? (slug ? titleFromSlug(slug) : "Vendor store");

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-kwik-dark dark:bg-[#07111f] dark:text-white" aria-busy="true" aria-label={`Loading ${name}`}>
      <div className="w-full max-w-xs">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="mx-auto h-14 w-14 object-cover" />
        ) : (
          <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[#071A2F] text-white">
            <Store className="h-7 w-7" />
          </div>
        )}
        <p className="mt-4 font-heading text-lg font-semibold">{name}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-kwik-muted dark:text-white/55">Powered by Kwikseller</p>
        <div className="mx-auto mt-5 h-1 w-36 overflow-hidden bg-neutral-100 dark:bg-white/10">
          <div className="h-full w-1/2 animate-pulse bg-[var(--loader-accent,#f97316)]" />
        </div>
      </div>
    </main>
  );
}

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="inline-flex items-center border border-black/10 dark:border-white/10">
      <button type="button" onClick={onDecrease} className="flex h-9 w-9 items-center justify-center">
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold">{value}</span>
      <button type="button" onClick={onIncrease} className="flex h-9 w-9 items-center justify-center">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function StorefrontLogoMark() {
  return <Image src="/icon.png" alt="Kwikseller" width={28} height={28} className="h-7 w-7" />;
}

export function VendorEmptyProducts({ store }: { store: PublicStoreView }) {
  return (
    <div className="col-span-full flex min-h-[45vh] items-center justify-center border border-black/10 p-6 text-center text-sm leading-6 text-kwik-muted dark:border-white/10 dark:text-white/60">
      <p className="max-w-sm">{store.name} does not have live products loaded yet. Check back after this store publishes products.</p>
    </div>
  );
}

export function StorefrontSectionTitle({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
        {text && <p className="mt-1 text-sm text-kwik-muted dark:text-white/60">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function StorefrontActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center justify-center gap-2 bg-[var(--store-primary)] px-4 text-sm font-semibold text-white">
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
