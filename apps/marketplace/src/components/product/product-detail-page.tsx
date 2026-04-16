"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@heroui/react";
import {
  marketplaceRelatedProducts,
  type MarketplaceProduct,
} from "@/data/marketplace-home";
import { MarketplaceProductCard } from "@/components/landing/shared/marketplace-product-card";
import { MarketplaceSectionHeader } from "@/components/landing/shared/marketplace-section-header";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProductDetailPage({
  product,
}: {
  product: MarketplaceProduct;
}) {
  const [activeImage, setActiveImage] = React.useState(product.images?.[0] ?? product.image);

  const gallery = product.images?.length ? product.images : [product.image];

  return (
    <div className="bg-[#f5f5f5] py-1">
      <div className="container mx-auto space-y-5 px-4">
        <div className="flex items-center gap-2 text-sm text-[#6b7280]">
          <Link href="/" className="hover:text-[#ea580c]">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{product.name}</span>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="relative aspect-[1.05/1] overflow-hidden rounded-[24px] bg-[#f1f1ee]">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-8"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {gallery.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`relative aspect-square overflow-hidden rounded-[18px] border ${
                      activeImage === image
                        ? "border-[#ea580c]"
                        : "border-[#e5e7eb]"
                    } bg-[#f8f8f6]`}
                  >
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="25vw"
                      className="object-contain p-3"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#8b8b8b]">
                  {product.store}
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[#111827]">
                  {product.name}
                </h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-[#6b7280]">
                  <span className="inline-flex items-center gap-1 font-medium text-[#111827]">
                    <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
                    {product.rating.toFixed(1)}
                  </span>
                  <span>({product.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#f9fafb] p-5">
                {product.comparePrice && (
                  <p className="text-lg text-[#8b8b8b] line-through">
                    {formatCurrency(product.comparePrice)}
                  </p>
                )}
                <p className="text-4xl font-medium text-[#111827]">
                  {formatCurrency(product.price)}
                </p>
                <p className="mt-3 text-sm text-[#6b7280]">
                  Dimensions: {product.dimensions ?? "58 x 79 x 60"}
                </p>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Material: {product.tag ?? "Oak"}
                </p>
                <Button
                  variant="primary"
                  className="mt-5 h-12 rounded-xl bg-[#ea580c] px-5 font-semibold text-white hover:bg-[#c2410c]"
                >
                  Add to cart
                </Button>
              </div>

              <div className="rounded-[24px] border border-[#e5e7eb] p-5">
                <h2 className="text-lg font-semibold text-[#111827]">
                  Product description
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#4b5563]">
                  {product.description}
                </p>
              </div>

              <div className="rounded-[24px] border border-[#e5e7eb] p-5">
                <h2 className="text-lg font-semibold text-[#111827]">
                  Product details
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {product.specifications?.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-[#f9fafb] px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8b8b8b]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#111827]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
          <MarketplaceSectionHeader title="Features" href="#" actionLabel="Product info" />
          <div className="grid gap-3 sm:grid-cols-2">
            {product.features?.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm text-[#374151]"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
          <MarketplaceSectionHeader title="Reviews" href="#" actionLabel="Customer feedback" />
          <div className="grid gap-4 lg:grid-cols-3">
            {product.reviews?.map((review) => (
              <article
                key={review.id}
                className="rounded-[24px] border border-[#e5e7eb] p-5"
              >
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={`${review.id}-${index}`}
                      className={`h-4 w-4 ${
                        index < review.rating
                          ? "fill-[#f59e0b] text-[#f59e0b]"
                          : "text-[#d1d5db]"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm leading-6 text-[#4b5563]">{review.text}</p>
                <div className="mt-4 border-t border-[#f3f4f6] pt-4">
                  <p className="font-semibold text-[#111827]">{review.name}</p>
                  <p className="text-sm text-[#6b7280]">{review.location}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
          <MarketplaceSectionHeader title="Related products" href="/" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {marketplaceRelatedProducts.map((relatedProduct, index) => (
              <MarketplaceProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                priority={index < 2}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
