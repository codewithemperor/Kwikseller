import { Suspense } from "react";
import { RegisterPage as RegisterPageComponent } from "@/components/auth";
import { MARKETPLACE_REGISTER_PORTAL as marketplacePortal } from "@/constants/auth";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-kwik-orange border-t-transparent" />
        </div>
      }
    >
      <RegisterPageComponent portal={marketplacePortal} />
    </Suspense>
  );
}
