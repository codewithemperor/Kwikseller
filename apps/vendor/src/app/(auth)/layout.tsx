"use client";

import { GuestRoute } from "@/components/auth";
import { BrandedAuthLayout } from "@kwikseller/ui";
import { BarChart3, Boxes, PackageCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestRoute redirectPath="/dashboard">
      <BrandedAuthLayout
        mobileLabel="Vendor portal"
        sidePanel={{
          eyebrow: "Vendor portal",
          backHref: "/",
          title:
            "Run storefront, inventory, orders, and Pool offers from one vendor workspace.",
          description:
            "The vendor portal is built for real commerce operations: physical stock, digital delivery, fulfillment, and Pool participation.",
          footer: "Vendor access is protected with email verification.",
          points: [
            {
              icon: Boxes,
              title: "Inventory-first catalog",
              text: "Products can be physical or digital, with stock records behind checkout.",
            },
            {
              icon: PackageCheck,
              title: "Fulfillment tasks",
              text: "Orders surface what needs packing, digital release, or admin dispatch.",
            },
            {
              icon: BarChart3,
              title: "Real dashboard metrics",
              text: "Revenue, low stock, orders, and Pool earnings are designed for API data.",
            },
          ],
        }}
      >
        {children}
      </BrandedAuthLayout>
    </GuestRoute>
  );
}
