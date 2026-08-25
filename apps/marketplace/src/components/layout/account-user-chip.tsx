"use client";

import React, { useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AccountUserChip({ clickable = true }: { clickable?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const displayName =
    user?.profile?.firstName ||
    (user?.email ? user.email.split("@")[0] : "Guest");
  const initials = React.useMemo(() => {
    const first = user?.profile?.firstName?.[0] ?? "";
    const last = user?.profile?.lastName?.[0] ?? "";
    if (first || last) return (first + last).toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "G";
  }, [user]);

  const content = (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-kwik-gradient text-sm font-bold text-white ring-2 ring-white/40">
        {mounted && isAuthenticated && user?.profile?.avatarUrl ? (
          <Image
            src={user.profile.avatarUrl}
            alt={displayName}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="max-w-[140px] truncate text-sm font-semibold text-kwik-dark">
          {displayName}
        </span>
        <span className="text-[11px] text-kwik-muted">
          {mounted && isAuthenticated ? "Account" : "Browse as guest"}
        </span>
      </span>
    </span>
  );

  if (!clickable) return content;

  return (
    <button
      type="button"
      onClick={() => router.push("/profile")}
      className="flex min-h-[44px] items-center rounded-full px-2 py-1 transition-colors hover:bg-kwik-bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      aria-label={`View account profile for ${displayName}`}
    >
      {content}
    </button>
  );
}
