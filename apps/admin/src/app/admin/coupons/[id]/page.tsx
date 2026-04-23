"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Spinner } from "@heroui/react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui";
import { couponsApi } from "@/lib/api";
import { couponSchema, type CouponFormData } from "@/lib/schemas";

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: { discountType: "PERCENTAGE", discountValue: 0, code: "" },
  });

  const { data: coupon, isLoading } = useQuery({
    queryKey: ["admin-coupon", id],
    queryFn: () => couponsApi.get(id).then((res) => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (coupon) {
      const c = coupon as unknown as Record<string, unknown>;
      reset({
        code: c.code as string,
        description: (c.description as string) ?? undefined,
        discountType:
          (c.discountType as "PERCENTAGE" | "FIXED") ?? "PERCENTAGE",
        discountValue: c.discountValue as number,
        minOrderAmount: (c.minOrderAmount as number) ?? undefined,
        maxUses: (c.maxUses as number) ?? undefined,
        startDate: (c.startDate as string) ?? undefined,
        endDate: (c.endDate as string) ?? undefined,
      });
    }
  }, [coupon, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: CouponFormData) => couponsApi.update(id, data),
    onSuccess: () => {
      toast.success("Coupon updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      router.push("/admin/coupons");
    },
    onError: () => toast.error("Failed to update coupon"),
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
        title="Edit Coupon"
        description={`Editing: ${coupon?.code ?? ""}`}
        breadcrumbs={[
          { label: "Coupons", href: "/admin/coupons" },
          { label: coupon?.code ?? "Edit" },
        ]}
        actions={
          <Link
            href="/admin/coupons"
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
            <label className={l}>Coupon Code *</label>
            <input
              {...register("code")}
              className={`${i} uppercase font-mono`}
              placeholder="e.g., SUMMER2024"
            />
            {errors.code && <p className={e}>{errors.code.message}</p>}
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
              <label className={l}>Min. Order Amount (₦)</label>
              <input
                {...register("minOrderAmount", { valueAsNumber: true })}
                type="number"
                className={i}
                placeholder="0"
              />
            </div>
            <div>
              <label className={l}>Max Uses</label>
              <input
                {...register("maxUses", { valueAsNumber: true })}
                type="number"
                className={i}
                placeholder="Unlimited"
              />
            </div>
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
          <p className="text-xs text-muted-foreground">
            Toggle status from the coupons list.
          </p>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/admin/coupons"
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
            Update Coupon
          </button>
        </div>
      </form>
    </div>
  );
}
