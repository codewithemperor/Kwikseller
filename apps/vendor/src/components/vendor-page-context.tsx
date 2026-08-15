"use client";

import React from "react";
import type { SearchAutoSuggestItem } from "@kwikseller/ui";

export type VendorPageSearchProvider = (query: string) => Promise<SearchAutoSuggestItem[]> | SearchAutoSuggestItem[];
export type VendorPageSearchSubmit = (query: string) => void;

type VendorPageContextValue = {
  searchProvider?: VendorPageSearchProvider;
  searchSubmit?: VendorPageSearchSubmit;
  idleSearchItems: SearchAutoSuggestItem[];
  setSearchProvider: React.Dispatch<React.SetStateAction<VendorPageSearchProvider | undefined>>;
  setSearchSubmit: React.Dispatch<React.SetStateAction<VendorPageSearchSubmit | undefined>>;
  setIdleSearchItems: React.Dispatch<React.SetStateAction<SearchAutoSuggestItem[]>>;
};

const VendorPageContext = React.createContext<VendorPageContextValue | null>(null);

export function VendorPageProvider({ children }: { children: React.ReactNode }) {
  const [searchProvider, setSearchProvider] = React.useState<VendorPageSearchProvider | undefined>();
  const [searchSubmit, setSearchSubmit] = React.useState<VendorPageSearchSubmit | undefined>();
  const [idleSearchItems, setIdleSearchItems] = React.useState<SearchAutoSuggestItem[]>([]);

  const value = React.useMemo(
    () => ({ searchProvider, searchSubmit, idleSearchItems, setSearchProvider, setSearchSubmit, setIdleSearchItems }),
    [idleSearchItems, searchProvider, searchSubmit],
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

export function useVendorPageSearch(
  provider: VendorPageSearchProvider,
  onSearch?: VendorPageSearchSubmit,
  idleItems: SearchAutoSuggestItem[] = [],
) {
  const { setSearchProvider, setSearchSubmit, setIdleSearchItems } = useVendorPageContext();

  // Keep the latest callbacks in refs so registering them into the context
  // happens only once — inline functions/arrays from callers would otherwise
  // change identity every render and re-trigger the effect (infinite loop).
  const providerRef = React.useRef(provider);
  const onSearchRef = React.useRef(onSearch);
  const idleItemsRef = React.useRef(idleItems);
  providerRef.current = provider;
  onSearchRef.current = onSearch;
  idleItemsRef.current = idleItems;

  React.useEffect(() => {
    const stableProvider: VendorPageSearchProvider = (query) => providerRef.current(query);
    const stableSubmit: VendorPageSearchSubmit = (query) => onSearchRef.current?.(query);

    setSearchProvider(() => stableProvider);
    setSearchSubmit(() => stableSubmit);
    setIdleSearchItems(idleItemsRef.current);

    return () => {
      setSearchProvider(undefined);
      setSearchSubmit(undefined);
      setIdleSearchItems([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIdleSearchItems, setSearchProvider, setSearchSubmit]);
}
