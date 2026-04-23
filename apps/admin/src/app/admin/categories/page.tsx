"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Chip, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { MoreVertical, Edit, Trash2, FolderTree, Eye, EyeOff, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, ConfirmDialog } from "@/components/ui";
import { categoriesApi } from "@/lib/api";
import type { Category } from "@kwikseller/types";
import { cn } from "@/lib/utils";

interface CategoryWithChildren extends Category { children?: CategoryWithChildren[]; description?: string; }

function CategoryRow({ category, depth = 0, onDelete, onToggle }: { category: CategoryWithChildren; depth?: number; onDelete: (cat: Category) => void; onToggle: (cat: Category) => void }) {
  return (
    <>
      <div className={cn("flex items-center gap-3 border-b border-default-100 py-3 px-4 hover:bg-default-50 transition-colors")} style={{ paddingLeft: `${depth * 24 + 16}px` }}>
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", category.children?.length ? "opacity-100" : "opacity-0")} />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-default-100 overflow-hidden">
          {category.imageUrl ? <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" /> : <FolderTree className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{category.name}</p>
          {category.description && <p className="text-xs text-muted-foreground truncate">{category.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(category)} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors", category.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground")}>
            {category.isActive ? <><Eye className="h-3 w-3" />Active</> : <><EyeOff className="h-3 w-3" />Inactive</>}
          </button>
          <Dropdown>
            <DropdownTrigger><button className="flex h-7 w-7 items-center justify-center rounded-md text-default-400 hover:bg-default-100"><MoreVertical className="h-4 w-4" /></button></DropdownTrigger>
            <DropdownMenu>
              <DropdownItem href={`/admin/categories/${category.id}`}>Edit</DropdownItem>
              <DropdownItem className="text-danger" onClick={() => onDelete(category)}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      {category.children?.map((child) => <CategoryRow key={child.id} category={child} depth={depth + 1} onDelete={onDelete} onToggle={onToggle} />)}
    </>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ["admin-categories-tree"],
    queryFn: () => categoriesApi.getTree().then((res) => res.data as CategoryWithChildren[]),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => categoriesApi.update(id, { isActive }),
    onSuccess: () => { toast.success("Category status updated"); queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); },
    onError: () => toast.error("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { toast.success("Category deleted successfully"); queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); setDeleteTarget(null); },
    onError: () => toast.error("Failed to delete category"),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Manage product categories" breadcrumbs={[{ label: "Categories" }]} actions={<Link href="/admin/categories/new" className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">Add Category</Link>} />
      <div className="rounded-xl border border-default-200 bg-background overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><span className="text-sm text-muted-foreground">Loading categories...</span></div>
        ) : categories && categories.length > 0 ? (
          categories.map((cat) => <CategoryRow key={cat.id} category={cat} onDelete={setDeleteTarget} onToggle={(cat) => toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive })} />)
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <FolderTree className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No categories found</p>
            <Link href="/admin/categories/new" className="inline-flex h-8 items-center rounded-lg border border-default-200 px-3 text-sm hover:bg-default-50">Create your first category</Link>
          </div>
        )}
      </div>
      <ConfirmDialog isOpen={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete Category" message={`Are you sure you want to delete "${deleteTarget?.name}"? Subcategories will also be deleted.`} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} isLoading={deleteMutation.isPending} />
    </div>
  );
}
