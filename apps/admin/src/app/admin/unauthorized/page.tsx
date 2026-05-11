import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AdminUnauthorizedPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <section className="w-full max-w-md border border-border bg-background p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-danger" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
          Admin permission required
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account does not have permission to open this admin area.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground">
            Sign in
          </Link>
          <Link href="/admin" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
