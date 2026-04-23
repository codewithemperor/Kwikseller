"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { MoreVertical, Edit, Trash2, Image, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DataTable, type Column, ConfirmDialog } from "@/components/ui";
import { bannersApi } from "@/lib/api";
import type { Banner } from "@/lib/api";
import { formatRelativeTime } from "@kwikseller/utils";

const positionLabels: Record<string, string> = { HOME_HERO: "Home Hero", HOME_SIDEBAR: "Home Sidebar", CATEGORY_TOP: "Category Top", PRODUCT_PAGE: "Product Page" };

export default function BannersPage() {
  const queryClient = useQueryClient(); const [page, setPage] = useState(1); const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const { data, isLoading, isRefetching, refetch } = useQuery({ queryKey: ["admin-banners", page], queryFn: () => bannersApi.list({ page, limit: 10 }).then((res) => res.data) });
  const deleteMutation = useMutation({ mutationFn: (id: string) => bannersApi.delete(id), onSuccess: () => { toast.success("Banner deleted"); queryClient.invalidateQueries({ queryKey: ["admin-banners"] }); setDeleteTarget(null); }, onError: () => toast.error("Failed to delete") });
  const toggleMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => bannersApi.update(id, { isActive }), onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["admin-banners"] }); } });

  const columns: Column<Banner>[] = [
    { key: "title", label: "Banner", sortable: true, render: (item) => (<div className="flex items-center gap-3"><div className="flex h-16 w-24 items-center justify-center rounded-lg bg-default-100 shrink-0 overflow-hidden"><img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="font-medium truncate">{item.title}</p>{item.linkUrl && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.linkUrl}</p>}</div></div>) },
    { key: "position", label: "Position", render: (item) => (<span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{positionLabels[item.position] ?? item.position}</span>) },
    { key: "status", label: "Status", render: (item) => (<button onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.isActive })} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground"}`}>{item.isActive ? "Active" : "Inactive"}</button>) },
    { key: "dates", label: "Schedule", render: (item) => (<div className="text-xs text-muted-foreground">{item.startDate && <span>From: {new Date(item.startDate).toLocaleDateString()}</span>}{item.endDate && <span className="block">To: {new Date(item.endDate).toLocaleDateString()}</span>}{!item.startDate && !item.endDate && <span>No schedule</span>}</div>) },
    { key: "createdAt", label: "Created", sortable: true, render: (item) => (<span className="text-muted-foreground text-xs">{formatRelativeTime(item.createdAt)}</span>) },
  ];

  const banners = Array.isArray(data) ? data : (data as unknown as { data?: Banner[] })?.data ?? [];
  const totalItems = (data as unknown as { meta?: { total: number } })?.meta?.total ?? banners.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Banners" description="Manage promotional banners" breadcrumbs={[{ label: "Banners" }]} actions={<Link href="/admin/banners/new" className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">Add Banner</Link>} />
      <DataTable columns={columns} data={banners} isLoading={isLoading} totalItems={totalItems} page={page} pageSize={10} onPageChange={setPage} onRefresh={refetch} isRefetching={isRefetching} emptyMessage="No banners found" emptyIcon={<Image className="h-8 w-8 text-muted-foreground/50" />} getRowId={(item) => item.id} actions={(item) => (<Dropdown><DropdownTrigger><button className="flex h-7 w-7 items-center justify-center rounded-md text-default-400 hover:bg-default-100"><MoreVertical className="h-4 w-4" /></button></DropdownTrigger><DropdownMenu><DropdownItem href={`/admin/banners/${item.id}`}>Edit</DropdownItem><DropdownItem className="text-danger" onClick={() => setDeleteTarget(item)}>Delete</DropdownItem></DropdownMenu></Dropdown>)} />
      <ConfirmDialog isOpen={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete Banner" message={`Delete "${deleteTarget?.title}"?`} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} isLoading={deleteMutation.isPending} />
    </div>
  );
}
