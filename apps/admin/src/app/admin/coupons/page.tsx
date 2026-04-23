"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { MoreVertical, Edit, Trash2, Ticket, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DataTable, type Column, ConfirmDialog } from "@/components/ui";
import { couponsApi } from "@/lib/api";
import type { Coupon } from "@/lib/api";
import { formatRelativeTime, formatCurrency, copyToClipboard } from "@kwikseller/utils";

export default function CouponsPage() {
  const queryClient = useQueryClient(); const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const { data, isLoading, isRefetching, refetch } = useQuery({ queryKey: ["admin-coupons", page, search], queryFn: () => couponsApi.list({ page, limit: 10, search: search || undefined }).then((res) => res.data) });
  const deleteMutation = useMutation({ mutationFn: (id: string) => couponsApi.delete(id), onSuccess: () => { toast.success("Coupon deleted"); queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); setDeleteTarget(null); }, onError: () => toast.error("Failed to delete") });
  const toggleMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => couponsApi.update(id, { isActive }), onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); } });

  const columns: Column<Coupon>[] = [
    { key: "code", label: "Code", sortable: true, render: (item) => (<div className="flex items-center gap-2"><code className="rounded bg-default-100 px-2 py-0.5 text-xs font-mono font-semibold">{item.code}</code><button onClick={() => { copyToClipboard(item.code).then((ok) => ok && toast.success("Copied!")); }} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button></div>) },
    { key: "discount", label: "Discount", render: (item) => (<span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{item.discountType === "PERCENTAGE" ? `${item.discountValue}%` : formatCurrency(item.discountValue)}</span>) },
    { key: "usage", label: "Usage", render: (item) => (<div className="text-sm"><span className="font-medium">{item.usedCount}</span>{item.maxUses && <span className="text-muted-foreground"> / {item.maxUses}</span>}</div>) },
    { key: "minOrder", label: "Min. Order", render: (item) => (<span className="text-sm text-muted-foreground">{item.minOrderAmount ? formatCurrency(item.minOrderAmount) : "None"}</span>) },
    { key: "status", label: "Status", render: (item) => (<button onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.isActive })} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? "bg-success/10 text-success" : "bg-default-100 text-muted-foreground"}`}>{item.isActive ? "Active" : "Inactive"}</button>) },
    { key: "createdAt", label: "Created", sortable: true, render: (item) => (<span className="text-muted-foreground text-xs">{formatRelativeTime(item.createdAt)}</span>) },
  ];

  const coupons = Array.isArray(data) ? data : (data as unknown as { data?: Coupon[] })?.data ?? [];
  const totalItems = (data as unknown as { meta?: { total: number } })?.meta?.total ?? coupons.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Manage discount coupons" breadcrumbs={[{ label: "Coupons" }]} actions={<Link href="/admin/coupons/new" className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">Create Coupon</Link>} />
      <DataTable columns={columns} data={coupons} isLoading={isLoading} totalItems={totalItems} page={page} pageSize={10} onPageChange={setPage} onSearch={setSearch} searchPlaceholder="Search by code..." onRefresh={refetch} isRefetching={isRefetching} emptyMessage="No coupons found" emptyIcon={<Ticket className="h-8 w-8 text-muted-foreground/50" />} getRowId={(item) => item.id} actions={(item) => (<Dropdown><DropdownTrigger><button className="flex h-7 w-7 items-center justify-center rounded-md text-default-400 hover:bg-default-100"><MoreVertical className="h-4 w-4" /></button></DropdownTrigger><DropdownMenu><DropdownItem href={`/admin/coupons/${item.id}`}>Edit</DropdownItem><DropdownItem className="text-danger" onClick={() => setDeleteTarget(item)}>Delete</DropdownItem></DropdownMenu></Dropdown>)} />
      <ConfirmDialog isOpen={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete Coupon" message={`Delete coupon "${deleteTarget?.code}"?`} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} isLoading={deleteMutation.isPending} />
    </div>
  );
}
