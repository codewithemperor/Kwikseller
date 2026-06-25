"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function NewProductRedirectPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/dashboard/products/new/edit");
  }, [router]);

  return null;
}
