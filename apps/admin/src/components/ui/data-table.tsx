"use client";

import React, { useState, useCallback } from "react";
import type { SortDescriptor } from "@heroui/react";
import { Table, Spinner, Dropdown, Button, Label, cn } from "@heroui/react";
import {
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  isRowHeader?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface RowAction<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "danger";
  onPress: (item: T) => void;
}

export interface TreeItem {
  id: string;
  children?: TreeItem[];
}

export interface DataTableProps<T extends TreeItem> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  totalItems?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  searchPlaceholder?: string;
  addLabel?: string;
  addHref?: string;
  onRefresh?: () => void;
  isRefetching?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  rowActions?: RowAction<T>[];
  getRowId?: (item: T) => string;
  className?: string;
  renderTopContent?: React.ReactNode;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  /**
   * Enables tree/expand mode. Pass the column key whose cell should show the
   * expand chevron (e.g. treeColumn="name"). Does NOT need to match a
   * Table.Column id — we handle expansion ourselves without HeroUI's native
   * tree API, which has incompatible cell-count constraints with dynamic columns.
   */
  treeColumn?: string;
  defaultExpandedKeys?: Iterable<string>;
}

// ── Actions dropdown ───────────────────────────────────────────────────────
// Dropdown.Trigger renders its own <button>. NEVER nest <Button> inside it.

function ActionsCell<T extends TreeItem>({
  item,
  rowActions,
}: {
  item: T;
  rowActions: RowAction<T>[];
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger>
        <div
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-default-100"
          aria-label="Row actions"
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu
          onAction={(key) => {
            const action = rowActions.find((a) => a.key === String(key));
            action?.onPress(item);
          }}
        >
          {rowActions.map((action) => (
            <Dropdown.Item
              key={action.key}
              id={action.key}
              textValue={action.label}
              variant={action.variant}
            >
              {action.icon}
              <Label>{action.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ── Tree flattening ────────────────────────────────────────────────────────
// We manage expand/collapse ourselves by pre-flattening the tree into a
// visible list based on expandedKeys. This avoids HeroUI's Table.Collection
// approach entirely, which causes "cell count must match column count" errors
// when columns.length doesn't match what HeroUI expects internally.

interface FlatRow<T extends TreeItem> {
  item: T;
  depth: number;
  hasChildren: boolean;
}

function flattenVisible<T extends TreeItem>(
  items: T[],
  expandedKeys: Set<string>,
  depth = 0,
): FlatRow<T>[] {
  const result: FlatRow<T>[] = [];
  for (const item of items) {
    const hasChildren = !!item.children?.length;
    result.push({ item, depth, hasChildren });
    if (hasChildren && expandedKeys.has(item.id)) {
      result.push(
        ...flattenVisible(item.children as T[], expandedKeys, depth + 1),
      );
    }
  }
  return result;
}

// ── DataTable ──────────────────────────────────────────────────────────────

export function DataTable<T extends TreeItem>({
  columns,
  data,
  isLoading = false,
  totalItems,
  page = 1,
  pageSize = 10,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
  addLabel,
  addHref,
  onRefresh,
  isRefetching = false,
  emptyMessage = "No items found",
  emptyIcon,
  rowActions,
  getRowId,
  className,
  renderTopContent,
  sortDescriptor,
  onSortChange,
  treeColumn,
  defaultExpandedKeys,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(defaultExpandedKeys ?? []),
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch?.(value), 300);
  };

  const isTree = !!treeColumn;

  // In tree mode, flatten the tree into visible rows based on expandedKeys.
  // In flat mode, just use data directly (no depth/children concept).
  const flatRows: FlatRow<T>[] = isTree
    ? flattenVisible(data, expandedKeys)
    : data.map((item) => ({ item, depth: 0, hasChildren: false }));

  const totalPages = totalItems
    ? Math.ceil(totalItems / pageSize)
    : Math.ceil(data.length / pageSize);

  const hasActions = !!rowActions?.length;

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex min-h-[300px] items-center justify-center rounded-xl border border-default-200",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" color="warning" />
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {onSearch && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-default-200 bg-default-50 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              {searchValue && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-default-200 text-default-500 hover:bg-default-50 disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefetching && "animate-spin")}
              />
            </button>
          )}
          {addLabel && addHref && (
            <Link
              href={addHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {addLabel}
            </Link>
          )}
        </div>
      </div>

      {renderTopContent}

      <Table variant="secondary" className="shadow-none overflow-hidden">
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Data table"
            {...(sortDescriptor && onSortChange
              ? { sortDescriptor, onSortChange }
              : {})}
          >
            <Table.Header>
              {columns.map((col) => (
                <Table.Column
                  key={col.key}
                  id={col.key}
                  isRowHeader={col.isRowHeader}
                  allowsSorting={col.sortable}
                  className={cn("py-3", col.className)}
                >
                  {col.label}
                </Table.Column>
              ))}
              {hasActions && (
                <Table.Column
                  key="__actions__"
                  id="__actions__"
                  className="w-10 py-3"
                />
              )}
            </Table.Header>

            <Table.Body items={flatRows}>
              {({ item, depth, hasChildren }) => {
                const rowId = getRowId ? getRowId(item) : item.id;
                const isExpanded = expandedKeys.has(item.id);

                return (
                  <Table.Row id={rowId} textValue={rowId}>
                    {columns.map((col) => {
                      const content = col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[
                            col.key
                          ] as React.ReactNode);

                      // Tree column: show indent + chevron toggle
                      if (isTree && col.key === treeColumn) {
                        return (
                          <Table.Cell key={col.key}>
                            <span
                              className="flex items-center gap-1"
                              style={{ paddingLeft: depth * 20 }}
                            >
                              {hasChildren ? (
                                <Button
                                  isIconOnly
                                  aria-label={
                                    isExpanded ? "Collapse" : "Expand"
                                  }
                                  size="sm"
                                  variant="ghost"
                                  onPress={() => toggleExpand(item.id)}
                                >
                                  <ChevronRight
                                    className={cn(
                                      "h-4 w-4 text-muted-foreground transition-transform duration-150",
                                      isExpanded && "rotate-90",
                                    )}
                                  />
                                </Button>
                              ) : (
                                // Spacer to align leaf rows with parent text
                                <span
                                  className="inline-block w-8 shrink-0"
                                  aria-hidden
                                />
                              )}
                              {content}
                            </span>
                          </Table.Cell>
                        );
                      }

                      return <Table.Cell key={col.key}>{content}</Table.Cell>;
                    })}

                    {hasActions && (
                      <Table.Cell>
                        <ActionsCell item={item} rowActions={rowActions!} />
                      </Table.Cell>
                    )}
                  </Table.Row>
                );
              }}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {totalPages > 1 && (
          <Table.Footer>
            <div className="flex w-full items-center justify-center gap-1 py-3">
              <button
                onClick={() => onPageChange?.(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-default-200 text-sm disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                    p === page
                      ? "bg-accent text-accent-foreground font-medium"
                      : "border border-default-200 hover:bg-default-50",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-default-200 text-sm disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </Table.Footer>
        )}
      </Table>

      {totalItems !== undefined && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {data.length} of {totalItems} items
        </p>
      )}
    </div>
  );
}
