"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, PackageCheck, ShoppingCart } from "lucide-react";
import { marketplaceStoresApi } from "@kwikseller/api-client";
import type { Product } from "@kwikseller/types";
import { kwikToast } from "@kwikseller/utils";
import {
  StorefrontLoading,
  StorefrontSectionTitle,
  VendorProductCard,
  VendorStorefrontShell,
  formatStoreCurrency,
  normalizeDesign,
  toMarketplaceProduct,
  useVendorStorefront,
} from "@/components/vendor/vendor-storefront";
import { useCartStore } from "@/stores";

function unwrapProduct(value: unknown): Product {
  const payload = value as { data?: unknown };
  const nested = payload?.data as { data?: unknown } | undefined;
  return (nested?.data ?? payload?.data ?? value) as Product;
}

export default function VendorProductPage() {
  const params = useParams<{ slug: string; productSlug: string }>();
  const slug = params.slug;
  const productSlug = params.productSlug;
  const { store, products, isLoading } = useVendorStorefront(slug);
  const listedProduct = products.find((item) => item.slug === productSlug || item.id === productSlug);
  const [remoteProduct, setRemoteProduct] = React.useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  React.useEffect(() => {
    if (!slug || !productSlug || listedProduct) {
      setRemoteProduct(null);
      setIsLoadingProduct(false);
      return;
    }

    let active = true;
    setIsLoadingProduct(true);
    marketplaceStoresApi.getProduct(slug, productSlug)
      .then((response) => {
        if (active) setRemoteProduct(unwrapProduct(response));
      })
      .catch(() => {
        if (active) setRemoteProduct(null);
      })
      .finally(() => {
        if (active) setIsLoadingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [slug, productSlug, listedProduct]);

  if (isLoading || isLoadingProduct || !store) return <StorefrontLoading slug={slug} />;

  const product = listedProduct ?? remoteProduct;
  const design = normalizeDesign(store.storefrontDesign);
  const marketplaceProduct = product ? toMarketplaceProduct(product, store) : null;
  const isInCart = marketplaceProduct
    ? cartItems.some((item) => item.storeSlug === store.slug && item.productId === marketplaceProduct.id)
    : false;
  const relatedProducts = products
    .filter((item) => item.id !== product?.id)
    .slice(0, 4)
    .map((item) => toMarketplaceProduct(item, store));

  const handleAdd = () => {
    if (!marketplaceProduct) return;
    addItem({
      productId: marketplaceProduct.id,
      name: marketplaceProduct.name,
      price: marketplaceProduct.price,
      comparePrice: marketplaceProduct.comparePrice,
      image: marketplaceProduct.image,
      store: store.name,
      storeId: marketplaceProduct.storeId ?? store.id,
      storeSlug: store.slug,
      storeName: store.name,
      productType: marketplaceProduct.productType,
      productSource: marketplaceProduct.productSource,
      requiresShipping: marketplaceProduct.requiresShipping,
    });
    kwikToast.success(`${marketplaceProduct.name} added to ${store.name} cart`);
  };

  return (
    <VendorStorefrontShell store={store} active="products">
      {!marketplaceProduct ? (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <PackageCheck className="mx-auto h-10 w-10 text-[var(--store-accent)]" />
          <h1 className="mt-4 text-2xl font-semibold">Product not found</h1>
          <p className="mt-2 text-sm text-kwik-muted dark:text-white/60">This product is unavailable in {store.name} right now.</p>
          <Link href={`/vendor/${store.slug}`} className="mt-6 inline-flex h-10 items-center justify-center bg-[var(--store-primary)] px-4 text-sm font-semibold text-white">
            Back to store
          </Link>
        </section>
      ) : (
        <>
          <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.9fr] lg:px-6">
            <div className="overflow-hidden bg-neutral-100 dark:bg-white/5">
              <img src={marketplaceProduct.image} alt={marketplaceProduct.name} className="aspect-square h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--store-accent)]">{marketplaceProduct.category}</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{marketplaceProduct.name}</h1>
              <p className="mt-4 text-sm leading-6 text-kwik-muted dark:text-white/60">
                {marketplaceProduct.description || `A verified product from ${store.name}, fulfilled inside this vendor storefront.`}
              </p>
              <div className="mt-6 flex items-end gap-3">
                <p className="text-3xl font-bold">{formatStoreCurrency(marketplaceProduct.price)}</p>
                {marketplaceProduct.comparePrice && (
                  <p className="pb-1 text-sm text-kwik-muted line-through">{formatStoreCurrency(marketplaceProduct.comparePrice)}</p>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`inline-flex h-12 items-center justify-center gap-2 px-5 text-sm font-semibold text-white ${isInCart ? "bg-emerald-600" : "bg-[var(--store-accent)]"}`}
                >
                  {isInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  {isInCart ? "Added to cart" : "Add to cart"}
                </button>
                <Link href={`/vendor/${store.slug}/cart`} className="inline-flex h-12 items-center justify-center border border-black/10 px-5 text-sm font-semibold dark:border-white/10">
                  Open store cart
                </Link>
              </div>
            </div>
          </section>

          {relatedProducts.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
              <StorefrontSectionTitle title="More from this store" text={`Keep shopping ${store.name}.`} />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {relatedProducts.map((item) => (
                  <VendorProductCard key={item.id} product={item} store={store} design={design} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </VendorStorefrontShell>
  );
}
