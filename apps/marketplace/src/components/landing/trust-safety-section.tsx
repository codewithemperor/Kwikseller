"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/**
 * TrustSafetySection — a homepage section showcasing the KwisCrow escrow
 * protection system. Builds buyer trust by explaining the protection
 * lifecycle: Pay → Escrow holds → Confirm receipt → Vendor paid.
 */
export function TrustSafetySection() {
  const steps = [
    {
      icon: Lock,
      title: "Pay securely",
      description: "Your payment is processed by Paystack and held safely in KwisCrow escrow — never sent directly to the vendor.",
      color: "bg-primary-50 text-primary-600",
    },
    {
      icon: ShieldCheck,
      title: "Funds held in escrow",
      description: "KwisCrow holds your money until you confirm your order was delivered successfully. The vendor can't access it yet.",
      color: "bg-secondary-50 text-secondary-600",
    },
    {
      icon: CheckCircle2,
      title: "Confirm receipt",
      description: "Once your package arrives, click \"Received\" to release the payment to the vendor. Your funds, your control.",
      color: "bg-success/10 text-success",
    },
    {
      icon: RefreshCw,
      title: "Dispute protection",
      description: "Not happy? Open a dispute within 24 hours of delivery and your funds stay frozen until it's resolved.",
      color: "bg-warning/10 text-warning",
    },
  ];

  const stats = [
    { value: "₦0", label: "Lost to scams", subtext: "Escrow-protected" },
    { value: "24h", label: "Dispute window", subtext: "Buyer protection" },
    { value: "100%", label: "Verified vendors", subtext: "KYC checked" },
    { value: "15+", label: "Countries served", subtext: "Across Africa" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {/* Header */}
      <div className="kwik-gradient relative overflow-hidden px-5 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                Buyer Protection
              </p>
              <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
                KwisCrow Escrow — Shop with confidence
              </h2>
            </div>
          </div>
          <p className="text-sm leading-5 text-white/85 sm:max-w-xs">
            Every purchase is protected. Your money stays safe until you confirm
            your order arrives.
          </p>
        </div>
      </div>

      {/* 4-step protection lifecycle */}
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="relative"
          >
            {/* Connector arrow (desktop) */}
            {idx < steps.length - 1 ? (
              <div className="absolute -right-2 top-7 z-10 hidden lg:block">
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
            ) : null}
            <div className="flex h-full flex-col rounded-xl border border-border bg-background p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Step {idx + 1}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-gray-500">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface px-4 py-3 text-center"
          >
            <p className="font-heading text-xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {stat.label}
            </p>
            <p className="text-[10px] text-gray-400">{stat.subtext}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
