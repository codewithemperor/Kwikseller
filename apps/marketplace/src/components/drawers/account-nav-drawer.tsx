"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LogOut, X } from "lucide-react";
import { AccountNavLinks, type AccountNavLink } from "@/components/layout/account-navigation";

interface AccountDrawerContentProps {
  onClose: () => void;
  onLogout: () => void;
  pathname: string;
  cartCount: number;
  wishlistCount: number;
  links: AccountNavLink[];
  userChip: ReactNode;
}

export function AccountDrawerContent({
  onClose,
  onLogout,
  pathname,
  cartCount,
  wishlistCount,
  links,
  userChip,
}: AccountDrawerContentProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex h-16 items-center justify-between border-b border-kwik-border px-4">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2"
          aria-label="Back to Kwikseller shop"
        >
          <Image
            src="/icon.png"
            alt="Kwikseller logo"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span className="text-base font-bold text-kwik-dark">Kwikseller</span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-kwik-muted transition-colors hover:bg-kwik-bg-surface hover:text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-kwik-border px-4 py-4">
        {userChip}
      </div>

      <div className="flex-1 p-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
          Account
        </p>
        <AccountNavLinks
          pathname={pathname}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          links={links}
          onNavigate={onClose}
        />

        <div className="my-4 h-px bg-kwik-border-light" />

        <Link
          href="/"
          onClick={onClose}
          className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-kwik-muted transition-colors hover:bg-kwik-bg-surface hover:text-kwik-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange"
        >
          <ArrowLeft className="h-5 w-5 text-kwik-gray-light" />
          <span>Back to Shop</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-kwik-red transition-colors hover:bg-kwik-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-red"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
