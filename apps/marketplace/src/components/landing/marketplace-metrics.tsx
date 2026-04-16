"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Activity, TrendingUp, Package, Clock, Heart } from "lucide-react";
import { Chip } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Metric Data ─────────────────────────────────────────────

interface MetricData {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sparkline: number[];
}

const metrics: MetricData[] = [
  {
    label: "Total GMV",
    value: "₦2.4B",
    change: "+18.3%",
    isPositive: true,
    icon: TrendingUp,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    sparkline: [40, 55, 45, 65, 58, 75, 90],
  },
  {
    label: "Active Orders",
    value: "12,847",
    change: "+24.1%",
    isPositive: true,
    icon: Package,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    sparkline: [30, 42, 50, 38, 62, 70, 85],
  },
  {
    label: "Avg. Delivery Time",
    value: "2.3 days",
    change: "-12.5%",
    isPositive: true, // Negative change in delivery time is good
    icon: Clock,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    sparkline: [80, 72, 65, 58, 50, 45, 38],
  },
  {
    label: "Seller Satisfaction",
    value: "97.2%",
    change: "+2.1%",
    isPositive: true,
    icon: Heart,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    sparkline: [60, 65, 68, 72, 78, 82, 95],
  },
];

// ─── Weekly Activity Data ────────────────────────────────────

const weeklyActivity = [
  { day: "Mon", value: 68 },
  { day: "Tue", value: 85 },
  { day: "Wed", value: 72 },
  { day: "Thu", value: 92 },
  { day: "Fri", value: 100 },
  { day: "Sat", value: 78 },
  { day: "Sun", value: 45 },
];

// ─── Sparkline Mini Chart ────────────────────────────────────

function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const maxVal = Math.max(...data);

  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((val, i) => {
        const height = Math.max(8, (val / maxVal) * 100);
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${height}%` }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              ease: "easeOut" as const,
              delay: i * 0.06,
            }}
            className={cn(
              "w-2 rounded-sm",
              color,
              "opacity-60",
              i === data.length - 1 ? "opacity-100" : "",
            )}
          />
        );
      })}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────

function MetricCard({ metric, index }: { metric: MetricData; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = metric.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{
        duration: 0.55,
        delay: index * 0.1,
        ease: "easeOut" as const,
      }}
    >
      <div className="p-5 md:p-6 rounded-2xl bg-background border border-divider hover-lift transition-shadow duration-300 h-full">
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
              metric.iconBg,
            )}
          >
            <Icon className={cn("w-5 h-5", metric.iconColor)} />
          </div>

          {/* Sparkline */}
          <div className="hidden sm:block">
            <SparklineChart
              data={metric.sparkline}
              color={metric.iconColor.replace("text-", "bg-")}
            />
          </div>
        </div>

        {/* Value */}
        <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 tabular-nums">
          {metric.value}
        </div>

        {/* Label */}
        <p className="text-sm text-muted mb-2">{metric.label}</p>

        {/* Change */}
        <div className="flex items-center gap-1">
          <TrendingUp
            className={cn(
              "w-3.5 h-3.5",
              metric.isPositive ? "text-success" : "text-danger",
              metric.label === "Avg. Delivery Time" ? "rotate-180" : "",
            )}
          />
          <span
            className={cn(
              "text-xs font-semibold",
              metric.isPositive ? "text-success" : "text-danger",
            )}
          >
            {metric.change}
          </span>
          <span className="text-xs text-muted">
            {metric.label === "Avg. Delivery Time"
              ? "faster"
              : "from last month"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Weekly Activity Chart ───────────────────────────────────

function WeeklyActivityChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const maxVal = Math.max(...weeklyActivity.map((d) => d.value));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, ease: "easeOut" as const, delay: 0.4 }}
    >
      <div className="p-5 md:p-6 rounded-2xl bg-background border border-divider">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Weekly Activity
        </h3>

        <div className="flex items-end justify-between gap-2 sm:gap-4 h-40">
          {weeklyActivity.map((item, index) => {
            const height = Math.max(8, (item.value / maxVal) * 100);
            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center gap-2"
              >
                {/* Tooltip value */}
                <span className="text-xs font-medium text-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {item.value}%
                </span>

                {/* Bar */}
                <div
                  className="w-full flex justify-center"
                  style={{ height: "120px" }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut" as const,
                      delay: index * 0.08,
                    }}
                    className={cn(
                      "w-full max-w-[48px] rounded-lg",
                      index === 4 // Friday = peak
                        ? "bg-accent"
                        : "bg-default-200 dark:bg-default-300",
                      "relative group cursor-default",
                    )}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.value}%
                    </div>
                  </motion.div>
                </div>

                {/* Day label */}
                <span
                  className={cn(
                    "text-xs font-medium",
                    index === 4 ? "text-accent" : "text-muted",
                  )}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────

export function MarketplaceMetrics() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Subtle dot pattern overlay */}
      <div className="pattern-dots absolute inset-0 opacity-30 pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* ─── Section Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 28 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
          }
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-12"
        >
          <Chip
            variant="soft"
            className="mb-4 bg-success/10 text-success border border-success/20"
          >
            <Activity className="w-3.5 h-3.5 mr-1" />
            <span className="relative flex items-center gap-1.5">
              Live
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            </span>
          </Chip>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Marketplace Insights
          </h2>

          <p className="text-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Real-time performance metrics that showcase the growth and
            reliability of the KWIKSELLER marketplace.
          </p>
        </motion.div>

        {/* ─── Metrics Grid ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto mb-6">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} index={index} />
          ))}
        </div>

        {/* ─── Weekly Activity Chart ─── */}
        <div className="max-w-4xl mx-auto">
          <WeeklyActivityChart />
        </div>
      </div>
    </section>
  );
}
