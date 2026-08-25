"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { GuestRoute } from "@/components/auth/guest-route";
import {
  AUTH_SIDEBAR_FEATURES as authSidebarFeatures,
  AUTH_SIDEBAR_HEADING as authSidebarHeading,
} from "@/constants/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestRoute>
      <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
        <div className="grid h-dvh min-h-dvh lg:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1fr)]">
          <section className="hidden h-dvh min-h-dvh flex-col border-r border-neutral-200 bg-foreground text-background dark:border-white/10 lg:flex">
            <div className="flex items-center justify-between px-8 py-5">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Marketplace
              </Link>
              <Image src="/logo-full-dark.png" alt="Kwikseller" width={148} height={38} className="h-9 w-auto" priority />
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-8 py-6">
              <div className="max-w-xl">
                <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight">
                  {authSidebarHeading.heading}
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">
                  {authSidebarHeading.body}
                </p>
              </div>

              <div className="mt-6 grid gap-2">
                {authSidebarFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                  <div key={item.title} className="border border-white/12 bg-white/[0.03] p-3">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-kwik-orange" />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-white/62">{item.text}</p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 px-8 py-4">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <BadgeCheck className="h-4 w-4 text-kwik-orange" />
                {authSidebarHeading.footerNote}
              </div>
            </div>
          </section>

          <section className="flex h-dvh min-h-dvh flex-col overflow-y-auto">
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
