"use client";

import React, { useState } from "react";
import {
  Table,
  TableContent,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Card,
  CardContent,
} from "@heroui/react";
import {
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
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
  actions?: (item: T) => React.ReactNode;
  getRowId?: (item: T) => string;
  className?: string;
  renderTopContent?: React.ReactNode;
}

export function DataTable<T extends object>({
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
  actions,
  getRowId,
  className,
  renderTopContent,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");

  const totalPages = totalItems
    ? Math.ceil(totalItems / pageSize)
    : Math.ceil(data.length / pageSize);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  };

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" color="warning" />
            <p className="text-sm text-muted-foreground">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const paginationContent =
    totalPages > 1 ? (
      <div className="flex items-center justify-center gap-1 px-2 py-2">
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
    ) : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          {onSearch && (
            <div className="relative max-w-xs">
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
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
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

      {/* Table - HeroUI v3: Table = TableRoot (div), TableContent = ReactAria Table */}
      <Table className="shadow-none border border-default-200 rounded-xl overflow-hidden">
        <TableContent aria-label="Data table">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                allowsSorting={column.sortable}
                className={column.className}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={data.length > 0 ? data : [{}] as T[]}>
            {(item) => {
              const hasData = data.length > 0 && getRowId ? getRowId(item) !== undefined : data.length > 0;
              return hasData ? (
                <TableRow key={getRowId ? getRowId(item) : String((item as Record<string, unknown>).id)}>
                  {(columnKey) => (
                    <TableCell>
                      {String(columnKey) === "actions" && actions ? (
                        actions(item)
                      ) : (
                        columns.find((c) => c.key === String(columnKey))?.render?.(item) ??
                        ((item as Record<string, unknown>)[String(columnKey)] as React.ReactNode)
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ) : (
                <TableRow key="empty">
                  <TableCell>
                    <div className="flex flex-col items-center gap-2 py-8">
                      {emptyIcon}
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }}
          </TableBody>
        </TableContent>
      </Table>

      {paginationContent}

      {totalItems !== undefined && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {data.length} of {totalItems} items
        </p>
      )}
    </div>
  );
}
