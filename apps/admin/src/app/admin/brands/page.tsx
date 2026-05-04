"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Eye, EyeOff, Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import {
  PageHeader,
  DataTable,
  type Column,
  type RowAction,
  ConfirmDialog,
} from "@/components/ui";
import { brandsApi } from "@/lib/api";
import type { Brand } from "@/lib/api";
import { formatRelativeTime } from "@kwikseller/utils";

export default function BrandsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-brands", page, search],
    queryFn: () => {
      const loadingId = toast("Loading brands...", {
        isLoading: true,
        timeout: 0,
      });
      return brandsApi
        .list({ page, limit: 10, search: search || undefined })
        .then((res) => {
          toast.close(loadingId);
          toast.success("Brands loaded");
          return res;
        })
        .catch((err) => {
          toast.close(loadingId);
          toast.danger(
            "Failed to load brands: " + (err?.message || "Unknown error"),
          );
          throw err;
        });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandsApi.delete(id),
    onSuccess: () => {
      toast.success("Brand deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      setDeleteTarget(null);
    },
    onError: (error) =>
      toast.danger("Failed to delete brand: " + error.message),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      brandsApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success("Brand status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    },
    onError: (error) =>
      toast.danger("Failed to update brand: " + error.message),
  });

  const columns: Column<Brand>[] = [
    {
      key: "name",
      label: "Brand",
      sortable: true,
      isRowHeader: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-default-100 shrink-0 overflow-hidden">
            {item.logoUrl || (item as unknown as { image?: string }).image ? (
              <img
                src={
                  item.logoUrl || (item as unknown as { image?: string }).image!
                }
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Award className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "products",
      label: "Products",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          <span>{item._count?.products ?? 0}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <button
          onClick={() =>
            toggleMutation.mutate({ id: item.id, isActive: !item.isActive })
          }
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground"}`}
        >
          {item.isActive !== false ? (
            <>
              <Eye className="h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3" />
              Inactive
            </>
          )}
        </button>
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

  const rowActions: RowAction<Brand>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      onPress: (item) => router.push(`/admin/brands/${item.id}`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5 shrink-0 text-danger" />,
      variant: "danger",
      onPress: (item) => setDeleteTarget(item),
    },
  ];

  const brands = (data as { data?: Brand[] } | undefined)?.data ?? [];
  const totalItems =
    (data as unknown as { meta?: { total: number } })?.meta?.total ??
    brands.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        description="Manage product brands"
        breadcrumbs={[{ label: "Brands" }]}
        actions={
          <Link
            href="/admin/brands/new"
            className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Add Brand
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={brands}
        isLoading={isLoading}
        totalItems={totalItems}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search brands..."
        onRefresh={refetch}
        isRefetching={isRefetching}
        emptyMessage="No brands found"
        emptyIcon={<Award className="h-8 w-8 text-muted-foreground/50" />}
        getRowId={(item) => item.id}
        rowActions={rowActions}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Brand"
        message={`Delete "${deleteTarget?.name}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
