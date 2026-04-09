'use client'

import React, { useSyncExternalStore, useCallback } from 'react'
import { motion } from 'framer-motion'

/**
 * HeroBackground - Animated decorative background for the hero section
 * Features:
 * - Animated mesh gradient with color-shifting blobs
 * - Floating geometric shapes (circles, triangles, squares) with parallax
 * - Subtle grid pattern overlay
 * - Respects prefers-reduced-motion
 */

// External store for prefers-reduced-motion
function usePrefersReducedMotion() {
  const subscribe = useCallback((callback: () => void) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', callback)
    return () => mq.removeEventListener('change', callback)
  }, [])

  const getSnapshot = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const getServerSnapshot = useCallback(() => true, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

interface FloatingShape {
  id: number
  x: number
  y: number
  size: number
  type: 'circle' | 'triangle' | 'square' | 'ring'
  color: string
  duration: number
  delay: number
  opacity: number
}

const shapes: FloatingShape[] = [
  { id: 1, x: 10, y: 20, size: 20, type: 'circle', color: 'bg-accent/20', duration: 6, delay: 0, opacity: 0.6 },
  { id: 2, x: 85, y: 15, size: 14, type: 'triangle', color: 'bg-warning/20', duration: 8, delay: 1, opacity: 0.5 },
  { id: 3, x: 75, y: 70, size: 24, type: 'ring', color: 'border-accent/20', duration: 7, delay: 0.5, opacity: 0.4 },
  { id: 4, x: 20, y: 75, size: 16, type: 'square', color: 'bg-success/15', duration: 9, delay: 2, opacity: 0.5 },
  { id: 5, x: 90, y: 45, size: 10, type: 'circle', color: 'bg-danger/15', duration: 5, delay: 1.5, opacity: 0.4 },
  { id: 6, x: 5, y: 50, size: 18, type: 'triangle', color: 'bg-accent/15', duration: 10, delay: 0.8, opacity: 0.3 },
  { id: 7, x: 50, y: 10, size: 12, type: 'ring', color: 'border-warning/15', duration: 7, delay: 3, opacity: 0.3 },
  { id: 8, x: 65, y: 85, size: 8, type: 'circle', color: 'bg-accent/25', duration: 4, delay: 2.5, opacity: 0.5 },
  { id: 9, x: 30, y: 30, size: 22, type: 'square', color: 'bg-warning/10', duration: 11, delay: 1.2, opacity: 0.3 },
  { id: 10, x: 55, y: 65, size: 15, type: 'circle', color: 'bg-success/20', duration: 6.5, delay: 0.3, opacity: 0.4 },
  { id: 11, x: 40, y: 85, size: 11, type: 'triangle', color: 'bg-danger/10', duration: 8.5, delay: 1.8, opacity: 0.35 },
  { id: 12, x: 95, y: 80, size: 20, type: 'ring', color: 'border-success/15', duration: 9.5, delay: 0.7, opacity: 0.25 },
]

function ShapeRenderer({ shape }: { shape: FloatingShape }) {
  const { type, size, color, duration, delay, opacity } = shape

  const baseMotion = {
    animate: {
      y: [0, -15, 5, -10, 0],
      rotate: type === 'square' ? [0, 45, 90, 45, 0] : [0, 10, -5, 10, 0],
      scale: [1, 1.1, 0.95, 1.05, 1],
    },
    transition: {
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  }

  if (type === 'circle') {
    return (
      <motion.div
        {...baseMotion}
        className={`absolute rounded-full ${color}`}
        style={{
          width: size,
          height: size,
          left: `${shape.x}%`,
          top: `${shape.y}%`,
          opacity,
        }}
      />
    )
  }

  if (type === 'triangle') {
    return (
      <motion.div
        {...baseMotion}
        className="absolute"
        style={{
          width: 0,
          height: 0,
          left: `${shape.x}%`,
          top: `${shape.y}%`,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid currentColor`,
          color: 'currentColor',
          opacity,
        }}
      >
        <div className={`w-full h-full ${color}`} style={{ filter: 'blur(0.5px)' }} />
      </motion.div>
    )
  }

  if (type === 'square') {
    return (
      <motion.div
        {...baseMotion}
        className={`absolute rounded-sm ${color}`}
        style={{
          width: size,
          height: size,
          left: `${shape.x}%`,
          top: `${shape.y}%`,
          opacity,
        }}
      />
    )
  }

  // Ring type
  return (
    <motion.div
      {...baseMotion}
      className={`absolute rounded-full ${color} border-2`}
      style={{
        width: size,
        height: size,
        left: `${shape.x}%`,
        top: `${shape.y}%`,
        opacity,
      }}
    />
  )
}

export function HeroBackground() {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) {
    // Fallback: static gradient background
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated mesh gradient blobs */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[100px]"
          animate={{
            x: [0, 50, -30, 20, 0],
            y: [0, -30, 40, -10, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-20 w-[600px] h-[600px] rounded-full bg-warning/6 blur-[120px]"
          animate={{
            x: [0, -40, 30, -20, 0],
            y: [0, 30, -40, 15, 0],
            scale: [1, 0.9, 1.15, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-success/4 blur-[150px]"
          animate={{
            x: [0, 25, -15, 10, 0],
            y: [0, -20, 25, -15, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating shapes */}
      {shapes.map((shape) => (
        <ShapeRenderer key={shape.id} shape={shape} />
      ))}

      {/* Radial glow at center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/[0.02]" />
    </div>
  )
}
