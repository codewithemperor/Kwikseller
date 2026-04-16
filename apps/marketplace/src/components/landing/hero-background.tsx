'use client'

import React from 'react'

/**
 * HeroBackground - Simple subtle dot pattern background for the hero section
 * Features:
 * - Static dot pattern overlay
 * - Floating geometric shapes (circles, triangles, squares)
 * - Respects prefers-reduced-motion
 */

interface FloatingShape {
  id: number
  x: number
  y: number
  size: number
  type: 'circle' | 'triangle' | 'square' | 'ring'
  color: string
  opacity: number
}

const shapes: FloatingShape[] = [
  { id: 1, x: 10, y: 20, size: 20, type: 'circle', color: 'bg-accent/20', opacity: 0.6 },
  { id: 2, x: 85, y: 15, size: 14, type: 'triangle', color: 'bg-warning/20', opacity: 0.5 },
  { id: 3, x: 75, y: 70, size: 24, type: 'ring', color: 'border-accent/20', opacity: 0.4 },
  { id: 4, x: 20, y: 75, size: 16, type: 'square', color: 'bg-success/15', opacity: 0.5 },
  { id: 5, x: 90, y: 45, size: 10, type: 'circle', color: 'bg-danger/15', opacity: 0.4 },
  { id: 6, x: 5, y: 50, size: 18, type: 'triangle', color: 'bg-accent/15', opacity: 0.3 },
  { id: 7, x: 50, y: 10, size: 12, type: 'ring', color: 'border-warning/15', opacity: 0.3 },
  { id: 8, x: 65, y: 85, size: 8, type: 'circle', color: 'bg-accent/25', opacity: 0.5 },
  { id: 9, x: 30, y: 30, size: 22, type: 'square', color: 'bg-warning/10', opacity: 0.3 },
  { id: 10, x: 55, y: 65, size: 15, type: 'circle', color: 'bg-success/20', opacity: 0.4 },
  { id: 11, x: 40, y: 85, size: 11, type: 'triangle', color: 'bg-danger/10', opacity: 0.35 },
  { id: 12, x: 95, y: 80, size: 20, type: 'ring', color: 'border-success/15', opacity: 0.25 },
]

function ShapeRenderer({ shape }: { shape: FloatingShape }) {
  const { type, size, color, opacity } = shape

  if (type === 'circle') {
    return (
      <div
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
      <div
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
      </div>
    )
  }

  if (type === 'square') {
    return (
      <div
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
    <div
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
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle flat background tint */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent/5" />
      <div className="absolute -bottom-10 -right-20 w-96 h-96 rounded-full bg-accent/5" />

      {/* Static dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Static floating shapes */}
      {shapes.map((shape) => (
        <ShapeRenderer key={shape.id} shape={shape} />
      ))}

      {/* Subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.02]" />
    </div>
  )
}
