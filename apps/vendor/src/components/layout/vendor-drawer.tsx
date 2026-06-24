"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Waves,
  Store,
  BarChart3,
  Wallet,
  CreditCard,
  Truck,
  MessageSquare,
  Bell,
  UserRound,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface VendorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  storeSlug?: string;
  storeLogoUrl?: string;
  badgeCounts?: {
    orders?: number;
    products?: number;
    lowStock?: number;
    deliveries?: number;
    messages?: number;
    notifications?: number;
  };
  onLogout: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: keyof NonNullable<VendorDrawerProps["badgeCounts"]>;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    heading: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Products", href: "/dashboard/products", icon: Package, badgeKey: "products" },
      { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart, badgeKey: "orders" },
      { label: "Pool Sourcing", href: "/dashboard/pool", icon: Waves },
      { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, badgeKey: "lowStock" },
    ],
  },
  {
    heading: "Finance",
    items: [
      { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
    ],
  },
  {
    heading: "Store",
    items: [
      { label: "Storefront", href: "/dashboard/storefront", icon: Store },
      { label: "Profile", href: "/dashboard/profile", icon: UserRound },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "KYC", href: "/dashboard/kyc", icon: ShieldCheck },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badgeKey: "messages" },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell, badgeKey: "notifications" },
      { label: "Deliveries", href: "/dashboard/deliveries", icon: Truck, badgeKey: "deliveries" },
      { label: "Help", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

export function VendorDrawer({
  isOpen,
  onClose,
  vendorName,
  storeSlug,
  storeLogoUrl,
  badgeCounts,
  onLogout,
}: VendorDrawerProps) {
  const pathname = usePathname();

  // Close drawer on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Vendor info header */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent">
            {storeLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeLogoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">{getInitials(vendorName)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{vendorName}</p>
            {storeSlug && (
              <p className="truncate text-xs text-muted-foreground">{storeSlug}.kwik.com</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-default-100 hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-kwik-border" />

        {/* Navigation */}
        <motion.nav
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="px-2 pb-4 pt-2"
        >
          {navGroups.map((group) => (
            <div key={group.heading} className="mb-2">
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {group.heading}
              </p>
              <div className="grid gap-0.5">
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  const badge = item.badgeKey ? badgeCounts?.[item.badgeKey] : undefined;

                  return (
                    <motion.div key={item.href} variants={itemVariants}>
                      <Link
                        href={item.href}
                        onClick={() => onClose()}
                        className={cn(
                          "flat-button relative flex h-11 items-center gap-3 rounded-lg pl-4 pr-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-accent/10 text-accent"
                            : "text-muted-foreground hover:bg-accent/5 hover:text-accent",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="vendor-nav-active"
                            className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            active ? "text-accent" : "text-muted-foreground",
                          )}
                          strokeWidth={active ? 2 : 1.5}
                        />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {badge ? (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-medium leading-none text-white">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.nav>

        {/* Divider */}
        <div className="mx-4 border-t border-kwik-border" />

        {/* Logout */}
        <div className="px-2 pb-4 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flat-button flex h-11 w-full items-center gap-3 rounded-lg pl-4 pr-3 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
