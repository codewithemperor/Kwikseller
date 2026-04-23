"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { Separator } from "@heroui/react";
import { toast } from "sonner";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Marketplace", href: "#" },
      { label: "Vendor Dashboard", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Features", href: "#" },
      { label: "API Docs", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press Kit", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Seller Support", href: "#" },
      { label: "Buyer Protection", href: "#" },
      { label: "Community", href: "#" },
      { label: "Status Page", href: "#" },
    ],
  },
  {
    title: "Download",
    links: [
      { label: "iOS App", href: "#" },
      { label: "Android App", href: "#" },
      { label: "Desktop App", href: "#" },
      { label: "Browser Extension", href: "#" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

const bottomLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Sitemap", href: "#" },
];

function PaymentBadge({
  name,
  icon,
}: {
  name: string;
  icon: React.ElementType;
}) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-kwik-bg-surface dark:bg-kwik-bg-light border border-kwik-border">
      <Icon className="w-4 h-4 text-kwik-gray-light" />
      <span className="text-xs font-medium text-kwik-gray">{name}</span>
    </div>
  );
}

function MiniAppBadge({ store }: { store: "apple" | "google" }) {
  return (
    <motion.a
      href="#"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2 bg-kwik-bg-surface dark:bg-kwik-bg-light hover:bg-kwik-border/50 rounded-lg px-3 py-2 transition-all duration-200"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0 text-kwik-dark-medium"
      >
        {store === "apple" ? (
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        ) : (
          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
        )}
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-[8px] text-kwik-muted">
          {store === "apple" ? "Download on" : "GET IT ON"}
        </span>
        <span className="text-[11px] font-semibold -mt-px text-kwik-dark-medium">
          {store === "apple" ? "App Store" : "Google Play"}
        </span>
      </div>
    </motion.a>
  );
}

export function EnhancedFooter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address", {
        description: "Example: you@example.com",
      });
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    toast.success("Successfully subscribed!", {
      description: "You'll receive the latest deals and updates at " + email.trim(),
    });
    setEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-auto">
      {/* Gradient border-top */}
      <div className="h-px bg-gradient-to-r from-kwik-orange via-kwik-orange/50 to-transparent" />
      {/* Main footer content */}
      <div className="container mx-auto px-0 md:px-4  pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-6">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg kwik-gradient flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                KWIKSELLER
              </span>
            </div>
            <p className="text-sm text-default-500 leading-relaxed mb-5 max-w-[260px]">
              Africa&apos;s most powerful commerce operating system. Buy and
              sell with confidence across the continent.
            </p>

            {/* Social icons with hover bg animation */}
            <div className="flex items-center gap-2 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-lg bg-kwik-bg-surface dark:bg-kwik-bg-light flex items-center justify-center text-kwik-gray-light transition-all duration-200 hover:bg-kwik-orange/10 hover:text-kwik-orange"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                );
              })}
            </div>

            {/* Mini Newsletter */}
            <div className="rounded-2xl bg-gradient-to-br from-kwik-bg-warm to-kwik-bg-page dark:from-kwik-bg-warm dark:to-kwik-bg-page p-4 -mx-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-kwik-orange mb-3">
                Stay Updated
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kwik-muted pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-xl border border-kwik-border bg-kwik-bg-surface dark:bg-kwik-bg-light pl-10 pr-3 text-sm text-foreground placeholder:text-kwik-muted outline-none transition-all duration-200 focus:border-kwik-orange focus:ring-2 focus:ring-kwik-orange/20 hover:border-kwik-border-light disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label="Subscribe"
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-kwik-orange px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-kwik-orange-hover hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">Subscribe</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Link Columns with left-border hover */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold text-sm mb-3">{column.title}</h4>
              <ul className="space-y-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="block text-sm text-kwik-gray hover:text-kwik-orange pl-2 border-l-2 border-transparent hover:border-kwik-orange transition-all duration-200 -ml-2"
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
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-kwik-gray-light">
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="w-4 h-4 text-kwik-orange" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Lock className="w-4 h-4 text-kwik-orange" />
            <span>Escrow Protection</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Mail className="w-4 h-4 text-kwik-orange" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Copyright bar with frosted glass */}
      <div className="border-t border-kwik-border">
        <div className="bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-0 md:px-4  py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-kwik-muted">
                &copy; {new Date().getFullYear()} KWIKSELLER. All rights reserved.
                Africa&apos;s Commerce Platform.
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {bottomLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-xs text-kwik-muted hover:text-kwik-orange transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

              <AnimatePresence>
                {showBackToTop && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 8 }}
                    transition={{ duration: 0.2 }}
                    onClick={scrollToTop}
                    title="Back to top"
                    className="flex items-center gap-1.5 rounded-full bg-kwik-orange px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-kwik-orange-hover hover:shadow-md active:scale-95 ml-2"
                    aria-label="Back to top"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Back to top</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
