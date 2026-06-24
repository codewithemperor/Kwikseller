'use client';

import React from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { cn } from '../lib/utils';

export interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export function MiniSparkline({
  data,
  width = 120,
  height = 40,
  color,
  showArea = true,
  className,
}: MiniSparklineProps) {
  const strokeColor = color || 'var(--accent)';
  const chartData = data.map((value, idx) => ({ idx, value }));

  return (
    <div className={cn('inline-block', className)} style={{ width, height }}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${strokeColor.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          {showArea ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#spark-${strokeColor.replace(/[^a-z0-9]/gi, '')})`}
              isAnimationActive={false}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MiniSparkline;
