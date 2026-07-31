"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Flame, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * FlashDealsSection — a homepage section showcasing time-limited deals with
 * a live countdown timer. Creates urgency and drives conversions.
 */

interface FlashDeal {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  discount: number;
  soldPercent: number;
  href: string;
}

const deals: FlashDeal[] = [
  {
    id: "fd-1",
    name: "Wireless Bluetooth Earbuds Pro",
    price: 32000,
    originalPrice: 45000,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=400&q=80",
    discount: 29,
    soldPercent: 78,
    href: "/products/bp-6",
  },
  {
    id: "fd-2",
    name: "Smart Fitness Watch",
    price: 28500,
    originalPrice: 38000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
    discount: 25,
    soldPercent: 65,
    href: "/products/bp-7",
  },
  {
    id: "fd-3",
    name: "Power Bank 20000mAh",
    price: 14500,
    originalPrice: 26000,
    image: "https://images.unsplash.com/photo-1609592424823-2a0d2d1e8a8a?auto=format&fit=crop&w=400&q=80",
    discount: 44,
    soldPercent: 92,
    href: "/products/bp-10",
  },
  {
    id: "fd-4",
    name: "Ankara Print Maxi Dress",
    price: 18500,
    originalPrice: 24000,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80",
    discount: 23,
    soldPercent: 54,
    href: "/products/bp-1",
  },
];

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function useCountdown(targetTime: Date) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = targetTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  return timeLeft;
}

function CountdownTimer() {
  // Countdown to end of day (creates urgency, resets daily)
  const [targetTime, setTargetTime] = useState<Date | null>(null);

  useEffect(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    setTargetTime(end);
  }, []);

  const timeLeft = useCountdown(targetTime ?? new Date());

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-lg bg-white/15 px-2 py-1 text-sm font-bold text-white tabular-nums backdrop-blur">
        {pad(timeLeft.hours)}
      </span>
      <span className="text-white/75 font-bold">:</span>
      <span className="rounded-lg bg-white/15 px-2 py-1 text-sm font-bold text-white tabular-nums backdrop-blur">
        {pad(timeLeft.minutes)}
      </span>
      <span className="text-white/75 font-bold">:</span>
      <span className="rounded-lg bg-white/15 px-2 py-1 text-sm font-bold text-white tabular-nums backdrop-blur">
        {pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

export function FlashDealsSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {/* Header with countdown */}
      <div className="kwik-gradient relative overflow-hidden px-5 py-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                Limited time
              </p>
              <h2 className="font-heading text-xl font-bold text-white">
                Flash Deals
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-white/75 sm:inline">Ends in</span>
            <CountdownTimer />
          </div>
        </div>
      </div>

      {/* Deals grid */}
      <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-5">
        {deals.map((deal, idx) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.06 }}
          >
            <Link
              href={deal.href}
              className="group block overflow-hidden rounded-xl border border-border bg-background transition hover:border-primary-300 hover:shadow-md"
            >
              {/* Image with discount badge */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={deal.image}
                  alt={deal.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute left-1.5 top-1.5 rounded-lg bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -{deal.discount}%
                </span>
                {/* Sold progress overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 shrink-0 text-secondary-400" />
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-secondary-500"
                        style={{ width: `${deal.soldPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-white">{deal.soldPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <h3 className="line-clamp-1 text-xs font-semibold text-foreground">
                  {deal.name}
                </h3>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-danger">
                    {formatNGN(deal.price)}
                  </span>
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatNGN(deal.originalPrice)}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* View all CTA */}
      <div className="border-t border-border px-5 py-3 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          View all deals <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.section>
  );
}
