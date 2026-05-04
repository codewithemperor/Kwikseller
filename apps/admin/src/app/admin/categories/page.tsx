"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@heroui/react";
import { FolderTree, Eye, EyeOff, Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import {
  PageHeader,
  DataTable,
  type Column,
  type RowAction,
  ConfirmDialog,
} from "@/components/ui";
import { categoriesApi } from "@/lib/api";
import type { Category } from "@kwikseller/types";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface CategoryWithChildren extends Category {
  id: string;                          // required by TreeItem
  children?: CategoryWithChildren[];
  icon?: string;
  position?: number;
  _count?: { products: number };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithChildren | null>(null);

  const {
    data: categories,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-categories-tree"],
    queryFn: () =>
      categoriesApi.getTree().then((res) => res.data as CategoryWithChildren[]),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoriesApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success("Category status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-categories-tree"] });
    },
    onError: (e: Error) => toast.danger("Failed to update: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-categories-tree"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.danger("Failed to delete: " + e.message),
  });

  // When searching, flatten the tree so results are all visible
  const treeData = useMemo(() => {
    if (!categories) return [];
    if (!search.trim()) return categories;

    // flatten + filter, then re-nest is complex — for search just return flat matches
    const flatten = (cats: CategoryWithChildren[]): CategoryWithChildren[] =>
      cats.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);

    const q = search.toLowerCase();
    return flatten(categories).filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [categories, search]);

  // Collect top-level IDs so they are expanded by default
  const defaultExpandedKeys = useMemo(
    () => (categories ?? []).map((c) => c.id),
    [categories],
  );

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns: Column<CategoryWithChildren>[] = [
    {
      key: "name",
      label: "Category",
      isRowHeader: true,
      render: (item) => (
        // No manual indent needed — the tree column chevron handles visual depth
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            {item.imageUrl ? (
              <Avatar.Image src={item.imageUrl} alt={item.name} />
            ) : null}
            <Avatar.Fallback>
              {item.name.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {item.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "parentId",
      label: "Type",
      className: "w-24",
      render: (item) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            !item.parentId
              ? "bg-blue-50 text-blue-700"
              : "bg-purple-50 text-purple-700",
          )}
        >
          {!item.parentId ? "Parent" : "Sub"}
        </span>
      ),
    },
    {
      key: "products",
      label: "Products",
      className: "w-28",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          <span>{item._count?.products ?? 0}</span>
        </div>
      ),
    },
    {
      key: "position",
      label: "Position",
      className: "w-24",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.position ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-28",
      render: (item) => (
        <button
          onClick={() =>
            toggleMutation.mutate({ id: item.id, isActive: !item.isActive })
          }
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            item.isActive
              ? "bg-success/10 text-success hover:bg-success/20"
              : "bg-default-100 text-muted-foreground hover:bg-default-200",
          )}
        >
          {item.isActive ? (
            <>
              <Eye className="h-3 w-3" /> Active
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3" /> Inactive
            </>
          )}
        </button>
      ),
    },
  ];

  const rowActions: RowAction<CategoryWithChildren>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      onPress: (item) => {
        window.location.href = `/admin/categories/${item.id}`;
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5 shrink-0 text-danger" />,
      variant: "danger",
      onPress: (item) => setDeleteTarget(item),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage product categories"
        breadcrumbs={[{ label: "Categories" }]}
        actions={
          <Link
            href="/admin/categories/new"
            className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Add Category
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={treeData}
        isLoading={isLoading}
        onSearch={setSearch}
        searchPlaceholder="Search categories..."
        onRefresh={refetch}
        isRefetching={isFetching}
        emptyMessage="No categories found"
        emptyIcon={<FolderTree className="h-8 w-8 text-muted-foreground/50" />}
        getRowId={(item) => item.id}
        rowActions={rowActions}
        /* ↓ Tree expansion props */
        treeColumn="name"
        defaultExpandedKeys={defaultExpandedKeys}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Subcategories will also be deleted.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}