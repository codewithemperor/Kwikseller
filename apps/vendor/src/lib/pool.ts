import type { PoolProduct, PoolSourceType } from "@kwikseller/types";

export type PoolCatalogItem = PoolProduct & {
  sourceType?: PoolSourceType;
  sourceProductId?: string;
  sourceStoreId?: string;
  sourceStoreName?: string;
  sourceStoreSlug?: string;
  sourceBasePrice?: number;
  alreadySelected?: boolean;
  linkedOfferId?: string;
  linkedProductId?: string;
};

export function poolItemRouteKey(item: PoolCatalogItem) {
  const sourceType = item.sourceType ?? "ADMIN_POOL";
  const id = sourceType === "VENDOR_PRODUCT" ? item.sourceProductId ?? item.id : item.id;
  return `${sourceType.toLowerCase()}-${encodeURIComponent(id)}`;
}

export function matchesPoolRouteKey(item: PoolCatalogItem, key: string) {
  return poolItemRouteKey(item) === key;
}

export function poolSourcePrice(item: PoolCatalogItem) {
  return Number(item.sourceBasePrice ?? item.wholesalePrice ?? 0);
}

export function poolSuggestedPrice(item: PoolCatalogItem) {
  return Number(item.suggestedRetailPrice ?? item.sourceBasePrice ?? item.wholesalePrice ?? 0);
}

export function poolSourceName(item: PoolCatalogItem) {
  return item.sourceType === "VENDOR_PRODUCT"
    ? item.sourceStoreName ?? "Vendor source"
    : "Kwikseller";
}
