'use client'

import React from 'react'
import { Button, Input } from '@heroui/react'
import { cn } from '../lib/utils'
import { Minus, Plus } from 'lucide-react'

export interface QuantitySelectorProps {
  value: number
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onChange: (value: number) => void
  className?: string
}

/**
 * QuantitySelector - A shared quantity selector component
 * Uses HeroUI Button and Input components
 */
export function QuantitySelector({
  value,
  min = 1,
  max = 999,
  step = 1,
  size = 'md',
  disabled = false,
  onChange,
  className,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue))
      onChange(clampedValue)
    }
  }

  const sizeClasses = {
    sm: { button: 'sm', input: 'h-8 text-sm' },
    md: { button: 'md', input: 'h-10 text-base' },
    lg: { button: 'lg', input: 'h-12 text-lg' },
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        isIconOnly
        size={sizeClasses[size].button as 'sm' | 'md' | 'lg'}
        variant="ghost"
        onPress={handleDecrement}
        isDisabled={disabled || value <= min}
        className="min-w-8"
      >
        <Minus className="w-4 h-4" />
      </Button>
      
      <Input
        type="number"
        value={value.toString()}
        onChange={handleInputChange}
        disabled={disabled}
        className={cn('w-16 text-center', sizeClasses[size].input)}
      />
      
      <Button
        isIconOnly
        size={sizeClasses[size].button as 'sm' | 'md' | 'lg'}
        variant="ghost"
        onPress={handleIncrement}
        isDisabled={disabled || value >= max}
        className="min-w-8"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}

export default QuantitySelector
