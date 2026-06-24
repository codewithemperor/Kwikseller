import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AppButton, EmptyState } from "@kwikseller/ui";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-kwik-border bg-surface shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <ShieldAlert className="h-8 w-8 text-danger" />
            </div>
            <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">
              Vendor access required
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              You need to sign in with a vendor account to open this workspace.
              If you believe this is a mistake, contact support.
            </p>
            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <AppButton
                variant="primary"
                size="md"
                fullWidth
                className="sm:w-auto"
              >
                <Link href="/login" className="inline-flex h-full w-full items-center justify-center">
                  Sign in
                </Link>
              </AppButton>
              <AppButton
                variant="secondary"
                size="md"
                fullWidth
                className="sm:w-auto"
              >
                <Link href="/register" className="inline-flex h-full w-full items-center justify-center">
                  Register
                </Link>
              </AppButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
