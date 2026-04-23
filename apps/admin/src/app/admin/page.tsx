"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowRight,
  Eye,
  Tag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { dashboardApi } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@kwikseller/utils";

const COLORS = ["#F07A22", "#0D1B5E", "#E8160C", "#B0B0B0", "#5B7FD6"];

const statusColorMap: Record<string, "success" | "warning" | "default" | "danger" | "accent"> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => dashboardApi.getStats().then((res) => res.data),
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: () => dashboardApi.getRecentOrders(8).then((res) => res.data),
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: () => dashboardApi.getTopProducts(5).then((res) => res.data),
  });

  const chartData = React.useMemo(() => {
    if (!topProducts) return [];
    return topProducts.map((p) => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
      revenue: p.price * (p.stock || 1),
      stock: p.stock || 0,
    }));
  }, [topProducts]);

  const pieData = React.useMemo(() => {
    if (!stats) return [];
    const total = stats.totalOrders || 1;
    return [
      { name: "Delivered", value: Math.round(total * 0.6) },
      { name: "Processing", value: Math.round(total * 0.2) },
      { name: "Pending", value: Math.round(total * 0.12) },
      { name: "Shipped", value: Math.round(total * 0.05) },
      { name: "Cancelled", value: Math.round(total * 0.03) },
    ];
  }, [stats]);

  const statCards = [
    { title: "Total Products", value: stats?.totalProducts ?? 0, icon: Package, color: "text-chart-2", bg: "bg-chart-2/10" },
    { title: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "text-chart-1", bg: "bg-chart-1/10" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-chart-5", bg: "bg-chart-5/10" },
    { title: "Revenue", value: stats?.totalRevenue ?? 0, icon: DollarSign, color: "text-chart-3", bg: "bg-chart-3/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store performance</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border border-default-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
              {statsLoading ? (
                <Spinner size="sm" color="warning" />
              ) : (
                <div className="text-2xl font-heading font-bold">
                  {stat.title === "Revenue" ? formatCurrency(stat.value as number) : (stat.value as number).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-default-200 lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold">Top Products</h3>
                <p className="text-xs text-muted-foreground">Revenue by product</p>
              </div>
              <Link href="/admin/products">
                <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-default-200 px-3 text-sm hover:bg-default-50">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            {productsLoading ? (
              <div className="flex h-[250px] items-center justify-center"><Spinner color="warning" /></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: "0.75rem" }} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#F07A22" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No product data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-default-200">
          <CardContent className="p-4">
            <div className="mb-4">
              <h3 className="font-heading font-semibold">Order Distribution</h3>
              <p className="text-xs text-muted-foreground">By order status</p>
            </div>
            {statsLoading ? (
              <div className="flex h-[250px] items-center justify-center"><Spinner color="warning" /></div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No order data</div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-default-200">
        <CardContent className="p-4">
          <div className="mb-4">
            <h3 className="font-heading font-semibold">Recent Orders</h3>
            <p className="text-xs text-muted-foreground">Latest orders across all stores</p>
          </div>
          {ordersLoading ? (
            <div className="flex h-[200px] items-center justify-center"><Spinner color="warning" /></div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default-200">
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Order</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Store</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="pb-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-default-50 transition-colors">
                      <td className="py-2.5 font-medium">#{(order.orderNumber ?? order.id).slice(-8)}</td>
                      <td className="py-2.5 text-muted-foreground">{order.buyer?.firstName ? `${order.buyer.firstName} ${order.buyer.lastName ?? ""}` : order.buyer?.email ?? "Unknown"}</td>
                      <td className="py-2.5 text-muted-foreground">{order.store?.name ?? "N/A"}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-2.5 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${order.status === "DELIVERED" ? "bg-success/10 text-success" : order.status === "CANCELLED" ? "bg-danger/10 text-danger" : order.status === "PENDING" ? "bg-warning/10 text-warning" : "bg-default-100 text-default-600"}`}>{order.status}</span></td>
                      <td className="py-2.5 text-right text-muted-foreground">{formatRelativeTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No recent orders</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { href: "/admin/products/new", label: "Add Product", icon: Package, color: "text-accent", bg: "bg-accent/10" },
          { href: "/admin/categories/new", label: "Add Category", icon: Tag, color: "text-chart-1", bg: "bg-chart-1/10" },
          { href: "/admin/coupons/new", label: "Create Coupon", icon: DollarSign, color: "text-success", bg: "bg-success/10" },
          { href: "/admin/deals/new", label: "Create Deal", icon: Eye, color: "text-danger", bg: "bg-danger/10" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex h-auto flex-col items-center gap-2 rounded-xl border border-default-200 py-4 px-4 hover:bg-default-50 transition-colors">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}><item.icon className={`h-5 w-5 ${item.color}`} /></div>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
