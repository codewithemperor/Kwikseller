import Link from "next/link";
import { ArrowLeft, BarChart3, Boxes, PackageCheck, ShieldCheck } from "lucide-react";
import { GuestRoute } from "@/components/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestRoute redirectPath="/dashboard">
      <main className="min-h-screen bg-white text-foreground dark:bg-background">
        <div className="grid min-h-screen lg:grid-cols-[minmax(430px,0.95fr)_minmax(520px,1fr)]">
          <section className="hidden border-r border-border bg-[#071a2f] text-white lg:flex lg:flex-col">
            <div className="flex items-center justify-between px-10 py-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Vendor portal
              </Link>
              <span className="font-heading text-lg font-bold tracking-tight">KWIKSELLER</span>
            </div>

            <div className="flex flex-1 flex-col justify-center px-10 py-12">
              <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight">
                Run storefront, inventory, orders, and Pool offers from one vendor workspace.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
                The vendor side now leans into real commerce operations: physical stock, digital delivery, order fulfillment, and Pool participation.
              </p>

              <div className="mt-12 grid gap-3">
                {[
                  { icon: Boxes, title: "Inventory-first catalog", text: "Products can be physical or digital, with stock records behind checkout." },
                  { icon: PackageCheck, title: "Fulfillment tasks", text: "Orders surface what needs packing, digital release, or admin dispatch." },
                  { icon: BarChart3, title: "Real dashboard metrics", text: "Revenue, low stock, orders, and Pool earnings are designed for API data." },
                ].map((item) => (
                  <div key={item.title} className="border border-white/12 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <item.icon className="mt-0.5 h-5 w-5 text-orange-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-white/62">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 px-10 py-6">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <ShieldCheck className="h-4 w-4 text-orange-400" />
                Vendor access is protected with email verification.
              </div>
            </div>
          </section>

          <section className="flex min-h-screen flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Vendor portal
              </Link>
              <span className="font-heading text-base font-bold tracking-tight">KWIKSELLER</span>
            </div>

            <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
              <div className="w-full max-w-[500px]">{children}</div>
            </div>

            <p className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
              Copyright 2026 Kwikseller. All rights reserved.
            </p>
          </section>
        </div>
      </main>
    </GuestRoute>
  );
}
