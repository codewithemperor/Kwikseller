import type { MarketplaceProduct } from "@/data/marketplace-home";

export function productMatchesQuery(product: MarketplaceProduct, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const values = [
    product.name,
    product.description,
    product.store,
    product.category,
    product.tag,
    product.productType,
    product.productSource,
    ...(product.tags ?? []),
    ...(product.features ?? []),
  ];

  return values.some((value) => value?.toLowerCase().includes(needle));
}

