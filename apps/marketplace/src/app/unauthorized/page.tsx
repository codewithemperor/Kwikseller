import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md border border-neutral-200 p-8 text-center dark:border-white/10">
        <ShieldAlert className="mx-auto h-10 w-10 text-kwik-orange" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-kwik-dark dark:text-white">
          This account cannot open that page
        </h1>
        <p className="mt-3 text-sm leading-6 text-kwik-muted dark:text-white/60">
          Sign in with the correct role or return to the marketplace.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="inline-flex h-10 items-center rounded-md bg-kwik-dark px-4 text-sm font-semibold text-white">
            Sign in
          </Link>
          <Link href="/" className="inline-flex h-10 items-center rounded-md border border-neutral-200 px-4 text-sm font-semibold text-kwik-dark dark:border-white/10 dark:text-white">
            Marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}
