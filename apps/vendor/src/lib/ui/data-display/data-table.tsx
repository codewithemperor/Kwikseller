'use client';

import React, { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type Row,
  type SortingState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  MoreHorizontal,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Skeleton } from '../feedback/skeleton';
import { EmptyState, type EmptyStateVariant } from '../feedback/empty-state';

export type { ColumnDef, Row } from '@tanstack/react-table';

export interface DataTableRowAction<TData> {
  key: string;
  label: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: 'danger' | 'warning' | 'default';
  onPress: (row: TData) => void;
}

export interface ManualPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  globalSearch?: boolean;
  pagination?: boolean;
  pageSize?: number;
  manualPagination?: ManualPagination;
  enableRowSelection?: boolean;
  selectedRows?: Row<TData>[];
  onSelectionChange?: (rows: Row<TData>[]) => void;
  enableSorting?: boolean;
  rowActions?: DataTableRowAction<TData>[];
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  emptyVariant?: EmptyStateVariant;
  compact?: boolean;
  className?: string;
  topContent?: React.ReactNode;
  renderSubRow?: (row: TData) => React.ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchKey,
  globalSearch = false,
  pagination = true,
  pageSize = 10,
  manualPagination,
  enableRowSelection = false,
  enableSorting = true,
  rowActions,
  emptyMessage = 'No results found',
  emptyIcon,
  emptyVariant = 'default',
  compact = false,
  className,
  topContent,
  renderSubRow,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState('');
  const [{ pageIndex, pageSize: statePageSize }, setPagination] =
    useState<PaginationState>({ pageIndex: 0, pageSize });

  // Build the action column if rowActions provided
  const finalColumns = useMemo(() => {
    if (!rowActions || rowActions.length === 0) return columns;
    const actionCol: ColumnDef<TData, any> = {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActionsMenu row={row.original} actions={rowActions} />,
      enableSorting: false,
      size: 50,
    };
    return [...columns, actionCol];
  }, [columns, rowActions]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      globalFilter: globalSearch ? globalFilter : undefined,
      columnFilters: !globalSearch && searchKey ? [{ id: searchKey, value: columnFilter }] : undefined,
      pagination: manualPagination ? { pageIndex: manualPagination.page - 1, pageSize: manualPagination.pageSize } : { pageIndex, pageSize: statePageSize },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: (updater) => {
      if (typeof updater === 'function') {
        const next = updater(searchKey ? [{ id: searchKey, value: columnFilter }] : []);
        setColumnFilter((next[0]?.value as string) ?? '');
      }
    },
    onPaginationChange: manualPagination
      ? (updater) => {
          if (typeof updater === 'function') {
            const next = updater({ pageIndex: manualPagination.page - 1, pageSize: manualPagination.pageSize });
            manualPagination.onPageChange(next.pageIndex + 1);
          }
        }
      : setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination: !!manualPagination,
    pageCount: manualPagination ? Math.ceil(manualPagination.totalItems / manualPagination.pageSize) : undefined,
    enableRowSelection,
    enableSorting,
  });

  const rows = table.getRowModel().rows;
  const totalRows = manualPagination ? manualPagination.totalItems : rows.length;
  const startRow = manualPagination
    ? (manualPagination.page - 1) * manualPagination.pageSize + 1
    : pageIndex * statePageSize + 1;
  const endRow = manualPagination
    ? Math.min(manualPagination.page * manualPagination.pageSize, manualPagination.totalItems)
    : Math.min((pageIndex + 1) * statePageSize, data.length);

  const searchValue = globalSearch ? globalFilter : columnFilter;
  const onSearchChange = globalSearch ? setGlobalFilter : setColumnFilter;

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Search + top content */}
      {(searchable || topContent) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border border-kwik-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </div>
          ) : (
            <div />
          )}
          {topContent}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-kwik-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-kwik-border">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                          compact ? 'py-2' : 'py-3',
                          header.id === 'actions' && 'w-12 text-right',
                        )}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 transition-colors hover:text-foreground"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDir === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : sortDir === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-kwik-border">
                    {table.getAllLeafColumns().map((col, j) => (
                      <td key={col.id} className={cn('px-4', compact ? 'py-2' : 'py-3')}>
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getAllLeafColumns().length} className="p-0">
                    <EmptyState
                      variant={emptyVariant}
                      icon={emptyIcon}
                      title={emptyMessage}
                      className="py-12"
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'border-b border-kwik-border transition-colors hover:bg-surface/50',
                        row.getIsSelected() && 'bg-accent/5',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={cn('px-4 text-sm text-foreground', compact ? 'py-2' : 'py-3')}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                    {renderSubRow && row.getIsExpanded() && (
                      <tr className="bg-default-100/50">
                        <td colSpan={row.getVisibleCells().length} className="p-4">
                          {renderSubRow(row.original)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && !isLoading && data.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {manualPagination
              ? `Showing ${startRow}-${endRow} of ${manualPagination.totalItems}`
              : `Showing ${startRow}-${Math.min(endRow, data.length)} of ${data.length}`}
          </p>
          <div className="flex items-center gap-2">
            {!manualPagination && (
              <select
                value={statePageSize}
                onChange={(e) => setPagination((p) => ({ ...p, pageSize: Number(e.target.value) }))}
                className="h-8 rounded-lg border border-kwik-border bg-surface px-2 text-xs text-foreground outline-none"
              >
                {[10, 25, 50].map((s) => (
                  <option key={s} value={s}>{s} / page</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => manualPagination ? manualPagination.onPageChange(manualPagination.page - 1) : table.previousPage()}
              disabled={manualPagination ? manualPagination.page <= 1 : !table.getCanPreviousPage()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-kwik-border text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-foreground">
              {manualPagination ? manualPagination.page : pageIndex + 1}
              {!manualPagination && ` / ${table.getPageCount()}`}
            </span>
            <button
              type="button"
              onClick={() => manualPagination ? manualPagination.onPageChange(manualPagination.page + 1) : table.nextPage()}
              disabled={manualPagination ? endRow >= manualPagination.totalItems : !table.getCanNextPage()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-kwik-border text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActionsMenu<TData>({
  row,
  actions,
}: {
  row: TData;
  actions: DataTableRowAction<TData>[];
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        aria-label="Row actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-kwik-border bg-background p-1 shadow-xl">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onPress(row);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-surface',
                action.variant === 'danger' && 'text-danger hover:bg-danger/5',
                action.variant === 'warning' && 'text-warning hover:bg-warning/5',
                !action.variant && 'text-foreground',
              )}
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DataTable;
