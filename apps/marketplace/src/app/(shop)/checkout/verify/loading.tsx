/**
 * loading.tsx — skeleton shown by Next.js while the verify page chunk loads.
 * Mirrors the centered card layout of the real page so the swap is invisible.
 */
import { ShieldCheck } from "lucide-react";

export default function CheckoutVerifyLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-xl">
        {/* Brand strip */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 shadow-sm ring-1 ring-gray-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full kwik-gradient text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span className="h-3 w-24 rounded-full bg-gray-200" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-lg">
          {/* Hero banner (gradient) */}
          <div className="kwik-gradient px-6 py-5 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-white/15" />
            <div className="mx-auto mt-3 h-7 w-48 rounded-full bg-white/30" />
            <div className="mx-auto mt-2 h-4 w-72 rounded-full bg-white/20" />
          </div>

          {/* Reference + provider strip */}
          <div className="grid grid-cols-1 gap-px bg-gray-100 sm:grid-cols-2">
            <div className="bg-surface px-5 py-3">
              <div className="h-2.5 w-16 rounded-full bg-gray-200" />
              <div className="mt-2 h-4 w-32 rounded-full bg-gray-200" />
            </div>
            <div className="bg-surface px-5 py-3">
              <div className="h-2.5 w-16 rounded-full bg-gray-200" />
              <div className="mt-2 h-4 w-24 rounded-full bg-gray-200" />
            </div>
          </div>

          {/* Body skeleton */}
          <div className="space-y-3 px-6 py-5">
            <div className="h-16 w-full rounded-xl bg-gray-100" />
            <div className="h-10 w-40 rounded-md bg-gray-100" />
          </div>
        </div>
      </div>
    </main>
  );
}
