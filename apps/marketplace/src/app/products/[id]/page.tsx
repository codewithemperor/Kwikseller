"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { marketplaceApi, productsApi } from "@kwikseller/api-client";
import { ProductDetailPage } from "@/components/product/product-detail-page";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { Loader2 } from "lucide-react";
import type { MarketplaceProduct } from "@/data/marketplace-home";
import { browseProducts } from "@/data/browse-products";

function extractImage(img: any): string | null {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (img.url) return img.url;
  return null;
}

function unwrapProductPayload(data: any) {
  return data?.product ?? data?.data?.product ?? data?.data ?? data;
}

function unwrapProductList(data: any) {
  const payload = data?.data ?? data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function collectHomeFeedProducts(data: any): any[] {
  const feed = data?.data?.data ?? data?.data ?? data?.state?.feed ?? data;
  return [
    ...(Array.isArray(feed?.featuredProducts) ? feed.featuredProducts : []),
    ...(Array.isArray(feed?.dealProducts) ? feed.dealProducts : []),
    ...(Array.isArray(feed?.trendingProducts) ? feed.trendingProducts : []),
  ];
}

function toMarketplaceProduct(p: any): MarketplaceProduct {
  const mainImage = extractImage(p.image) || extractImage(p.images?.[0]) || extractImage(p.featuredImage) || "";
  const allImages = (p.images || []).map(extractImage).filter(Boolean) as string[];
  if (mainImage && allImages.length === 0) allImages.unshift(mainImage);

  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    price: Number(p.price ?? 0),
    comparePrice: p.comparePrice,
    image: mainImage,
    rating: Number(p.averageRating || p.rating || 0),
    reviewCount: Number(p.reviewCount || p.reviewsCount || 0),
    store: p.store?.name || p.storeName || "",
    storeId: p.storeId || p.store?.id,
    storeSlug: p.store?.slug || p.storeSlug,
    category: p.category?.name || p.categoryName || "",
    productType: p.productType,
    productSource: p.productSource,
    requiresShipping: p.requiresShipping,
    tag: p.tag || p.material || "",
    dimensions: p.dimensions || "",
    description: p.description || "",
    images: allImages,
    features: p.features || [],
    specifications: p.specifications || [],
    reviews: p.reviews || [],
    isNew: p.isNew || false,
    variants: p.variants || [],
    stock: p.stock,
  };
}

