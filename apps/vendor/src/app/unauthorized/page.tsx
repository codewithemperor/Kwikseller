import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-background">
      <section className="w-full max-w-md border border-border p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
          Vendor access required
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign in with a vendor account to open this workspace.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Sign in
          </Link>
          <Link href="/register" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground">
            Register
          </Link>
        </div>
      </section>
    </main>
  );
}
