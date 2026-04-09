'use client'

import React, { useState, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scaleX = useSpring(scrollProgress / 100, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Re-sync spring value when scrollProgress changes
  useEffect(() => {
    scaleX.set(scrollProgress / 100)
  }, [scrollProgress, scaleX])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] kwik-gradient z-[100] origin-left"
      style={{ scaleX }}
    />
  )
}
