"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import {
  PageHeader,
  DataTable,
  type Column,
  type RowAction,
  ConfirmDialog,
} from "@/components/ui";
import { bannersApi } from "@/lib/api";
import type { Banner } from "@/lib/api";
import { formatRelativeTime } from "@kwikseller/utils";

const positionLabels: Record<string, string> = { HOME_HERO: "Home Hero", HOME_SIDEBAR: "Home Sidebar", CATEGORY_TOP: "Category Top", PRODUCT_PAGE: "Product Page" };

export default function BannersPage() {
  const router = useRouter();
  const queryClient = useQueryClient(); const [page, setPage] = useState(1); const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const { data, isLoading, isRefetching, refetch } = useQuery({ queryKey: ["admin-banners", page], queryFn: () => { const loadingId = toast("Loading banners...", { isLoading: true, timeout: 0 }); return bannersApi.list({ page, limit: 10 }).then((res) => { toast.close(loadingId); toast.success("Banners loaded"); return res; }).catch((err) => { toast.close(loadingId); toast.danger("Failed to load banners: " + (err?.message || "Unknown error")); throw err; }); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => bannersApi.delete(id), onSuccess: () => { toast.success("Banner deleted"); queryClient.invalidateQueries({ queryKey: ["admin-banners"] }); setDeleteTarget(null); }, onError: (error) => toast.danger("Failed to delete banner: " + error.message) });
  const toggleMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => bannersApi.update(id, { isActive }), onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["admin-banners"] }); }, onError: (error) => toast.danger("Failed to update banner: " + error.message) });

  const columns: Column<Banner>[] = [
    { key: "title", label: "Banner", sortable: true, isRowHeader: true, render: (item) => (<div className="flex items-center gap-3"><div className="flex h-16 w-24 items-center justify-center rounded-lg bg-default-100 shrink-0 overflow-hidden"><img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="font-medium truncate">{item.title}</p>{item.linkUrl && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.linkUrl}</p>}</div></div>) },
    { key: "position", label: "Position", render: (item) => (<span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{positionLabels[item.position] ?? item.position}</span>) },
    { key: "status", label: "Status", render: (item) => (<button onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.isActive })} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground"}`}>{item.isActive ? "Active" : "Inactive"}</button>) },
    { key: "dates", label: "Schedule", render: (item) => (<div className="text-xs text-muted-foreground">{item.startDate && <span>From: {new Date(item.startDate).toLocaleDateString()}</span>}{item.endDate && <span className="block">To: {new Date(item.endDate).toLocaleDateString()}</span>}{!item.startDate && !item.endDate && <span>No schedule</span>}</div>) },
    { key: "createdAt", label: "Created", sortable: true, render: (item) => (<span className="text-muted-foreground text-xs">{formatRelativeTime(item.createdAt)}</span>) },
  ];

  const rowActions: RowAction<Banner>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      onPress: (item) => router.push(`/admin/banners/${item.id}`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5 shrink-0 text-danger" />,
      variant: "danger",
      onPress: (item) => setDeleteTarget(item),
    },
  ];

  const banners = (data as { data?: Banner[] } | undefined)?.data ?? [];
  const totalItems = (data as unknown as { meta?: { total: number } })?.meta?.total ?? banners.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Banners" description="Manage promotional banners" breadcrumbs={[{ label: "Banners" }]} actions={<Link href="/admin/banners/new" className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">Add Banner</Link>} />
      <DataTable columns={columns} data={banners} isLoading={isLoading} totalItems={totalItems} page={page} pageSize={10} onPageChange={setPage} onRefresh={refetch} isRefetching={isRefetching} emptyMessage="No banners found" emptyIcon={<ImageIcon className="h-8 w-8 text-muted-foreground/50" />} getRowId={(item) => item.id} rowActions={rowActions} />
      <ConfirmDialog isOpen={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete Banner" message={`Delete "${deleteTarget?.title}"?`} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} isLoading={deleteMutation.isPending} />
    </div>
  );
}
