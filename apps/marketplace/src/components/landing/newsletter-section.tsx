"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check, Sparkles, Users, TrendingUp } from "lucide-react";
import { kwikToast } from "@/lib/toast";

/**
 * NewsletterSection — a homepage section for email subscription with social
 * proof stats. Builds community and captures leads.
 */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      kwikToast.error("Invalid email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      kwikToast.success(
        "Subscribed!",
        "You're now on the list for exclusive deals and updates.",
      );
      setEmail("");
    }, 800);
  }

  const stats = [
    { icon: Users, value: "50K+", label: "Subscribers" },
    { icon: TrendingUp, value: "12K+", label: "Weekly deals shared" },
    { icon: Sparkles, value: "₦2.5M", label: "Saved by community" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="kwik-gradient relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />

        <div className="relative mx-auto max-w-xl text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Mail className="h-6 w-6 text-white" />
          </div>

          {/* Heading */}
          <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
            Join the Kwikseller community
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/85">
            Get exclusive deals, early access to flash sales, and insider tips
            delivered to your inbox. Join 50,000+ smart shoppers.
          </p>

          {/* Form */}
          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-3 backdrop-blur"
            >
              <Check className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">
                You&rsquo;re subscribed! Watch your inbox for deals.
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                aria-label="Email address"
                className="h-11 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 backdrop-blur focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary-500 px-5 text-sm font-semibold text-white hover:bg-secondary-600 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Subscribing…
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          )}

          <p className="mt-3 text-[11px] text-white/60">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      
    </motion.section>
  );
}
