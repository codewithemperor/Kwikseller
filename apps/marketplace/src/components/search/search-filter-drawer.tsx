"use client";

import React, { useEffect, useState } from "react";
import { Button, Drawer } from "@heroui/react";
import { SearchFilters as SearchFiltersPanel, type SearchFiltersState } from "./search-filters";
import type { SearchMeta } from "@/lib/api";

interface SearchFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  state: SearchFiltersState;
  meta: SearchMeta | null;
  onChange: (next: Partial<SearchFiltersState>) => void;
  onReset: () => void;
}

export function SearchFilterDrawer({
  open,
  onClose,
  state,
  meta,
  onChange,
  onReset,
}: SearchFilterDrawerProps) {
  const [draftState, setDraftState] = useState<SearchFiltersState>(state);

  useEffect(() => {
    if (open) setDraftState(state);
  }, [open, state]);

  const handleDraftChange = (next: Partial<SearchFiltersState>) => {
    setDraftState((current) => ({ ...current, ...next }));
  };
  const handleApply = () => {
    onChange(draftState);
    onClose();
  };
  const handleReset = () => {
    setDraftState({});
    onReset();
    onClose();
  };

  return (
    <Drawer.Backdrop isOpen={open} onOpenChange={(next) => !next && onClose()} variant="blur">
      <Drawer.Content placement="right" className="lg:hidden">
        <Drawer.Dialog className="flex h-full flex-col border-l border-border bg-background">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>Filters</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-y-auto">
            <SearchFiltersPanel
              state={draftState}
              meta={meta}
              onChange={handleDraftChange}
              onReset={() => setDraftState({})}
              showHeader={false}
            />
          </Drawer.Body>
          <Drawer.Footer className="shrink-0 gap-2 border-t border-border bg-background">
            <Button slot="close" variant="secondary" onPress={handleReset}>
              Clear all
            </Button>
            <Button slot="close" variant="primary" onPress={handleApply}>
              Apply filters
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
