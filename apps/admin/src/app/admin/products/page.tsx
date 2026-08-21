"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Chip } from "@heroui/react";
import { Pencil, Trash2, Package } from "lucide-react";
import { toast } from "@heroui/react";
import {
  PageHeader,
  DataTable,
  type Column,
  type RowAction,
  ConfirmDialog,
} from "@/components/ui";
import { adminProductsApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

const statusColorMap: Record<string, "success" | "warning" | "default" | "danger" | "accent"> = {
  ACTIVE: "success",
  DRAFT: "warning",
  ARCHIVED: "default",
  PENDING: "accent",
};

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () => {
      const loadingId = toast("Loading products...", { isLoading: true, timeout: 0 });
      return adminProductsApi
        .list({ page, limit: 10, search: search || undefined })
        .then((res) => { toast.close(loadingId); toast.success("Products loaded"); return res; })
        .catch((err) => { toast.close(loadingId); toast.danger("Failed to load products: " + (err?.message || "Unknown error")); throw err; });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminProductsApi.delete(id),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.danger("Failed to delete product: " + error.message);
    },
  });

  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Product",
      sortable: true,
      isRowHeader: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-default-100 shrink-0 overflow-hidden">
            {item.images && item.images.length > 0 ? (
              <img
                src={typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.url ?? ''}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              SKU: {item.sku ?? "N/A"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-medium">{formatCurrency(item.price)}</span>
          {item.comparePrice && item.comparePrice > item.price && (
            <span className="ml-1.5 text-xs text-muted-foreground line-through">
              {formatCurrency(item.comparePrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      sortable: true,
      render: (item) => (
        <span
          className={
            item.stock === 0
              ? "text-danger font-medium"
              : item.stock < 10
                ? "text-warning font-medium"
                : ""
          }
        >
          {item.stock}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <Chip
          size="sm"
          variant="soft"
          color={statusColorMap[item.status] ?? "default"}
        >
          {item.status}
        </Chip>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (item) => (
        <span className="text-muted-foreground text-xs">
          {formatRelativeTime(item.createdAt)}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<Product>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      onPress: (item) => router.push(`/admin/products/${item.id}`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5 shrink-0 text-danger" />,
      variant: "danger",
      onPress: (item) => setDeleteTarget(item),
    },
  ];

  const products = (data as { data?: Product[] } | undefined)?.data ?? [];
  const totalItems = (data as unknown as { meta?: { total: number } })?.meta?.total ?? products.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        breadcrumbs={[{ label: "Products" }]}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Add Product
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        totalItems={totalItems}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search products..."
        onRefresh={refetch}
        isRefetching={isRefetching}
        emptyMessage="No products found"
        getRowId={(item) => item.id}
        rowActions={rowActions}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

