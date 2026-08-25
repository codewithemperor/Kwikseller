import { Suspense, type ReactNode } from "react";
import { AccountLayout } from "@/components/layout/account-layout";

export default function AccountRouteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AccountLayout>{children}</AccountLayout>
    </Suspense>
  );
}
