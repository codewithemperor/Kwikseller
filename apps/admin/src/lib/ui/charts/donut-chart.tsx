'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn, formatCurrency } from '../lib/utils';
import { SkeletonCard } from '../feedback/skeleton';

export interface DonutChartData {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutChartData[];
  height?: number;
  innerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  format?: 'currency' | 'number' | 'percentage';
  isLoading?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  'var(--accent)',
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export function DonutChart({
  data,
  height = 300,
  innerRadius = 60,
  showLegend = true,
  showLabels = true,
  format = 'number',
  isLoading = false,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return <SkeletonCard className={cn('h-[300px]', className)} />;
  }

  const formatValue = (v: number) =>
    format === 'currency' ? formatCurrency(v) : format === 'percentage' ? `${v}%` : v.toLocaleString();

  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row', className)}>
      <div style={{ height, flex: '1 1 60%' }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={Math.min(height / 2 - 10, innerRadius + 40)}
              paddingAngle={2}
              label={showLabels ? (entry: any) => `${((entry.value / total) * 100).toFixed(0)}%` : false}
              labelLine={false}
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload || payload.length === 0) return null;
                const entry = payload[0];
                return (
                  <div className="rounded-xl border border-kwik-border bg-background p-3 shadow-lg">
                    <p className="text-xs font-semibold text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{formatValue(entry.value)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((entry.value / total) * 100).toFixed(1)}%
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {showLegend && (
        <div className="flex flex-1 flex-col justify-center gap-2">
          {data.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                />
                <span className="text-muted-foreground">{entry.label}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{formatValue(entry.value)}</p>
                <p className="text-xs text-muted-foreground">
                  {((entry.value / total) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DonutChart;
