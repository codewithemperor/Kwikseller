"use client";

import React from "react";

interface MarketplaceShellContextValue {
  openSearch: () => void;
  showFilters?: boolean;
  setShowFilters?: (v: boolean) => void;
}

const MarketplaceShellContext =
  React.createContext<MarketplaceShellContextValue | null>(null);

export function MarketplaceShellProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MarketplaceShellContextValue;
}) {
  return (
    <MarketplaceShellContext.Provider value={value}>
      {children}
    </MarketplaceShellContext.Provider>
  );
}

export function useMarketplaceShell() {
  return React.useContext(MarketplaceShellContext);
}
