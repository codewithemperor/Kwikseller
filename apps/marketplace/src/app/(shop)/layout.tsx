import { Suspense, type ReactNode } from "react";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MarketplaceLayout>{children}</MarketplaceLayout>
    </Suspense>
  );
}
