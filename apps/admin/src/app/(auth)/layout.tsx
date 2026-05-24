"use client";

import { AdminGuestRoute } from "@/components/auth";
import { BrandedAuthLayout } from "@kwikseller/ui";
import { BarChart3, ShieldCheck, UsersRound } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuestRoute redirectPath="/admin">
      <BrandedAuthLayout
        mobileLabel="Admin portal"
        sidePanel={{
          eyebrow: "Admin portal",
          backHref: "/",
          title:
            "One admin workspace for platform operations, permissions, and growth.",
          description:
            "Super Admins and every admin role sign in through the same Kwikseller admin page. Permissions decide what each team member can manage after login.",
          footer: "Admin access is protected with email verification and role permissions.",
          points: [
            {
              icon: ShieldCheck,
              title: "Role-based access",
              text: "Super Admin, finance, operations, support, marketing, content, logistics, catalog, and audit users share one login.",
            },
            {
              icon: UsersRound,
              title: "Admin user control",
              text: "Super Admin can review admins, assign roles, update permissions, and deactivate access.",
            },
            {
              icon: BarChart3,
              title: "Operational dashboard",
              text: "Products, vendors, orders, payments, promotions, and delivery tools stay permission-aware.",
            },
          ],
        }}
      >
        {children}
      </BrandedAuthLayout>
    </AdminGuestRoute>
  );
}
