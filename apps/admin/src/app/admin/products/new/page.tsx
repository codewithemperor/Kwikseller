"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Switch, Spinner } from "@heroui/react";
import { Save, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, ImageUpload } from "@/components/ui";
import { adminProductsApi, categoriesApi, brandsApi } from "@/lib/api";
import { productSchema, type ProductFormData } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export default function NewProductPage() {
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "DRAFT",
      isFeatured: false,
      tags: [],
      images: [],
      stock: 0,
      price: 0,
    },
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: () => categoriesApi.list().then((res) => res.data),
  });

  const { data: brandsRes } = useQuery({
    queryKey: ["admin-brands-select"],
    queryFn: () => brandsApi.list().then((res) => res.data),
  });

  const categories = (Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes as unknown as { data?: unknown[] })?.data ?? []) as { id: string; name: string }[];
  const brands = (Array.isArray(brandsRes) ? brandsRes : (brandsRes as unknown as { data?: unknown[] })?.data ?? []) as { id: string; name: string }[];

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      adminProductsApi.create({ ...data, tags, images }),
    onSuccess: () => {
      toast.success("Product created successfully!");
      router.push("/admin/products");
    },
    onError: () => toast.error("Failed to create product"),
  });

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const onSubmit = (data: ProductFormData) => createMutation.mutate(data);

  const inputCls = "w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50";
  const labelCls = "block text-sm font-medium mb-1.5";
  const errorCls = "text-xs text-danger mt-1";

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="New Product"
        description="Add a new product to your catalog"
        breadcrumbs={[{ label: "Products", href: "/admin/products" }, { label: "New Product" }]}
        actions={<Link href="/admin/products" className="inline-flex h-8 items-center gap-1 rounded-lg border border-default-200 px-3 text-sm hover:bg-default-50"><ArrowLeft className="h-4 w-4" />Back</Link>}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl border border-default-200 bg-background p-4 lg:p-6 space-y-4">
          <h3 className="font-heading font-semibold text-lg">Basic Information</h3>
          <div><label className={labelCls}>Product Name *</label><input {...register("name")} className={inputCls} placeholder="Enter product name" />{errors.name && <p className={errorCls}>{errors.name.message}</p>}</div>
          <div><label className={labelCls}>Description</label><textarea {...register("description")} className={cn(inputCls, "min-h-[80px] resize-y")} placeholder="Enter product description" rows={3} /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className={labelCls}>Price (₦) *</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span><input {...register("price", { valueAsNumber: true })} type="number" className={cn(inputCls, "pl-7")} placeholder="0" /></div>{errors.price && <p className={errorCls}>{errors.price.message}</p>}</div>
            <div><label className={labelCls}>Compare Price (₦)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span><input {...register("comparePrice", { valueAsNumber: true })} type="number" className={cn(inputCls, "pl-7")} placeholder="0" /></div></div>
            <div><label className={labelCls}>SKU</label><input {...register("sku")} className={inputCls} placeholder="e.g., PROD-001" /></div>
          </div>
          <div className="max-w-xs"><label className={labelCls}>Stock Quantity *</label><input {...register("stock", { valueAsNumber: true })} type="number" className={inputCls} placeholder="0" />{errors.stock && <p className={errorCls}>{errors.stock.message}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Category</label><select {...register("categoryId")} className={inputCls}><option value="">Select category</option>{categories.map((cat: { id: string; name: string }) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
            <div><label className={labelCls}>Brand</label><select {...register("brandId")} className={inputCls}><option value="">Select brand</option>{brands.map((brand: { id: string; name: string }) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-default-200 bg-background p-4 lg:p-6 space-y-4">
          <h3 className="font-heading font-semibold text-lg">Status & Visibility</h3>
          <div><label className={labelCls}>Status</label><select {...register("status")} className={inputCls}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></div>
          <label className="flex items-center gap-3 cursor-pointer"><Switch isSelected={watch("isFeatured")} onChange={(val) => setValue("isFeatured", val)} size="sm" /><span className="text-sm">Featured Product</span></label>
        </div>

        {/* Images */}
        <div className="rounded-xl border border-default-200 bg-background p-4 lg:p-6 space-y-4">
          <h3 className="font-heading font-semibold text-lg">Product Images</h3>
          <ImageUpload images={images} onChange={setImages} maxImages={8} />
        </div>

        {/* Tags */}
        <div className="rounded-xl border border-default-200 bg-background p-4 lg:p-6 space-y-4">
          <h3 className="font-heading font-semibold text-lg">Tags</h3>
          <div className="flex items-center gap-2">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag..." className={cn(inputCls, "max-w-xs")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
            <button type="button" onClick={addTag} className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent hover:bg-accent/20"><Plus className="h-4 w-4" /></button>
          </div>
          {tags.length > 0 && <div className="flex flex-wrap gap-2">{tags.map((tag) => (<span key={tag} className="inline-flex items-center gap-1 rounded-full bg-default-100 px-2.5 py-1 text-xs">{tag}<button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-danger">×</button></span>))}</div>}
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/admin/products" className="h-9 rounded-lg border border-default-200 px-4 text-sm hover:bg-default-50 inline-flex items-center">Cancel</Link>
          <button type="submit" disabled={isSubmitting || createMutation.isPending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
            {isSubmitting || createMutation.isPending ? <Spinner size="sm" color="current" /> : <Save className="h-4 w-4" />}
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}
