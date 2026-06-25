"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Package, Waves, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VendorMobileNavProps {
  onMore: () => void;
}

interface MobileTab {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const tabs: MobileTab[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Pool", href: "/dashboard/pool", icon: Waves },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * VendorMobileNav - A polished mobile bottom navigation bar matching the
 * marketplace's MobileBottomNav pattern (framer-motion layoutId indicator +
 * staggered entrance). Fixed to the bottom on small screens only.
 */
export function VendorMobileNav(_props: VendorMobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-kwik-border bg-background/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      {tabs.map((tab, index) => {
        const active = isNavActive(pathname, tab.href);
        return (
          <motion.div
            key={tab.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-1 items-center justify-center"
          >
            <Link
              href={tab.href}
              className="flex w-full flex-col items-center justify-center gap-1 py-1.5"
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="vendor-mobile-nav-active"
                    className="absolute inset-x-0 -bottom-1 mx-auto h-0.5 w-6 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <tab.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-accent" : "text-muted-foreground",
                  )}
                  strokeWidth={active ? 2.25 : 1.5}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                {tab.label}
              </span>
            </Link>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: tabs.length * 0.05, type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-1 items-center justify-center"
      >
        <Link
          href="/dashboard/profile"
          className="flex w-full flex-col items-center justify-center gap-1 py-1.5"
          aria-label="Open profile"
        >
          <span className="flex h-7 w-7 items-center justify-center">
            <UserRound className={cn("h-5 w-5", isNavActive(pathname, "/dashboard/profile") ? "text-accent" : "text-muted-foreground")} strokeWidth={1.5} />
          </span>
          <span className={cn("text-[10px] font-medium", isNavActive(pathname, "/dashboard/profile") ? "text-accent" : "text-muted-foreground")}>Profile</span>
        </Link>
      </motion.div>
    </nav>
  );
}

export default VendorMobileNav;
