"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Layers3, ShieldCheck, Truck } from "lucide-react";
import { GuestRoute } from "@/components/auth/guest-route";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestRoute>
      <main className="min-h-screen bg-white text-kwik-dark dark:bg-[#07111f] dark:text-white">
        <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1fr)]">
          <section className="hidden border-r border-neutral-200 bg-[#061a32] text-white dark:border-white/10 lg:flex lg:flex-col">
            <div className="flex items-center justify-between px-10 py-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Marketplace
              </Link>
              <Image src="/logo-full.png" alt="Kwikseller" width={148} height={38} className="h-9 w-auto" priority />
            </div>

            <div className="flex flex-1 flex-col justify-center px-10 py-12">
              <div className="max-w-xl">
                <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight">
                  Shop vendor stock, Pool resale, and digital products from one checkout.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
                  Kwikseller now validates inventory, delivery eligibility, digital fulfillment, and payment before every order moves to operations.
                </p>
              </div>

              <div className="mt-12 grid gap-3">
                {[
                  { icon: Layers3, title: "Pool-aware cart", text: "Vendor stock, Pool resale, and group-buy discovery stay clearly separated." },
                  { icon: Truck, title: "Manual dispatch ready", text: "State and local government rates feed admin delivery assignment." },
                  { icon: ShieldCheck, title: "Secure checkout", text: "Paystack checkout is backed by server-side totals and validation." },
                ].map((item) => (
                  <div key={item.title} className="border border-white/12 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <item.icon className="mt-0.5 h-5 w-5 text-kwik-orange" />
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
                <BadgeCheck className="h-4 w-4 text-kwik-orange" />
                Buyer accounts are protected with email verification.
              </div>
            </div>
          </section>

          <section className="flex min-h-screen flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-white/10 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-kwik-muted dark:text-white/70">
                <ArrowLeft className="h-4 w-4" />
                Marketplace
              </Link>
              <Image src="/logo-full-dark.png" alt="Kwikseller" width={142} height={36} className="h-8 w-auto dark:hidden" priority />
              <Image src="/logo-full.png" alt="Kwikseller" width={142} height={36} className="hidden h-8 w-auto dark:block" priority />
            </div>

            <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
              <div className="w-full max-w-[480px]">{children}</div>
            </div>
          </section>
        </div>
      </main>
    </GuestRoute>
  );
}
