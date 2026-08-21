"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Pencil, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import {
  PageHeader,
  DataTable,
  type Column,
  type RowAction,
  ConfirmDialog,
} from "@/components/ui";
import { dealsApi } from "@/lib/api";
import type { Deal } from "@/lib/api";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";

export default function DealsPage() {
  const router = useRouter();
  const queryClient = useQueryClient(); const [page, setPage] = useState(1); const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const { data, isLoading, isRefetching, refetch } = useQuery({ queryKey: ["admin-deals", page], queryFn: () => { const loadingId = toast("Loading deals...", { isLoading: true, timeout: 0 }); return dealsApi.list({ page, limit: 10 }).then((res) => { toast.close(loadingId); toast.success("Deals loaded"); return res; }).catch((err) => { toast.close(loadingId); toast.danger("Failed to load deals: " + (err?.message || "Unknown error")); throw err; }); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => dealsApi.delete(id), onSuccess: () => { toast.success("Deal deleted"); queryClient.invalidateQueries({ queryKey: ["admin-deals"] }); setDeleteTarget(null); }, onError: (error) => toast.danger("Failed to delete deal: " + error.message) });
  const toggleMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => dealsApi.update(id, { isActive }), onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["admin-deals"] }); }, onError: (error) => toast.danger("Failed to update deal: " + error.message) });
  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const columns: Column<Deal>[] = [
    { key: "title", label: "Deal", sortable: true, isRowHeader: true, render: (item) => (<div className="min-w-0"><p className="font-medium truncate">{item.title}</p>{item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}</div>) },
    { key: "discount", label: "Discount", render: (item) => (<span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{item.discountType === "PERCENTAGE" ? `${item.discountValue}%` : formatCurrency(item.discountValue)}</span>) },
    { key: "dates", label: "Schedule", render: (item) => (<div className="text-xs text-muted-foreground"><span>{new Date(item.startDate).toLocaleDateString()}</span><span className="mx-1">→</span><span>{new Date(item.endDate).toLocaleDateString()}</span></div>) },
    { key: "status", label: "Status", render: (item) => { const expired = isExpired(item.endDate); const status = expired ? "Expired" : item.isActive ? "Active" : "Inactive"; return (<button disabled={expired} onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.isActive })} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${expired ? "bg-default-100 text-muted-foreground" : item.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground"}`}>{status}</button>); } },
    { key: "createdAt", label: "Created", sortable: true, render: (item) => (<span className="text-muted-foreground text-xs">{formatRelativeTime(item.createdAt)}</span>) },
  ];

  const rowActions: RowAction<Deal>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      onPress: (item) => router.push(`/admin/deals/${item.id}`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5 shrink-0 text-danger" />,
      variant: "danger",
      onPress: (item) => setDeleteTarget(item),
    },
  ];

  const deals = (data as { data?: Deal[] } | undefined)?.data ?? [];
  const totalItems = (data as unknown as { meta?: { total: number } })?.meta?.total ?? deals.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Deals & Promotions" description="Manage promotional deals and offers" breadcrumbs={[{ label: "Deals" }]} actions={<Link href="/admin/deals/new" className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">Create Deal</Link>} />
      <DataTable columns={columns} data={deals} isLoading={isLoading} totalItems={totalItems} page={page} pageSize={10} onPageChange={setPage} onRefresh={refetch} isRefetching={isRefetching} emptyMessage="No deals found" emptyIcon={<Percent className="h-8 w-8 text-muted-foreground/50" />} getRowId={(item) => item.id} rowActions={rowActions} />
      <ConfirmDialog isOpen={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete Deal" message={`Delete "${deleteTarget?.title}"?`} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} isLoading={deleteMutation.isPending} />
    </div>
  );
}

