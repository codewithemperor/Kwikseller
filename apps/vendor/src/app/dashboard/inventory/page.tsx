"use client";

import React from "react";
import { AlertTriangle, Boxes, PackageCheck, PlusCircle } from "lucide-react";
import {
  VendorSoftPanel,
} from "@/components/dashboard/vendor-dashboard-ui";
import { unwrapApiData } from "@/lib/vendor-format";
import { vendorCommerceApi } from "@/lib/api-client";
import type { Product } from "@/lib/types";
import {
  AppButton,
  AppModal,
  EmptyState,
  FieldInput,
  FieldSelect,
  Skeleton,
  VendorMetricCard,
  VendorPageHeader,
} from "@/lib/ui";
import { kwikToast } from "@/lib/utils";
import { motion } from "framer-motion";

export default function VendorInventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [productId, setProductId] = React.useState("");
  const [quantityDelta, setQuantityDelta] = React.useState(0);
  const [reason, setReason] = React.useState("Manual stock adjustment");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);

  const loadProducts = React.useCallback(() => {
    setIsLoading(true);
    vendorCommerceApi
      .listProducts()
      .then((response) => {
        const list = unwrapApiData<Product[]>(response.data);
        setProducts(list);
        setProductId((current) => current || list[0]?.id || "");
      })
      .catch(() => kwikToast.error("Could not load inventory"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const submitAdjustment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || quantityDelta === 0) return;
    setIsSaving(true);
    try {
      await vendorCommerceApi.adjustInventory(productId, { quantityDelta, reason });
      kwikToast.success("Inventory adjusted");
      setQuantityDelta(0);
      setIsAdjustOpen(false);
      loadProducts();
    } catch (error) {
      kwikToast.error(error instanceof Error ? error.message : "Inventory adjustment failed");
    } finally {
      setIsSaving(false);
    }
  };

  const physicalProducts = products.filter(
    (product) => product.productType !== "DIGITAL" && product.productSource !== "POOL_RESALE",
  );
  const lowStockProducts = physicalProducts.filter((product) => {
    const inventory = product.inventoryItems?.[0];
    const available = inventory?.available ?? product.stock ?? 0;
    const threshold = inventory?.lowStockThreshold ?? product.lowStock ?? 5;
    return available <= threshold;
  });
  const reserved = physicalProducts.reduce((total, product) => total + Number(product.inventoryItems?.[0]?.reserved ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="safe-container space-y-5"
    >
      <VendorPageHeader
        title="Inventory"
        description="Owned stock, reservations, and low-stock alerts."
        actions={
          <AppButton type="button" size="lg" onClick={() => setIsAdjustOpen(true)} disabled={!physicalProducts.length}>
            <PlusCircle className="h-4 w-4" />
            Adjust stock
          </AppButton>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <VendorMetricCard title="Tracked products" value={String(physicalProducts.length)} description="Owned physical products with stock tracking." icon={Boxes} />
        <VendorMetricCard title="Reserved" value={String(reserved)} description="Stock units currently held by checkout." icon={PackageCheck} />
        <VendorMetricCard title="Low stock" value={String(lowStockProducts.length)} description="Owned products below the safety threshold." icon={AlertTriangle} />
      </section>

      <VendorSoftPanel title="Stock ledger" description="Available, reserved, and low-stock thresholds.">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-3 rounded-2xl border border-kwik-border bg-surface p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-10 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : physicalProducts.length ? (
          <div className="space-y-3">
            {physicalProducts.map((product) => {
              const inventory = product.inventoryItems?.[0];
              const available = inventory?.available ?? product.stock ?? 0;
              const threshold = inventory?.lowStockThreshold ?? product.lowStock ?? 5;
              const isLow = available <= threshold;
              return (
                <article key={product.id} className="premium-card grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="product-title-clamp font-heading text-base font-medium text-foreground">{product.name}</h3>
                      {isLow ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                          Low stock
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">SKU {product.sku || "not set"}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="font-heading text-base font-semibold text-foreground">{available}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reserved</p>
                      <p className="font-heading text-base font-semibold text-foreground">{inventory?.reserved ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Threshold</p>
                      <p className="font-heading text-base font-semibold text-foreground">{threshold}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            variant="products"
            title="No owned stock"
            description="Create a physical product before managing inventory."
          />
        )}
      </VendorSoftPanel>

      <AppModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Stock adjustment"
        description="Use positive numbers to add stock and negative numbers to reduce available stock."
      >
        <form onSubmit={submitAdjustment} className="space-y-4">
          <FieldSelect label="Product" value={productId} onChange={(event) => setProductId(event.target.value)}>
            {physicalProducts.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </FieldSelect>
          <FieldInput type="number" label="Quantity delta" value={quantityDelta} onChange={(event) => setQuantityDelta(Number(event.target.value))} />
          <FieldInput label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          <AppButton fullWidth disabled={isSaving || !productId || quantityDelta === 0}>
            Apply adjustment
          </AppButton>
        </form>
      </AppModal>
    </motion.div>
  );
}
