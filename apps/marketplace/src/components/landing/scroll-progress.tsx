'use client'

import React, { useState, useEffect } from 'react'
import { motion, useSpring, AnimatePresence } from 'framer-motion'

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setScrollProgress(progress)

      // Only show when scrolled at least 5%
      setIsVisible(progress > 5)
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
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          exit={{ scaleY: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-kwik-orange to-kwik-orange/60 origin-left"
            style={{ scaleX }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
