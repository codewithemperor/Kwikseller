"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Switch, Spinner } from "@heroui/react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, ImageUpload } from "@/components/ui";
import { brandsApi } from "@/lib/api";
import { brandSchema, type BrandFormData } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export default function EditBrandPage() {
  const router = useRouter(); const params = useParams(); const queryClient = useQueryClient(); const id = params.id as string; const [logoUrl, setLogoUrl] = useState("");
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BrandFormData>({ resolver: zodResolver(brandSchema), defaultValues: { isActive: true } });
  const { data: brand, isLoading } = useQuery({ queryKey: ["admin-brand", id], queryFn: () => brandsApi.get(id).then((res) => res.data), enabled: !!id });
  useEffect(() => { if (brand) { const b = brand as unknown as Record<string, unknown>; reset({ name: b.name as string, description: (b.description as string) ?? undefined, isActive: (b.isActive as boolean) ?? true }); setLogoUrl((b.logoUrl as string) ?? ""); } }, [brand, reset]);

  const updateMutation = useMutation({ mutationFn: (data: BrandFormData) => brandsApi.update(id, { ...data, logoUrl: logoUrl || undefined }), onSuccess: () => { toast.success("Brand updated!"); queryClient.invalidateQueries({ queryKey: ["admin-brands"] }); router.push("/admin/brands"); }, onError: () => toast.error("Failed to update brand") });

  const i = "w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";
  const l = "block text-sm font-medium mb-1.5";

  if (isLoading) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" color="warning" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Edit Brand" description={`Editing: ${brand?.name ?? ""}`} breadcrumbs={[{ label: "Brands", href: "/admin/brands" }, { label: brand?.name ?? "Edit" }]} actions={<Link href="/admin/brands" className="inline-flex h-8 items-center gap-1 rounded-lg border border-default-200 px-3 text-sm hover:bg-default-50"><ArrowLeft className="h-4 w-4" />Back</Link>} />
      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        <div className="rounded-xl border border-default-200 bg-background p-4 lg:p-6 space-y-4">
          <div><label className={l}>Brand Name *</label><input {...register("name")} className={i} placeholder="Enter brand name" />{errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}</div>
          <div><label className={l}>Description</label><textarea {...register("description")} className={cn(i, "min-h-[60px] resize-y")} rows={2} /></div>
          <div><label className={l}>Brand Logo</label><ImageUpload images={logoUrl ? [logoUrl] : []} onChange={(urls) => setLogoUrl(urls[0] ?? "")} maxImages={1} /></div>
          <label className="flex items-center gap-3 cursor-pointer"><Switch isSelected={watch("isActive")} onChange={(val) => setValue("isActive", val)} size="sm" /><span className="text-sm">Active</span></label>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Link href="/admin/brands" className="h-9 rounded-lg border border-default-200 px-4 text-sm hover:bg-default-50 inline-flex items-center">Cancel</Link>
          <button type="submit" disabled={updateMutation.isPending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">{updateMutation.isPending ? <Spinner size="sm" color="current" /> : <Save className="h-4 w-4" />}Update Brand</button>
        </div>
      </form>
    </div>
  );
}
