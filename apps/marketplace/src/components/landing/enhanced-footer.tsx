'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Store,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  ArrowRight,
  ArrowUp,
  Shield,
  Lock,
  Smartphone,
  CreditCard,
  Zap,
} from 'lucide-react'
import { Button, Input, Separator } from '@heroui/react'
import { kwikToast } from '@kwikseller/utils'

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  title: string
  links: FooterLink[]
}

const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Marketplace', href: '#' },
      { label: 'Vendor Dashboard', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Features', href: '#' },
      { label: 'API Docs', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Press Kit', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Seller Support', href: '#' },
      { label: 'Buyer Protection', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Status Page', href: '#' },
    ],
  },
  {
    title: 'Download',
    links: [
      { label: 'iOS App', href: '#' },
      { label: 'Android App', href: '#' },
      { label: 'Desktop App', href: '#' },
      { label: 'Browser Extension', href: '#' },
    ],
  },
]

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

const bottomLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'Sitemap', href: '#' },
]

function PaymentBadge({ name, icon }: { name: string; icon: React.ElementType }) {
  const Icon = icon
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-default-50 border border-default-100">
      <Icon className="w-4 h-4 text-default-500" />
      <span className="text-xs font-medium text-default-500">{name}</span>
    </div>
  )
}

function MiniAppBadge({ store }: { store: 'apple' | 'google' }) {
  return (
    <motion.a
      href="#"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2 bg-default-100 hover:bg-default-200 rounded-lg px-3 py-2 transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0 text-default-600"
      >
        {store === 'apple' ? (
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        ) : (
          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
        )}
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-[8px] text-default-400">
          {store === 'apple' ? 'Download on' : 'GET IT ON'}
        </span>
        <span className="text-[11px] font-semibold -mt-px text-default-600">
          {store === 'apple' ? 'App Store' : 'Google Play'}
        </span>
      </div>
    </motion.a>
  )
}

export function EnhancedFooter() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      kwikToast.error('Please enter a valid email address')
      return
    }
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsSubmitting(false)
    setEmail('')
    kwikToast.success('Thanks for subscribing! Check your inbox.')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="border-t border-divider mt-auto">
      {/* Main footer content */}
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-6">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg kwik-gradient flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">KWIKSELLER</span>
            </div>
            <p className="text-sm text-default-500 leading-relaxed mb-5 max-w-[260px]">
              Africa&apos;s most powerful commerce operating system. Buy and sell
              with confidence across the continent.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-lg bg-default-100 hover:bg-accent hover:text-white flex items-center justify-center text-default-500 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                )
              })}
            </div>

            {/* Mini Newsletter */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-default-400 mb-2">
                Stay Updated
              </p>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex gap-1.5"
              >
                <Input
                  type="email"
                  placeholder="Your email"
                  size="sm"
                  variant="bordered"
                  value={email}
                  onValueChange={setEmail}
                  classNames={{
                    inputWrapper: 'h-9 bg-default-50',
                    input: 'text-xs',
                  }}
                  isDisabled={isSubmitting}
                />
                <Button
                  type="submit"
                  size="sm"
                  isIconOnly
                  className="h-9 w-9 min-w-9 kwik-gradient text-white"
                  isLoading={isSubmitting}
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold text-sm mb-3">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-default-500 hover:text-accent transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment methods & App store badges */}
        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Payment methods */}
          <div className="flex flex-wrap items-center gap-2">
            <PaymentBadge name="Paystack" icon={Zap} />
            <PaymentBadge name="Flutterwave" icon={CreditCard} />
            <PaymentBadge name="Visa" icon={CreditCard} />
            <PaymentBadge name="Mastercard" icon={CreditCard} />
            <PaymentBadge name="Mobile Money" icon={Smartphone} />
          </div>

          {/* App store badges */}
          <div className="flex items-center gap-2">
            <MiniAppBadge store="apple" />
            <MiniAppBadge store="google" />
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-default-400">
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="w-4 h-4" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Lock className="w-4 h-4" />
            <span>Escrow Protection</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Mail className="w-4 h-4" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-divider">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-default-400">
              &copy; {new Date().getFullYear()} KWIKSELLER. All rights reserved.
              Africa&apos;s Commerce Platform.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {bottomLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs text-default-400 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <button
                onClick={scrollToTop}
                className="flex items-center gap-1 text-xs text-default-400 hover:text-accent transition-colors ml-2"
                aria-label="Back to top"
              >
                <ArrowUp className="w-3 h-3" />
                <span>Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
