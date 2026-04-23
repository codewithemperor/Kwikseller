"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Spinner } from "@heroui/react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui";
import { couponsApi } from "@/lib/api";
import { couponSchema, type CouponFormData } from "@/lib/schemas";

export default function NewCouponPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: { discountType: "PERCENTAGE", discountValue: 0, code: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: CouponFormData) => couponsApi.create(data),
    onSuccess: () => {
      toast.success("Coupon created!");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      router.push("/admin/coupons");
    },
    onError: () => toast.error("Failed to create coupon"),
  });

  const i =
    "w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";
  const l = "block text-sm font-medium mb-1.5";
  const e = "text-xs text-danger mt-1";

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="New Coupon"
        description="Create a new discount coupon"
        breadcrumbs={[
          { label: "Coupons", href: "/admin/coupons" },
          { label: "New Coupon" },
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
        onSubmit={handleSubmit((d) => createMutation.mutate(d))}
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
              <p className="text-xs text-muted-foreground mt-1">
                Minimum order value required
              </p>
            </div>
            <div>
              <label className={l}>Max Uses</label>
              <input
                {...register("maxUses", { valueAsNumber: true })}
                type="number"
                className={i}
                placeholder="Unlimited"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for unlimited
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={l}>Start Date</label>
              <input
                {...register("startDate")}
                className={i}
                type="date"
              />
            </div>
            <div>
              <label className={l}>End Date</label>
              <input {...register("endDate")} className={i} type="date" />
            </div>
          </div>
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
            disabled={isSubmitting || createMutation.isPending}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {isSubmitting || createMutation.isPending ? (
              <Spinner size="sm" color="current" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create Coupon
          </button>
        </div>
      </form>
    </div>
  );
}
