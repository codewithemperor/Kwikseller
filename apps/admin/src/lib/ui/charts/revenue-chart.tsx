'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, formatCurrency } from '../lib/utils';
import { SkeletonCard } from '../feedback/skeleton';

export interface RevenueChartProps {
  data: Array<{ label: string; value: number; compareValue?: number }>;
  type?: 'bar' | 'line' | 'area';
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  color?: string;
  format?: 'currency' | 'number' | 'percentage';
  currency?: string;
  isLoading?: boolean;
  className?: string;
}

function formatYAxis(value: number, format: RevenueChartProps['format']): string {
  if (format === 'currency') {
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
    return `₦${value}`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function ChartTooltip({ active, payload, label, format }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-kwik-border bg-background p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-xs" style={{ color: entry.color || entry.stroke }}>
          {entry.name}: {format === 'currency' ? formatCurrency(entry.value) : format === 'percentage' ? `${entry.value}%` : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
  type = 'bar',
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  color,
  format = 'currency',
  isLoading = false,
  className,
}: RevenueChartProps) {
  const strokeColor = color || 'var(--accent)';
  const compareColor = 'var(--muted-foreground)';

  if (isLoading) {
    return <SkeletonCard className={cn('h-[300px]', className)} />;
  }

  const commonProps = {
    data,
    width: '100%' as const,
    height,
  };

  const axisProps = {
    stroke: 'var(--muted-foreground)',
    fontSize: 12,
    tickFormatter: (v: number) => formatYAxis(v, format),
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer {...commonProps}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={<ChartTooltip format={format} />} cursor={{ fill: 'var(--accent)', fillOpacity: 0.05 }} />}
            {showLegend && <Legend />}
            <Bar dataKey="value" name="Revenue" fill={strokeColor} radius={[6, 6, 0, 0]} maxBarSize={48} />
            {data[0]?.compareValue !== undefined && (
              <Bar dataKey="compareValue" name="Compare" fill={compareColor} radius={[6, 6, 0, 0]} maxBarSize={48} />
            )}
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={<ChartTooltip format={format} />} />}
            {showLegend && <Legend />}
            <Line type="monotone" dataKey="value" name="Revenue" stroke={strokeColor} strokeWidth={2.5} dot={{ r: 3, fill: strokeColor }} />
            {data[0]?.compareValue !== undefined && (
              <Line type="monotone" dataKey="compareValue" name="Compare" stroke={compareColor} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            )}
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={<ChartTooltip format={format} />} />}
            {showLegend && <Legend />}
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" name="Revenue" stroke={strokeColor} strokeWidth={2.5} fill="url(#revenueGradient)" />
            {data[0]?.compareValue !== undefined && (
              <Area type="monotone" dataKey="compareValue" name="Compare" stroke={compareColor} strokeWidth={2} strokeDasharray="5 5" fill="none" />
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;
