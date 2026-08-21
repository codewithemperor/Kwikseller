"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Award,
  ImageIcon,
  Percent,
  Ticket,
  Truck,
  ReceiptText,
  CreditCard,
  ChevronRight,
  LogOut,
  Menu,
  Bell,
  Shield,
  X,
  UsersRound,
} from "lucide-react";
import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils";
import { useAuth, useAuthStore } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { ADMIN_ROLE_LABELS, canAccessPermission, SECTION_PERMISSION, type AdminSection } from "@/lib/admin-permissions";

const sidebarItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, section: "dashboard" },
  { label: "Products", href: "/admin/products", icon: Package, section: "products" },
  { label: "Categories", href: "/admin/categories", icon: FolderTree, section: "categories" },
  { label: "Brands", href: "/admin/brands", icon: Award, section: "brands" },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon, section: "banners" },
  { label: "Deals", href: "/admin/deals", icon: Percent, section: "deals" },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket, section: "coupons" },
  { label: "Orders", href: "/admin/orders", icon: ReceiptText, section: "orders" },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, section: "payments" },
  { label: "Delivery Rates", href: "/admin/delivery-rates", icon: Truck, section: "delivery-rates" },
  { label: "Admin Users", href: "/admin/admin-users", icon: UsersRound, section: "admin-users" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const visibleItems = sidebarItems.filter((item) => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    return canAccessPermission(
      user.permissions,
      SECTION_PERMISSION[item.section as AdminSection],
    );
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg kwik-gradient">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {(!isCollapsed || !isMobileOpen) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-heading text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden text-sidebar-foreground"
            >
              KWIKSELLER
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-accent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active && "text-accent",
                )}
              />
              <AnimatePresence>
                {(!isCollapsed || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence>
            {(!isCollapsed || isMobileOpen) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-surface"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar border-r border-sidebar-border lg:hidden"
          >
            <div className="absolute right-2 top-3 z-10">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border shrink-0"
      >
        {sidebarContent}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              isCollapsed && "rotate-180",
            )}
          />
        </button>
      </motion.aside>
    </>
  );
}

export function AdminHeader() {
  const user = useAuthStore((state) => state.user);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-lg lg:px-6">
      <div className="flex items-center gap-3 lg:gap-4 pl-12 lg:pl-0">
        <div className="hidden lg:block">
          <h1 className="text-lg font-heading font-semibold text-foreground">
            Admin Dashboard
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle className="h-8 w-8 rounded-lg border border-border text-muted hover:bg-surface" />
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        {user && (
          <Chip
            size="sm"
            variant="soft"
            color="warning"
            className="font-medium hidden sm:flex"
          >
            {user.role === "SUPER_ADMIN"
              ? "Super Admin"
              : user.adminRole
                ? ADMIN_ROLE_LABELS[user.adminRole]
                : "Admin"}
          </Chip>
        )}
      </div>
    </header>
  );
}

