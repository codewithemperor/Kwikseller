"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Spinner } from "@heroui/react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { PageHeader } from "@/components/ui";
import { dealsApi } from "@/lib/api";
import { dealSchema, type DealFormData } from "@/lib/schemas";

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      discountType: "PERCENTAGE",
      productIds: [],
      categoryIds: [],
    },
  });

  const { data: deal, isLoading } = useQuery({
    queryKey: ["admin-deal", id],
    queryFn: () => dealsApi.get(id).then((res) => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (deal) {
      const d = deal as unknown as Record<string, unknown>;
      reset({
        title: d.title as string,
        description: (d.description as string) ?? undefined,
        discountType:
          (d.discountType as "PERCENTAGE" | "FIXED") ?? "PERCENTAGE",
        discountValue: d.discountValue as number,
        startDate: d.startDate as string,
        endDate: d.endDate as string,
        productIds: (d.productIds as string[]) ?? [],
        categoryIds: (d.categoryIds as string[]) ?? [],
      });
    }
  }, [deal, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: DealFormData) => dealsApi.update(id, data),
    onSuccess: () => {
      toast.success("Deal updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
      router.push("/admin/deals");
    },
    onError: (error) => toast.danger("Failed to update deal: " + error.message),
  });

  const i =
    "w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";
  const l = "block text-sm font-medium mb-1.5";
  const e = "text-xs text-danger mt-1";

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" color="warning" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Edit Deal"
        description={`Editing: ${deal?.title ?? ""}`}
        breadcrumbs={[
          { label: "Deals", href: "/admin/deals" },
          { label: deal?.title ?? "Edit" },
        ]}
        actions={
          <Link
            href="/admin/deals"
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
            <label className={l}>Deal Title *</label>
            <input
              {...register("title")}
              className={i}
              placeholder="e.g., Summer Sale"
            />
            {errors.title && <p className={e}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={l}>Description</label>
            <textarea
              {...register("description")}
              className="min-h-[60px] resize-y rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={l}>Discount Type *</label>
              <select {...register("discountType")} className={i}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₦)</option>
              </select>
              {errors.discountType && (
                <p className={e}>{errors.discountType.message}</p>
              )}
            </div>
            <div>
              <label className={l}>Discount Value *</label>
              <input
                {...register("discountValue", { valueAsNumber: true })}
                type="number"
                className={i}
                placeholder="0"
              />
              {errors.discountValue && (
                <p className={e}>{errors.discountValue.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={l}>Start Date *</label>
              <input
                {...register("startDate")}
                className={i}
                type="date"
              />
              {errors.startDate && (
                <p className={e}>{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className={l}>End Date *</label>
              <input {...register("endDate")} className={i} type="date" />
              {errors.endDate && (
                <p className={e}>{errors.endDate.message}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Deal status is automatically determined by schedule dates.
          </p>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/admin/deals"
            className="h-9 rounded-lg border border-default-200 px-4 text-sm hover:bg-default-50 inline-flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {isSubmitting || updateMutation.isPending ? (
              <Spinner size="sm" color="current" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Update Deal
          </button>
        </div>
      </form>
    </div>
  );
}
