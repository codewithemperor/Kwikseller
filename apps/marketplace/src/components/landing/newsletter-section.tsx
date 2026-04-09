'use client'

import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { Button, Input } from '@heroui/react'
import { kwikToast } from '@kwikseller/utils'

export function NewsletterSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      kwikToast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSuccess(true)
    setEmail('')
    kwikToast.success('🎉 Welcome aboard! Check your inbox for confirmation.')

    // Reset success state after a delay
    setTimeout(() => setIsSuccess(false), 5000)
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-3xl mx-auto text-center kwik-gradient rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />

            <div className="relative">
              <Mail className="w-10 h-10 mx-auto mb-4 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Stay in the Loop</h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Subscribe to our newsletter for the latest updates, tips for growing your business,
                and exclusive offers from KWIKSELLER.
              </p>

              {isSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center gap-3 py-4"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">You&apos;re subscribed!</div>
                    <div className="text-sm text-white/70">Check your inbox for a welcome email</div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    variant="secondary"
                    value={email}
                    onValueChange={setEmail}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                    classNames={{
                      inputWrapper: 'bg-white/10 border-white/20 hover:bg-white/15',
                      input: 'text-white placeholder:text-white/50',
                    }}
                    isDisabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="bg-white text-accent hover:bg-white/90 font-semibold px-8"
                    isDisabled={isSubmitting}
                    isLoading={isSubmitting}
                  >
                    Subscribe
                    {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </form>
              )}

              <p className="text-white/50 text-xs mt-4">
                No spam, ever. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
