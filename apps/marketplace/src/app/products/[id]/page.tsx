"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productsApi } from "@kwikseller/api-client";
import { ProductDetailPage } from "@/components/product/product-detail-page";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2 } from "lucide-react";
import type { MarketplaceProduct } from "@/data/marketplace-home";

export default function ProductPage() {
  const params = useParams();
  const id = String(params.id);
  // If the ID looks like an object serialization, show not found immediately
  const isInvalidId = id.includes(' ') || id === '[object' || id.includes('Object');
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [isLoading, setIsLoading] = useState(!isInvalidId);
  const [notFound, setNotFound] = useState(isInvalidId);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const response = await productsApi.get(id);
        if (response.success && response.data) {
          const data = response.data as any;
          const p = data.product || data;
          // Extract image URL from image object or string
          const extractImage = (img: any): string | null => {
            if (!img) return null;
            if (typeof img === 'string') return img;
            if (img.url) return img.url;
            return null;
          };
          const mainImage = extractImage(p.image) || extractImage(p.images?.[0]) || extractImage(p.featuredImage);
          const allImages = (p.images || []).map(extractImage).filter(Boolean) as string[];
          if (mainImage && allImages.length === 0) allImages.unshift(mainImage);

          setProduct({
            id: String(p.id),
            slug: p.slug,
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: mainImage,
            rating: p.averageRating || p.rating || 0,
            reviewCount: p.reviewCount || p.reviewsCount || 0,
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
          });
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#07111f]">
        <Loader2 className="h-8 w-8 animate-spin text-kwik-orange" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#07111f]">
        <EmptyState
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  return <ProductDetailPage product={product} />;
}
