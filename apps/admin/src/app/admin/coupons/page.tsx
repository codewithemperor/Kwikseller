"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import {
  PageHeader,
  DataTable,
  type Column,
  type RowAction,
  ConfirmDialog,
} from "@/components/ui";
import { couponsApi } from "@/lib/api";
import type { Coupon } from "@/lib/api";
import { formatRelativeTime, formatCurrency, copyToClipboard } from "@/lib/utils";

export default function CouponsPage() {
  const router = useRouter();
  const queryClient = useQueryClient(); const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const { data, isLoading, isRefetching, refetch } = useQuery({ queryKey: ["admin-coupons", page, search], queryFn: () => { const loadingId = toast("Loading coupons...", { isLoading: true, timeout: 0 }); return couponsApi.list({ page, limit: 10, search: search || undefined }).then((res) => { toast.close(loadingId); toast.success("Coupons loaded"); return res; }).catch((err) => { toast.close(loadingId); toast.danger("Failed to load coupons: " + (err?.message || "Unknown error")); throw err; }); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => couponsApi.delete(id), onSuccess: () => { toast.success("Coupon deleted"); queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); setDeleteTarget(null); }, onError: (error) => toast.danger("Failed to delete coupon: " + error.message) });
  const toggleMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => couponsApi.update(id, { isActive }), onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); }, onError: (error) => toast.danger("Failed to update coupon: " + error.message) });

  const columns: Column<Coupon>[] = [
    { key: "code", label: "Code", sortable: true, isRowHeader: true, render: (item) => (<div className="flex items-center gap-2"><code className="rounded bg-default-100 px-2 py-0.5 text-xs font-mono font-semibold">{item.code}</code><button onClick={() => { copyToClipboard(item.code).then((ok) => ok && toast.success("Copied!")); }} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button></div>) },
    { key: "discount", label: "Discount", render: (item) => (<span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{item.discountType === "PERCENTAGE" ? `${item.discountValue}%` : formatCurrency(item.discountValue)}</span>) },
    { key: "usage", label: "Usage", render: (item) => (<div className="text-sm"><span className="font-medium">{item.usedCount}</span>{item.maxUses && <span className="text-muted-foreground"> / {item.maxUses}</span>}</div>) },
    { key: "minOrder", label: "Min. Order", render: (item) => (<span className="text-sm text-muted-foreground">{item.minOrderAmount ? formatCurrency(item.minOrderAmount) : "None"}</span>) },
    { key: "status", label: "Status", render: (item) => (<button onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.isActive })} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground"}`}>{item.isActive ? "Active" : "Inactive"}</button>) },
    { key: "createdAt", label: "Created", sortable: true, render: (item) => (<span className="text-muted-foreground text-xs">{formatRelativeTime(item.createdAt)}</span>) },
  ];

  const rowActions: RowAction<Coupon>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      onPress: (item) => router.push(`/admin/coupons/${item.id}`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5 shrink-0 text-danger" />,
      variant: "danger",
      onPress: (item) => setDeleteTarget(item),
    },
  ];

  const coupons = (data as { data?: Coupon[] } | undefined)?.data ?? [];
  const totalItems = (data as unknown as { meta?: { total: number } })?.meta?.total ?? coupons.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Manage discount coupons" breadcrumbs={[{ label: "Coupons" }]} actions={<Link href="/admin/coupons/new" className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">Create Coupon</Link>} />
      <DataTable columns={columns} data={coupons} isLoading={isLoading} totalItems={totalItems} page={page} pageSize={10} onPageChange={setPage} onSearch={setSearch} searchPlaceholder="Search by code..." onRefresh={refetch} isRefetching={isRefetching} emptyMessage="No coupons found" emptyIcon={<Ticket className="h-8 w-8 text-muted-foreground/50" />} getRowId={(item) => item.id} rowActions={rowActions} />
      <ConfirmDialog isOpen={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete Coupon" message={`Delete coupon "${deleteTarget?.code}"?`} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} isLoading={deleteMutation.isPending} />
    </div>
  );
}

