"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@heroui/react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { PageHeader, ImageUpload, type ImageUploadValue } from "@/components/ui";
import { bannersApi } from "@/lib/api";
import { bannerSchema, type BannerFormData } from "@/lib/schemas";
import { rollbackUploadedImages, uploadQueuedImages } from "@/lib/uploads";

const positions = [
  { key: "HOME_HERO", label: "Home Hero" },
  { key: "HOME_SIDEBAR", label: "Home Sidebar" },
  { key: "CATEGORY_TOP", label: "Category Top" },
  { key: "PRODUCT_PAGE", label: "Product Page" },
];

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [images, setImages] = useState<ImageUploadValue[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { position: "HOME_HERO", isActive: true, imageUrl: "" },
  });

  const { data: banner, isLoading } = useQuery({
    queryKey: ["admin-banner", id],
    queryFn: () => bannersApi.get(id).then((res) => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (banner) {
      const b = banner as unknown as Record<string, unknown>;
      reset({
        title: b.title as string,
        linkUrl: (b.linkUrl as string) ?? undefined,
        position:
          (b.position as BannerFormData["position"]) ?? "HOME_HERO",
        imageUrl: (b.imageUrl as string) ?? "",
        isActive: (b.isActive as boolean) ?? true,
        startDate: (b.startDate as string) ?? undefined,
        endDate: (b.endDate as string) ?? undefined,
      });
      setImages((b.imageUrl ? [{ id: b.imageUrl as string, url: b.imageUrl as string }] : []) as ImageUploadValue[]);
    }
  }, [banner, reset]);

  useEffect(() => {
    setValue("imageUrl", images[0]?.url ?? "");
  }, [images, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      const { urls, uploadedAssets } = await uploadQueuedImages(images, "banner");
      try {
        return await bannersApi.update(id, {
          ...data,
          imageUrl: urls[0] || data.imageUrl,
        });
      } catch (error) {
        await rollbackUploadedImages(uploadedAssets);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Banner updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      router.push("/admin/banners");
    },
    onError: (error) => toast.danger("Failed to update banner: " + error.message),
  });

  const i =
    "w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";
  const l = "block text-sm font-medium mb-1.5";

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" color="warning" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Edit Banner"
        description={`Editing: ${banner?.title ?? ""}`}
        breadcrumbs={[
          { label: "Banners", href: "/admin/banners" },
          { label: banner?.title ?? "Edit" },
        ]}
        actions={
          <Link
            href="/admin/banners"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-default-200 px-3 text-sm hover:bg-default-50"
          >
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
        }
      />
      <form
        onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
        className="space-y-6"
      >
        <div className="rounded-xl border border-default-200 bg-background p-4 lg:p-6 space-y-4">
          <div>
            <label className={l}>Banner Title *</label>
            <input
              {...register("title")}
              className={i}
              placeholder="Enter banner title"
            />
            {errors.title && (
              <p className="text-xs text-danger mt-1">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className={l}>Link URL</label>
            <input
              {...register("linkUrl")}
              className={i}
              placeholder="https://example.com (optional)"
              type="url"
            />
          </div>
          <div>
            <label className={l}>Position *</label>
            <select {...register("position")} className={i}>
              {positions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={l}>Banner Image *</label>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={1}
            />
            {errors.imageUrl && (
              <p className="text-xs text-danger mt-1">{errors.imageUrl.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={l}>Start Date</label>
              <input {...register("startDate")} className={i} type="date" />
            </div>
            <div>
              <label className={l}>End Date</label>
              <input {...register("endDate")} className={i} type="date" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={watch("isActive")}
              onChange={(e) => setValue("isActive", e.target.checked)}
              className="h-4 w-4 rounded border border-default-300 accent-[var(--accent)]"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/admin/banners"
            className="h-9 rounded-lg border border-default-200 px-4 text-sm hover:bg-default-50 inline-flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Spinner size="sm" color="current" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Update Banner
          </button>
        </div>
      </form>
    </div>
  );
}
