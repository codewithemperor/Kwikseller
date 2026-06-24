"use client";

import React from "react";
import type { SearchAutoSuggestItem } from "@kwikseller/ui";

export type VendorPageSearchProvider = (query: string) => Promise<SearchAutoSuggestItem[]> | SearchAutoSuggestItem[];
export type VendorPageSearchSubmit = (query: string) => void;

type VendorPageContextValue = {
  searchProvider?: VendorPageSearchProvider;
  searchSubmit?: VendorPageSearchSubmit;
  setSearchProvider: React.Dispatch<React.SetStateAction<VendorPageSearchProvider | undefined>>;
  setSearchSubmit: React.Dispatch<React.SetStateAction<VendorPageSearchSubmit | undefined>>;
};

const VendorPageContext = React.createContext<VendorPageContextValue | null>(null);

export function VendorPageProvider({ children }: { children: React.ReactNode }) {
  const [searchProvider, setSearchProvider] = React.useState<VendorPageSearchProvider | undefined>();
  const [searchSubmit, setSearchSubmit] = React.useState<VendorPageSearchSubmit | undefined>();

  const value = React.useMemo(
    () => ({ searchProvider, searchSubmit, setSearchProvider, setSearchSubmit }),
    [searchProvider, searchSubmit],
  );

  return (
    <VendorPageContext.Provider value={value}>
      {children}
    </VendorPageContext.Provider>
  );
}

export function useVendorPageContext() {
  const context = React.useContext(VendorPageContext);
  if (!context) {
    throw new Error("useVendorPageContext must be used within VendorPageProvider");
  }
  return context;
}

export function useVendorPageSearch(provider: VendorPageSearchProvider, onSearch?: VendorPageSearchSubmit) {
  const { setSearchProvider, setSearchSubmit } = useVendorPageContext();

  React.useEffect(() => {
    setSearchProvider(() => provider);
    if (onSearch) setSearchSubmit(() => onSearch);

    return () => {
      setSearchProvider(undefined);
      setSearchSubmit(undefined);
    };
  }, [onSearch, provider, setSearchProvider, setSearchSubmit]);
}
