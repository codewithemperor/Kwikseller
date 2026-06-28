"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  CreditCard,
  Facebook,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  Shield,
  Smartphone,
  Store,
  Twitter,
  Zap,
} from "lucide-react";
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
    title: "Marketplace",
    links: [
      { label: "Vendor Stock", href: "/search?source=vendor-stock" },
      { label: "Pool Resale", href: "/pool" },
      { label: "Group Buy", href: "/group-buy" },
      { label: "Digital Products", href: "/search?type=digital" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { label: "Vendor Dashboard", href: "/register?role=VENDOR" },
      { label: "Inventory", href: "/register?role=VENDOR" },
      { label: "Pool Catalog", href: "/pool" },
      { label: "Order Handling", href: "/vendors" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/about" },
      { label: "Buyer Protection", href: "/terms" },
      { label: "Payments", href: "/pricing" },
      { label: "Contact", href: "/about" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/about" },
      { label: "Careers", href: "/about" },
      { label: "Status", href: "/about" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/kwikseller", label: "Facebook" },
  { icon: Twitter, href: "https://x.com/kwikseller", label: "X" },
  { icon: Instagram, href: "https://www.instagram.com/kwikseller", label: "Instagram" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/kwikseller", label: "LinkedIn" },
];

const bottomLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/privacy#cookies" },
  { label: "Sitemap", href: "/search" },
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
    <div className="flex items-center gap-2 border border-kwik-border bg-kwik-bg-surface px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5">
      <Icon className="h-4 w-4 text-kwik-gray dark:text-white/60" />
      <span className="text-xs font-medium text-kwik-dark-medium dark:text-white/75">{name}</span>
    </div>
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

  const handleNewsletterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address", {
        description: "Example: you@example.com",
      });
      return;
    }
    setIsSubmitting(true);
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
    <footer className="mt-auto bg-kwik-bg-page text-kwik-dark dark:bg-foreground dark:text-background">
      <div className="h-px bg-kwik-orange" />
      <div className="container mx-auto px-4 py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center bg-kwik-orange">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">KWIKSELLER</span>
            </div>
            <p className="max-w-[300px] text-sm leading-6 text-kwik-gray dark:text-white/65">
              A multi-platform commerce system for vendor stock, digital delivery, Pool resale, and group-buy selling.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex h-9 w-9 items-center justify-center border border-kwik-border text-kwik-gray transition hover:border-kwik-orange hover:text-kwik-orange dark:border-white/10 dark:text-white/70"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.a>
                );
              })}
            </div>

            <form onSubmit={handleNewsletterSubmit} className="mt-7 flex max-w-sm gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kwik-muted dark:text-white/45" />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  className="h-11 w-full border border-kwik-border bg-kwik-bg-surface pl-10 pr-3 text-sm text-kwik-dark outline-none transition placeholder:text-kwik-muted focus:border-kwik-orange disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/45"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-label="Subscribe"
                className="flex h-11 items-center gap-1.5 rounded-md bg-kwik-orange px-4 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span className="hidden sm:inline">Join</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-3 text-sm font-semibold">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-kwik-gray transition hover:text-kwik-orange dark:text-white/60">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-kwik-border pt-7 dark:border-white/10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentBadge name="Paystack" icon={Zap} />
            <PaymentBadge name="Flutterwave" icon={CreditCard} />
            <PaymentBadge name="Visa" icon={CreditCard} />
            <PaymentBadge name="Mastercard" icon={CreditCard} />
            <PaymentBadge name="Mobile Money" icon={Smartphone} />
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-kwik-gray dark:text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-kwik-orange" />
              Secure payments
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-kwik-orange" />
              Buyer protection
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-kwik-orange" />
              Support
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-kwik-border dark:border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <p className="text-xs text-kwik-gray dark:text-white/55">
            &copy; {new Date().getFullYear()} KWIKSELLER. Africa&apos;s commerce platform.
          </p>

          <div className="flex items-center gap-4">
            {bottomLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-kwik-gray transition hover:text-kwik-orange dark:text-white/55">
                {link.label}
              </a>
            ))}

            <AnimatePresence>
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 8 }}
                  transition={{ duration: 0.2 }}
                  onClick={scrollToTop}
                  title="Back to top"
                  className="ml-1 flex items-center gap-1.5 rounded-full bg-kwik-orange px-3.5 py-1.5 text-xs font-semibold text-white"
                  aria-label="Back to top"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span>Top</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </footer>
  );
}
