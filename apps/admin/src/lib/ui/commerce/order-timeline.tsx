'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export type OrderTimelineStepStatus = 'completed' | 'current' | 'upcoming';

export interface OrderTimelineStep {
  label: string;
  status: OrderTimelineStepStatus;
  timestamp?: string;
  description?: string;
  icon?: LucideIcon;
}

export interface OrderTimelineProps {
  steps: OrderTimelineStep[];
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

function formatTimestamp(iso?: string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

/**
 * OrderTimeline — a step-by-step order/delivery status timeline.
 * Used by buyer order detail, vendor order detail, and admin order detail.
 *
 * - Completed steps: green filled check
 * - Current step: orange pulse with ring glow
 * - Upcoming steps: gray outline
 *
 * Steps stagger in on mount via Framer Motion.
 */
export function OrderTimeline({
  steps,
  direction = 'vertical',
  className,
}: OrderTimelineProps) {
  if (direction === 'horizontal') {
    return <HorizontalTimeline steps={steps} className={className} />;
  }

  return (
    <motion.ol
      className={cn('relative space-y-6', className)}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {steps.map((step, idx) => (
        <TimelineItem key={`${step.label}-${idx}`} step={step} index={idx} isLast={idx === steps.length - 1} />
      ))}
    </motion.ol>
  );
}

function TimelineItem({
  step,
  index,
  isLast,
}: {
  step: OrderTimelineStep;
  index: number;
  isLast: boolean;
}) {
  const Icon = step.icon;
  const ts = formatTimestamp(step.timestamp);

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, x: -8 },
        show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
      }}
      className="relative flex gap-4"
    >
      {/* Icon + connecting line */}
      <div className="flex flex-col items-center">
        <StepIcon status={step.status} icon={Icon} />
        {!isLast && (
          <div
            className={cn(
              'mt-1 w-0.5 flex-1',
              step.status === 'completed' ? 'bg-accent' : 'bg-kwik-border',
            )}
            style={{ minHeight: '1.5rem' }}
          />
        )}
      </div>

      {/* Label + timestamp + description */}
      <div className="flex-1 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p
            className={cn(
              'text-sm font-semibold',
              step.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {step.label}
          </p>
          {ts && (
            <time className="text-xs text-muted-foreground" dateTime={step.timestamp}>
              {ts}
            </time>
          )}
        </div>
        {step.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
        )}
      </div>
    </motion.li>
  );
}

function StepIcon({
  status,
  icon: Icon,
}: {
  status: OrderTimelineStepStatus;
  icon?: LucideIcon;
}) {
  if (status === 'completed') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-white">
        {Icon ? <Icon className="h-4 w-4" /> : <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
    );
  }

  if (status === 'current') {
    return (
      <motion.span
        animate={{ boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent)' }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
      >
        {Icon ? <Icon className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
      </motion.span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-kwik-border bg-surface text-muted-foreground">
      {Icon ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
    </span>
  );
}

function HorizontalTimeline({
  steps,
  className,
}: {
  steps: OrderTimelineStep[];
  className?: string;
}) {
  return (
    <motion.ol
      className={cn('flex w-full items-start', className)}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isLast = idx === steps.length - 1;
        const ts = formatTimestamp(step.timestamp);
        return (
          <motion.li
            key={`${step.label}-${idx}`}
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
            }}
            className="flex min-w-0 flex-1 flex-col items-center text-center"
          >
            <div className="flex w-full items-center">
              <div className={cn('h-0.5 flex-1', idx === 0 ? 'opacity-0' : step.status === 'completed' ? 'bg-accent' : 'bg-kwik-border')} />
              <StepIcon status={step.status} icon={Icon} />
              <div className={cn('h-0.5 flex-1', isLast ? 'opacity-0' : step.status === 'completed' ? 'bg-accent' : 'bg-kwik-border')} />
            </div>
            <p
              className={cn(
                'mt-2 px-1 text-xs font-semibold',
                step.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {step.label}
            </p>
            {ts && (
              <time className="mt-0.5 text-[10px] text-muted-foreground" dateTime={step.timestamp}>
                {ts}
              </time>
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

export default OrderTimeline;