export default function ProductPage() {
  const params = useParams();
  const id = String(params.id);
  // If the ID looks like an object serialization, show not found immediately
  const isInvalidId = id.includes(' ') || id === '[object' || id.includes('Object');
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(!isInvalidId);
  const [notFound, setNotFound] = useState(isInvalidId);

  // Mock fallback: look up the product in the local browse catalog so the
  // detail page renders richly even when the live API is unreachable.
  function findMockProduct(pid: string): MarketplaceProduct | null {
    const match = browseProducts.find(
      (p) => p.id === pid || p.slug === pid,
    );
    if (!match) return null;
    return {
      id: match.id,
      slug: match.slug,
      name: match.name,
      price: match.price,
      comparePrice: match.comparePrice,
      image: match.image,
      rating: match.rating,
      reviewCount: match.reviewCount,
      store: match.store,
      storeId: match.storeId,
      storeSlug: match.storeSlug,
      category: match.category,
      productType: match.productType,
      productSource: match.productSource,
      requiresShipping: match.requiresShipping,
      tag: match.tag,
      description: match.description ?? `${match.name} — a premium ${match.category.toLowerCase()} product from ${match.store}. Quality you can trust, delivered with KwisCrow buyer protection.`,
      images: match.images ?? [match.image],
      features: match.features ?? [
        "Premium quality materials",
        "Verified vendor",
        "KwisCrow escrow protected",
        "Fast nationwide delivery",
      ],
      specifications: match.specifications ?? [
        { label: "Category", value: match.category },
        { label: "Vendor", value: match.store },
        { label: "Product type", value: match.productType ?? "Physical" },
        { label: "Source", value: (match.productSource ?? "VENDOR_STOCK").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) },
      ],
      reviews: match.reviews ?? [
        { id: "r1", author: "Adaeze O.", rating: 5, comment: "Excellent quality, exactly as described. Fast delivery!", date: "2025-07-10", verified: true },
        { id: "r2", author: "Emeka N.", rating: 4, comment: "Good product, would buy again.", date: "2025-07-05", verified: true },
        { id: "r3", author: "Fatima A.", rating: 5, comment: "Outstanding service from the vendor. Highly recommend.", date: "2025-06-28", verified: true },
      ],
      isNew: match.isNew,
      variants: match.variants ?? [],
      stock: match.stock,
    };
  }

  function getMockSimilarProducts(current: MarketplaceProduct): MarketplaceProduct[] {
    return browseProducts
      .filter((p) => p.category === current.category && p.id !== current.id)
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        comparePrice: p.comparePrice,
        image: p.image,
        rating: p.rating,
        reviewCount: p.reviewCount,
        store: p.store,
        storeSlug: p.storeSlug,
        category: p.category,
        productType: p.productType,
        productSource: p.productSource,
        requiresShipping: p.requiresShipping,
        tag: p.tag,
        isNew: p.isNew,
      } as MarketplaceProduct));
  }

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setNotFound(false);

      // Mock fallback FIRST when the id matches the browse catalog — gives
      // an instant, rich render without waiting for a doomed API call.
      const mockMatch = findMockProduct(id);
      if (mockMatch) {
        setProduct(mockMatch);
        setSimilarProducts(getMockSimilarProducts(mockMatch));
        setIsLoading(false);
        return;
      }

      try {
        let p: any = null;

        try {
          const response = await productsApi.get(id);
          if (response.success && response.data) p = unwrapProductPayload(response.data);
        } catch {
          // Fall through to slug/search recovery.
        }

        if (!p) {
          try {
            const response = await productsApi.getBySlug(id);
            if (response.success && response.data) p = unwrapProductPayload(response.data);
          } catch {
            // Fall through to list/search recovery.
          }
        }

        if (!p) {
          const response = await productsApi.list({ search: id, limit: 12 });
          if (response.success && response.data) {
            p = unwrapProductList(response.data).find((item: any) => String(item.id) === id || item.slug === id);
          }
        }

        if (p) {
          setProduct(toMarketplaceProduct(p));
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchSimilar = async () => {
      let products: MarketplaceProduct[] = [];

      try {
        const response = await productsApi.list({ status: "ACTIVE", limit: 8, sortBy: "createdAt", sortOrder: "desc" });
        if (response.success && response.data) {
          products = unwrapProductList(response.data).slice(0, 8).map(toMarketplaceProduct);
        }
      } catch {
        products = [];
      }

      if (products.length === 0) {
        // Mock fallback: show products from the browse catalog (excluding current).
        products = browseProducts
          .filter((p) => p.id !== id)
          .slice(0, 8)
          .map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.image,
            rating: p.rating,
            reviewCount: p.reviewCount,
            store: p.store,
            storeSlug: p.storeSlug,
            category: p.category,
            productType: p.productType,
            productSource: p.productSource,
            tag: p.tag,
            isNew: p.isNew,
          } as MarketplaceProduct));
      }

      setSimilarProducts(products);
    };

    if (notFound) fetchSimilar();
  }, [notFound, id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <EmptyState
            title="Product not found"
            description="The product you're looking for doesn't exist or has been removed."
            className="min-h-[42vh]"
          />
          {similarProducts.length > 0 && (
            <section className="mt-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-kwik-dark dark:text-white">Similar products</h2>
                <p className="text-sm text-kwik-gray-light dark:text-white/55">Here are active products you may want to check instead.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {similarProducts.map((item) => (
                  <MarketplaceProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return <ProductDetailPage product={product} />;
}
