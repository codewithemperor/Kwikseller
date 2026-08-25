"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { UserStore } from "@/stores/auth-store";

const MobileDrawer = dynamic(
  () =>
    import("@/components/landing/mobile-drawer").then((module) => ({
      default: module.MobileDrawer,
    })),
  { ssr: false },
);

interface MarketplaceMobileDrawerProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: UserStore | null;
  onClose: () => void;
  onNavigateStart: () => void;
  onLogout: () => Promise<void>;
}

export function MobileDrawerFrame({
  isOpen,
  onClose,
  children,
  dialogLabel = "Navigation menu",
  visibilityClassName = "md:hidden",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  dialogLabel?: string;
  visibilityClassName?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 z-[110] bg-black/60 backdrop-blur-[2px] ${visibilityClassName}`}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={dialogLabel}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={`fixed bottom-0 left-0 top-0 z-[120] w-[300px] max-w-[85vw] overflow-hidden border-r border-kwik-border bg-background shadow-2xl ${visibilityClassName}`}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function MarketplaceMobileDrawer({
  isOpen,
  isAuthenticated,
  isAuthLoading,
  user,
  onClose,
  onNavigateStart,
  onLogout,
}: MarketplaceMobileDrawerProps) {
  return (
    <MobileDrawerFrame isOpen={isOpen} onClose={onClose} dialogLabel="Marketplace navigation">
      <MobileDrawer
        isOpen
        onClose={onClose}
        onNavigateStart={onNavigateStart}
        isAuthenticated={isAuthenticated}
        user={user}
        isAuthLoading={isAuthLoading}
        onLogout={onLogout}
      />
    </MobileDrawerFrame>
  );
}
