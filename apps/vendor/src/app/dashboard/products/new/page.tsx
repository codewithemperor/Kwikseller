"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorCommerceApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";

/**
 * New Product page — thin wrapper around `ProductForm`.
 *
 * Submits the new product through `vendorCommerceApi.createProduct`,
 * then redirects to /dashboard/products on success.
 */
export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const imageUrls = values.images.map((img) => img.url).filter(Boolean);
      return vendorCommerceApi.createProduct({
        name: values.name.trim(),
        description: values.description,
        price: Number(values.price),
        comparePrice: values.comparePrice ? Number(values.comparePrice) : undefined,
        sku: values.sku || undefined,
        categoryId: values.categoryId || undefined,
        productType: "PHYSICAL",
        requiresShipping: true,
        trackInventory: true,
        initialStock: Number(values.stock),
        lowStock: Number(values.lowStockThreshold),
        status: values.status,
        images: imageUrls,
      });
    },
    onSuccess: () => {
      kwikToast.success("Product created");
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      router.push("/dashboard/products");
    },
    onError: (error: unknown) => {
      kwikToast.error(
        error instanceof Error ? error.message : "Failed to create product",
      );
    },
  });

  const handleSubmit = async (values: ProductFormValues) => {
    await createMutation.mutateAsync(values);
  };

  return (
    <ProductForm
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      title="Add Product"
      description="Add a new product to your store."
      submitLabel="Create Product"
    />
  );
}
