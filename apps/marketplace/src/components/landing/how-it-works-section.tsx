"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  PackageCheck,
  Wallet,
  Truck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

/**
 * HowItWorksSection — a homepage section explaining the 1688-style order
 * workflow for new buyers: Browse → Place order → Vendor quotes → Pay →
 * Receive → Confirm. Builds buyer understanding and confidence.
 */
export function HowItWorksSection() {
  const steps = [
    {
      icon: Search,
      title: "Browse & order",
      description: "Find products from verified vendors across Africa. Place your order — no payment needed yet.",
      color: "bg-primary-50 text-primary-600",
      step: "01",
    },
    {
      icon: PackageCheck,
      title: "Vendor quotes",
      description: "The vendor reviews your order and sends a quotation with the delivery fee, discounts, and ETA.",
      color: "bg-secondary-50 text-secondary-600",
      step: "02",
    },
    {
      icon: Wallet,
      title: "Pay securely",
      description: "Review the quotation and pay. Your money is held safely by KwisCrow escrow — not sent to the vendor yet.",
      color: "bg-success/10 text-success",
      step: "03",
    },
    {
      icon: Truck,
      title: "Track delivery",
      description: "The vendor ships your order. Track it through Processing → Shipped → Out for Delivery → Delivered.",
      color: "bg-primary-50 text-primary-600",
      step: "04",
    },
    {
      icon: CheckCircle2,
      title: "Confirm receipt",
      description: "Once delivered, click \"Received\" to release the payment to the vendor. Your funds, your control.",
      color: "bg-secondary-50 text-secondary-600",
      step: "05",
    },
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
      <div className="border-b border-border bg-surface px-5 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">
              New to Kwikseller?
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold text-foreground sm:text-2xl">
              How it works
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Order with confidence — our 1688-style workflow keeps you in control.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary-500 px-5 text-sm font-semibold text-white hover:bg-secondary-600"
          >
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Steps — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto p-5 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {steps.map((step, idx) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="relative flex min-w-[220px] flex-col lg:min-w-0"
          >
            {/* Step number badge */}
            <div className="mb-3 flex items-center gap-2">
              <span className="font-heading text-2xl font-bold text-gray-200">
                {step.step}
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${step.color}`}>
                <step.icon className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-gray-500">
              {step.description}
            </p>
            {/* Connector (desktop) */}
            {idx < steps.length - 1 ? (
              <div className="absolute -right-2 top-4 hidden lg:block">
                <ArrowRight className="h-3 w-3 text-gray-300" />
              </div>
            ) : null}
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA strip */}
      <div className="border-t border-border bg-primary-50 px-5 py-3">
        <p className="text-center text-xs leading-5 text-primary-800">
          <span className="font-semibold">Buyer protection guaranteed.</span>{" "}
          Every order is covered by KwisCrow escrow. If something goes wrong,
          open a dispute within 24 hours of delivery.
        </p>
      </div>
    </motion.section>
  );
}
