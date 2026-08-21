"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav link type ──────────────────────────────────────────────────────────

export type AccountNavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Exact pathname match for active-state highlighting. */
  match: (pathname: string) => boolean;
};

// ─── Shared nav links renderer ───────────────────────────────────────────

function NavLinks({
  pathname,
  cartCount,
  wishlistCount,
  links,
  onNavigate,
}: {
  pathname: string;
  cartCount: number;
  wishlistCount: number;
  links: AccountNavLink[];
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Account" className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.match(pathname);
        const badge =
          link.href === "/cart"
            ? cartCount
            : link.href === "/wishlist"
              ? wishlistCount
              : 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kwik-orange focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? "bg-kwik-orange/10 text-kwik-orange"
                : "text-kwik-muted hover:bg-kwik-bg-surface hover:text-kwik-dark",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-kwik-orange" : "text-kwik-gray-light group-hover:text-kwik-dark",
              )}
            />
            <span className="flex-1">{link.label}</span>
            {badge > 0 && (
              <span
                aria-label={`${badge} item${badge > 1 ? "s" : ""}`}
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-kwik-orange px-1.5 text-[10px] font-bold text-white"
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Drawer component ──────────────────────────────────────────────────────

interface AccountNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  pathname: string;
  cartCount: number;
  wishlistCount: number;
  links: AccountNavLink[];
  userChip: React.ReactNode;
}

export function AccountNavDrawer({
  isOpen,
  onClose,
  onLogout,
  pathname,
  cartCount,
  wishlistCount,
  links,
  userChip,
}: AccountNavDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            id="account-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Account navigation"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-kwik-border bg-background shadow-2xl lg:hidden"
          >
            {/* Drawer header */}
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

            {/* Drawer user chip */}
            <div className="border-b border-kwik-border px-4 py-4">
              {userChip}
            </div>

            {/* Drawer nav */}
            <div className="flex-1 p-4">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-kwik-gray-light">
                Account
              </p>
              <NavLinks
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
