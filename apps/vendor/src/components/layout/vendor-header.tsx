"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, User, Settings, HelpCircle, LogOut, ChevronDown, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AppButton,
  SearchAutoSuggest,
  type SearchAutoSuggestItem,
} from "@/lib/ui";
import { vendorCommerceApi } from "@/lib/api-client";
import { useVendorPageContext } from "@/components/vendor-page-context";

export interface VendorHeaderProps {
  onMenuToggle: () => void;
  vendorName?: string;
  storeLogoUrl?: string;
  notificationCount?: number;
  onSearchSubmit?: (query: string) => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);
  return ref;
}

export function VendorHeader({
  onMenuToggle,
  vendorName: vendorNameProp,
  storeLogoUrl: storeLogoUrlProp,
  notificationCount = 0,
  onSearchSubmit,
}: VendorHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [activeSearchAnchor, setActiveSearchAnchor] = React.useState<"desktop" | "icon">("icon");
  const desktopSearchRef = React.useRef<HTMLButtonElement>(null);
  const iconSearchRef = React.useRef<HTMLButtonElement>(null);
  const { searchProvider, searchSubmit, idleSearchItems } = useVendorPageContext();

  const userName =
    vendorNameProp ||
    user?.store?.name ||
    user?.profile?.firstName ||
    user?.email ||
    "Vendor";
  const storeLogo =
    storeLogoUrlProp || (user?.store as { logoUrl?: string } | undefined)?.logoUrl;

  const notifRef = useClickOutside<HTMLDivElement>(() => setNotifOpen(false));
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false));

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    window.location.href = "/";
  };

  const handleSearch = React.useCallback(
    (query: string) => {
      if (searchSubmit) {
        searchSubmit(query);
        return;
      }
      onSearchSubmit?.(query);
    },
    [onSearchSubmit, searchSubmit],
  );

  const openSearch = React.useCallback((anchor: "desktop" | "icon") => {
    setActiveSearchAnchor(anchor);
    setSearchOpen(true);
  }, []);

  const loadGlobalSuggestions = React.useCallback(async (query: string): Promise<SearchAutoSuggestItem[]> => {
    const response = await vendorCommerceApi.getDashboard({ q: query });
    return (response.data.searchSuggestions ?? []).map((item) => ({
      id: item.id,
      type: item.type,
      text: item.text,
      subtext: item.subtext,
      href: item.href,
    }));
  }, []);

  const loadVendorSuggestions = React.useCallback(async (query: string): Promise<SearchAutoSuggestItem[]> => {
    if (searchProvider) {
      return searchProvider(query);
    }
    return loadGlobalSuggestions(query);
  }, [loadGlobalSuggestions, searchProvider]);

  const searchAnchorRef = activeSearchAnchor === "desktop" ? desktopSearchRef : iconSearchRef;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 md:px-5 lg:px-6">
      {/* Left section: hamburger + brand */}
      <div className="flex shrink-0 items-center gap-3">
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          aria-label="Open menu"
          className="h-9 w-9 p-0 text-foreground hover:bg-surface lg:hidden"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </AppButton>

        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-foreground">
            KWIKSELLER
          </span>
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            VENDOR
          </span>
        </div>
      </div>

      {/* Marketplace-style search */}
      <div
        className="mx-auto hidden w-full max-w-xl flex-1 md:block"
      >
        <button
          ref={desktopSearchRef}
          type="button"
          aria-label="Search vendor workspace"
          onPointerDown={(event) => {
            event.preventDefault();
            openSearch("desktop");
          }}
          onClick={() => openSearch("desktop")}
          className="relative block h-10 w-full rounded-xl border border-border bg-default px-10 text-left text-sm text-muted-foreground outline-none transition hover:border-accent/45 hover:bg-background"
        >
          <span className="sr-only">Search vendor workspace</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <span className="block truncate">Search products, orders, customers...</span>
          <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground lg:inline-flex">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Right section: notifications + theme + avatar */}
      <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5">
        <button
          ref={iconSearchRef}
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            openSearch("icon");
          }}
          onClick={() => openSearch("icon")}
          aria-label="Search"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition hover:bg-default md:hidden"
        >
          <Search className="h-5 w-5" strokeWidth={1.6} />
        </button>

        <SearchAutoSuggest
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          anchorRef={searchAnchorRef}
          placeholder="Search products, orders, inventory..."
          historyKey="kwikseller-vendor-search-history"
          showTrending={false}
          idleItems={idleSearchItems}
          emptyLabel="No matching products, orders, or inventory."
          footerLabel="Search your vendor workspace"
          loadSuggestions={loadVendorSuggestions}
          onSearch={handleSearch}
          onSelect={(item) => {
            if (item.href) {
              router.push(item.href);
              return;
            }
            handleSearch(item.text);
          }}
        />

        {/* Notification bell with dropdown */}
        <div className="relative" ref={notifRef}>
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative h-9 w-9 p-0 text-foreground hover:bg-default"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-medium leading-none text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </AppButton>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-background"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  {notificationCount > 0 && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {notificationCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                      <Bell className="h-6 w-6 text-accent" />
                    </div>
                    <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
                    <p className="text-xs text-muted-foreground">
                      New order and activity updates will appear here.
                    </p>
                  </div>
                </div>
                <div className="border-t border-border px-4 py-2">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="block rounded-md px-2 py-1.5 text-center text-xs font-semibold text-accent transition-colors hover:bg-accent/5"
                  >
                    View all notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ThemeToggle className="h-9 min-w-9 rounded-md text-foreground hover:bg-default" />

        {/* User avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="User menu"
            className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-default"
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent">
              {storeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storeLogo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">{getInitials(userName)}</span>
              )}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-background p-1"
              >
                <div className="border-b border-border px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                  {user?.email && (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/profile");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-default"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/settings");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-default"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/help");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-default"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
