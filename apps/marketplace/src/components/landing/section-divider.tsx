'use client'

import React, { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@kwikseller/ui'

interface SectionDividerProps {
  icon?: LucideIcon
  label?: string
  className?: string
}

export function SectionDivider({ icon: Icon, label, className }: SectionDividerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn('flex items-center justify-center py-6 md:py-10', className)}
      role="separator"
    >
      <div className="flex items-center w-full max-w-md">
        <div className="flex-1 h-px bg-accent/40" />

        {/* Center chip / icon / label */}
        <div className="flex items-center justify-center px-4">
          {Icon && label ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ) : Icon ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 border border-accent/15 text-accent">
              <Icon className="w-4 h-4" />
            </div>
          ) : label ? (
            <span className="text-xs font-medium text-accent/60 tracking-wider uppercase">
              {label}
            </span>
          ) : (
            <div className="w-2 h-2 rounded-full bg-accent/30" />
          )}
        </div>

        <div className="flex-1 h-px bg-accent/40" />
      </div>
    </motion.div>
  )
}
