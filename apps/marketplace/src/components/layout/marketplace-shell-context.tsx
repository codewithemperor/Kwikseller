"use client";

import React from "react";

export interface HeaderSearchConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onBack?: () => void;
  onToggleFilters?: () => void;
  showFilters?: boolean;
  activeFilterCount?: number;
}

interface MarketplaceShellContextValue {
  openSearch: () => void;
  showFilters?: boolean;
  setShowFilters?: (v: boolean) => void;
  setHeaderSearch?: (config: HeaderSearchConfig | null) => void;
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

export function useHeaderSearch(config: HeaderSearchConfig | null) {
  const shell = useMarketplaceShell();

  React.useEffect(() => {
    shell?.setHeaderSearch?.(config);
  }, [config, shell]);

  React.useEffect(() => {
    return () => shell?.setHeaderSearch?.(null);
  }, [shell]);
}
