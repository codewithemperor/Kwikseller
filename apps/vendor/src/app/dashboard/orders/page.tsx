"use client";

import React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { vendorCommerceApi } from "@kwikseller/api-client";
import type { Order } from "@kwikseller/types";
import { Skeleton, VendorPageHeader, type SearchAutoSuggestItem } from "@kwikseller/ui";
import { useVendorPageSearch } from "@/components/vendor-page-context";
import { VendorSecondaryTabs } from "@/components/vendor-secondary-tabs";
import { formatCurrency, formatDate, unwrapApiData } from "@/lib/vendor-format";
import { cn } from "@/lib/utils";

type OrderListResponse = {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type StatusTab = {
  label: string;
  value: string;
  queryStatus?: string;
};

const PAGE_SIZE = 25;
const EMPTY_ORDERS: Order[] = [];

const statusTabs: StatusTab[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING", queryStatus: "PENDING" },
  { label: "Ready to ship", value: "READY", queryStatus: "FULFILLED" },
  { label: "Shipped", value: "SHIPPED", queryStatus: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED", queryStatus: "DELIVERED" },
  { label: "Returned", value: "RETURNED", queryStatus: "REFUNDED" },
];

const dateRangeOptions = [
  { label: "Life time", value: "lifetime" },
  { label: "Last year", value: "last-year" },
  { label: "This year", value: "this-year" },
  { label: "Last 6 months", value: "last-6-months" },
  { label: "Last 3 months", value: "last-3-months" },
  { label: "This month", value: "this-month" },
  { label: "This week", value: "this-week" },
  { label: "Today", value: "today" },
];

function getOrderRef(order: Order) {
  return order.checkoutReference ?? order.id;
}

function getCustomerName(order: Order) {
  const buyer = order.buyer;
  const profile = buyer?.profile;
  const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  return name || buyer?.email || "Customer";
}

function getAddress(order: Order) {
  const address = order.address;
  if (!address) return "No delivery address";
  return [
    address.line1,
    address.localGovernment,
    address.city,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function getPaymentStatus(order: Order) {
  if (order.payment?.status) return order.payment.status;
  if (order.parentCheckout?.payment?.status) return order.parentCheckout.payment.status;
  return order.paymentStatus;
}

function paymentBadgeClass(status: string) {
  if (["PAID", "AUTHORIZED"].includes(status)) return "bg-success/10 text-success";
  if (["PENDING"].includes(status)) return "bg-warning/10 text-warning";
  return "bg-danger/10 text-danger";
}

function orderDotClass(status: string) {
  if (["DELIVERED", "PAID", "CONFIRMED"].includes(status)) return "bg-success";
  if (["PROCESSING", "FULFILLED", "PENDING"].includes(status)) return "bg-warning";
  if (["CANCELLED", "REFUNDED"].includes(status)) return "bg-danger";
  return "bg-muted";
}

function formatStatus(status: string) {
  if (status === "FULFILLED") return "Ready to ship";
  if (status === "REFUNDED") return "Returned";
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function orderSearchItem(order: Order): SearchAutoSuggestItem {
  return {
    id: order.id,
    type: "order",
    text: getOrderRef(order),
    subtext: `${getCustomerName(order)} · ${formatStatus(order.status)} · ${formatCurrency(order.totalAmount)}`,
    href: `/dashboard/orders/${order.id}`,
  };
}

function SelectBox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded border transition",
        checked
          ? "border-kwik-dark bg-kwik-dark text-white"
          : "border-kwik-border bg-background text-transparent hover:border-kwik-dark",
      )}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
    </button>
  );
}

export default function VendorOrdersPage() {
  const [page, setPage] = React.useState(1);
  const [statusTab, setStatusTab] = React.useState("ALL");
  const [dateRange, setDateRange] = React.useState("lifetime");
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const deferredSearch = React.useDeferredValue(search.trim());
  const activeTab = statusTabs.find((tab) => tab.value === statusTab) ?? statusTabs[0];

  React.useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [deferredSearch, statusTab]);

  const ordersQuery = useQuery({
    queryKey: ["vendor-orders", page, activeTab.queryStatus ?? "ALL", deferredSearch, dateRange],
    queryFn: async () => {
      const response = await vendorCommerceApi.listOrders({
        page,
        limit: PAGE_SIZE,
        status: activeTab.queryStatus ?? "ALL",
        search: deferredSearch || undefined,
        dateRange,
      });
      return unwrapApiData<OrderListResponse>(response.data);
    },
    placeholderData: keepPreviousData,
  });

  const orders = ordersQuery.data?.items ?? EMPTY_ORDERS;
  const total = ordersQuery.data?.total ?? 0;
  const totalPages = ordersQuery.data?.totalPages ?? 1;
  const allVisibleSelected = orders.length > 0 && orders.every((order) => selectedIds.has(order.id));

  const searchOrdersFromHeader = React.useCallback(async (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const localResults = orders
      .filter((order) =>
        [
          getOrderRef(order),
          getCustomerName(order),
          getAddress(order),
          order.status,
          getPaymentStatus(order),
          String(order.totalAmount ?? ""),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized)),
      )
      .slice(0, 8)
      .map(orderSearchItem);

    if (localResults.length) return localResults;

    const response = await vendorCommerceApi.listOrders({
      page: 1,
      limit: 8,
      status: activeTab.queryStatus ?? "ALL",
      search: query,
      dateRange,
    });
    return unwrapApiData<OrderListResponse>(response.data).items.map(orderSearchItem);
  }, [activeTab.queryStatus, dateRange, orders]);

  const applyHeaderSearch = React.useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  useVendorPageSearch(searchOrdersFromHeader, applyHeaderSearch);

  const toggleAllVisible = React.useCallback((checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      orders.forEach((order) => {
        if (checked) next.add(order.id);
        else next.delete(order.id);
      });
      return next;
    });
  }, [orders]);

  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <SelectBox
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            label="Select visible orders"
          />
        ),
        cell: ({ row }) => (
          <SelectBox
            checked={selectedIds.has(row.original.id)}
            onChange={(checked) => {
              setSelectedIds((current) => {
                const next = new Set(current);
                if (checked) next.add(row.original.id);
                else next.delete(row.original.id);
                return next;
              });
            }}
            label={`Select order ${getOrderRef(row.original)}`}
          />
        ),
        size: 44,
      },
      {
        id: "customer",
        header: "Customer name",
        cell: ({ row }) => (
          <span className="block max-w-[10rem] truncate text-sm font-medium text-foreground">
            {getCustomerName(row.original)}
          </span>
        ),
        size: 160,
      },
      {
        accessorKey: "checkoutReference",
        header: "ID",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/orders/${row.original.id}`}
            className="block max-w-[9rem] truncate font-mono text-sm font-semibold text-foreground transition hover:text-accent"
          >
            {getOrderRef(row.original)}
          </Link>
        ),
        size: 170,
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-medium text-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        size: 130,
      },
      {
        id: "address",
        header: "Address",
        cell: ({ row }) => (
          <span className="block max-w-[18rem] truncate text-sm text-foreground">
            {getAddress(row.original)}
          </span>
        ),
      },
      {
        id: "payment",
        header: "Payment Status",
        cell: ({ row }) => {
          const status = getPaymentStatus(row.original);
          return (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", paymentBadgeClass(status))}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {formatStatus(status)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Order Status",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className={cn("h-2 w-2 rounded-full", orderDotClass(row.original.status))} />
            {formatStatus(row.original.status)}
          </span>
        ),
      },
      {
        id: "items",
        header: "items",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/orders/${row.original.id}`}
            className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-success"
          >
            {row.original.items?.length ?? 0} Items
          </Link>
        ),
      },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
    ],
    [allVisibleSelected, selectedIds, toggleAllVisible],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="min-w-0 space-y-6">
      <VendorPageHeader
        title="Orders"
        description={search ? `Showing results for "${search}". Use the header search to refine orders.` : "Track buyer checkout activity, payments, and fulfillment status."}
        actions={
          <>
          <button
            type="button"
            onClick={() => ordersQuery.refetch()}
            className="inline-flex h-9 items-center gap-2 px-1 text-sm font-semibold text-foreground transition hover:text-accent"
          >
            <RefreshCw className={cn("h-4 w-4", ordersQuery.isFetching && "animate-spin")} strokeWidth={1.7} />
            Refresh
          </button>

          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex h-9 items-center gap-2 px-1 text-sm font-semibold text-foreground transition hover:text-accent"
            >
              Clear search
            </button>
          ) : null}

          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="h-9 w-36 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-accent"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          </>
        }
      />

      <VendorSecondaryTabs
        ariaLabel="Order status filters"
        items={statusTabs.map((tab) => ({
          label: tab.label,
          value: tab.value,
          count: tab.value === "ALL" ? total : undefined,
        }))}
        value={statusTab}
        onChange={setStatusTab}
      />

      <section className="flex min-h-[28rem] max-h-[calc(100vh-12rem)] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background p-3 md:p-5">
        <div className="scrollbar-hide min-h-[18rem] flex-1 overflow-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-default">
                  {headerGroup.headers.map((header, index) => (
                    <th
                      key={header.id}
                      className={cn(
                        "h-14 px-4 text-sm font-bold text-foreground",
                        index === 0 && "rounded-l-lg",
                        index === headerGroup.headers.length - 1 && "rounded-r-lg",
                      )}
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {ordersQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border">
                    {columns.map((column, colIndex) => (
                      <td key={`${rowIndex}-${column.id ?? colIndex}`} className="border-b border-border px-4 py-5">
                        <Skeleton className="h-5 w-full max-w-32" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-default/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="border-b border-border px-4 py-5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16">
                    <div className="sticky left-0 flex w-[calc(100vw-3rem)] max-w-full justify-center text-center md:w-full">
                      <div>
                        <p className="text-base font-semibold text-foreground">No orders found</p>
                        <p className="mt-1 text-sm text-muted-foreground">Try another status or search term.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            Showing {orders.length ? (page - 1) * PAGE_SIZE + 1 : 0}
            {" - "}
            {Math.min(page * PAGE_SIZE, total)} of {total} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || ordersQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="rounded-lg bg-default px-3 py-2 font-semibold text-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || ordersQuery.isFetching}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
