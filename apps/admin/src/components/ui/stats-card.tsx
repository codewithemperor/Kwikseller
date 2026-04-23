"use client";

import React from "react";
import { Card, CardContent, Spinner } from "@heroui/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@kwikseller/utils";

export interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
  bg?: string;
  format?: "number" | "currency";
  isLoading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "text-accent",
  bg = "bg-accent/10",
  format = "number",
  isLoading = false,
  trend,
  className,
}: StatsCardProps) {
  const displayValue =
    isLoading
      ? null
      : format === "currency"
        ? formatCurrency(Number(value))
        : typeof value === "number"
          ? value.toLocaleString()
          : value;

  return (
    <Card className={cn("border border-default-200", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              bg,
            )}
          >
            <Icon className={cn("h-4 w-4", color)} />
          </div>
        </div>
        {isLoading ? (
          <Spinner size="sm" color="warning" />
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-heading font-bold">
              {displayValue ?? "—"}
            </div>
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-danger",
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}% from last month
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
