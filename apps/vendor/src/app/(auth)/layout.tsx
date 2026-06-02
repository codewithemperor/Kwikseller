"use client";

import { GuestRoute } from "@/components/auth";
import { BrandedAuthLayout } from "@kwikseller/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestRoute redirectPath="/dashboard">
      <BrandedAuthLayout
        mobileLabel="Vendor portal"
        showMobileHeader={false}
        formClassName="max-w-[480px]"
      >
        {children}
      </BrandedAuthLayout>
    </GuestRoute>
  );
}
