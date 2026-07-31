"use client";

import React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Star, ArrowRight, Store, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "./home-feed-page";

/**
 * SellerSpotlightSection — a homepage section showcasing top-rated vendors.
 * Builds trust and drives discovery of verified stores.
 */
export function SellerSpotlightSection() {
  const vendors = [
    {
      name: "Zara's Collection",
      slug: "zara-collection",
      category: "Fashion & Apparel",
      location: "Lagos, Nigeria",
      rating: 4.8,
      reviewCount: 1240,
      productCount: 184,
      salesCount: "12K+",
      cover: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80",
      isVerified: true,
      badge: "Top Rated",
    },
    {
      name: "TechHub Africa",
      slug: "techhub-africa",
      category: "Electronics",
      location: "Abuja, Nigeria",
      rating: 4.6,
      reviewCount: 890,
      productCount: 120,
      salesCount: "8.5K+",
      cover: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80",
      isVerified: true,
      badge: "Best Seller",
    },
    {
      name: "Glow Beauty Bar",
      slug: "glow-beauty-bar",
      category: "Health & Beauty",
      location: "Port Harcourt, Nigeria",
      rating: 4.9,
      reviewCount: 670,
      productCount: 95,
      salesCount: "5.2K+",
      cover: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
      isVerified: true,
      badge: "Rising Star",
    },
    {
      name: "HomeVibe Decor",
      slug: "homevibe-decor",
      category: "Home & Living",
      location: "Ibadan, Nigeria",
      rating: 4.7,
      reviewCount: 420,
      productCount: 110,
      salesCount: "3.1K+",
      cover: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=600&q=80",
      isVerified: true,
      badge: "Trusted",
    },
  ];

  const badgeColors: Record<string, string> = {
    "Top Rated": "bg-secondary-500 text-white",
    "Best Seller": "bg-primary-500 text-white",
    "Rising Star": "bg-success text-white",
    Trusted: "bg-warning text-white",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
    >
      {/* Section header */}
      <SectionHeader
            title="Vendor storefronts"
            description="Verified stores with their own public marketplace pages."
            action={
              <Link href="/vendors" className="inline-flex shrink-0 items-center gap-1 bg-kwik-orange px-3 py-2 text-xs font-semibold text-white">
                View more <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />

      {/* Vendor cards grid */}
       <div className="container-px bg-white py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vendors.map((vendor, idx) => (
          <motion.div
            key={vendor.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
          >
            <Link
              href={`/vendor/${vendor.slug}`}
              className="group block overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-primary-300 hover:shadow-md"
            >
              {/* Cover image */}
              <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vendor.cover}
                  alt={vendor.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Badge */}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColors[vendor.badge]}`}
                >
                  {vendor.badge}
                </span>
                {/* Sales count overlay */}
                <div className="absolute bottom-2 right-2 rounded-lg bg-black/50 px-2 py-0.5 backdrop-blur">
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-white">
                    <TrendingUp className="h-3 w-3" />
                    {vendor.salesCount} sales
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {vendor.name}
                  </h3>
                  {vendor.isVerified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary-500" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {vendor.category} · {vendor.location}
                </p>

                {/* Stats row */}
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    <span className="font-semibold text-foreground">{vendor.rating}</span>
                    <span className="text-gray-400">({vendor.reviewCount})</span>
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">
                    {vendor.productCount} products
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      </div>
    </motion.section>
  );
}
