"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Star,
  MapPin,
  BadgeCheck,
  Package,
  TrendingUp,
  Calendar,
  ArrowRight,
  Award,
  ShoppingBag,
} from "lucide-react";
import { Button, Chip, Card } from "@heroui/react";
import { cn } from "@kwikseller/ui";

// ─── Data ───────────────────────────────────────────────────────

interface FeaturedSeller {
  name: string;
  initials: string;
  store: string;
  location: string;
  bio: string;
  stats: { label: string; value: string }[];
  products: { src: string; alt: string }[];
}

interface PreviousSeller {
  name: string;
  store: string;
  initials: string;
  location: string;
  rating: number;
  sales: string;
}

const featuredSeller: FeaturedSeller = {
  name: "Adaeze Okonkwo",
  initials: "AO",
  store: "AfriCraft Interiors",
  location: "Lagos, Nigeria",
  bio: "Specializing in handcrafted African home decor and furniture. Every piece tells a story of African craftsmanship.",
  stats: [
    { label: "Products", value: "2.5K" },
    { label: "Rating", value: "4.9" },
    { label: "Sales", value: "15K" },
    { label: "Since", value: "2021" },
  ],
  products: [
    {
      src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&h=200&fit=crop&q=80",
      alt: "Handcrafted African vase",
    },
    {
      src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&h=200&fit=crop&q=80",
      alt: "African woven basket decor",
    },
    {
      src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=200&h=200&fit=crop&q=80",
      alt: "Handmade African wooden sculpture",
    },
  ],
};

const previousSellers: PreviousSeller[] = [
  {
    name: "Kofi Mensah",
    store: "TechVault Ghana",
    initials: "KM",
    location: "Accra",
    rating: 4.8,
    sales: "8K",
  },
  {
    name: "Amina Hassan",
    store: "Sahara Fashion",
    initials: "AH",
    location: "Nairobi",
    rating: 4.9,
    sales: "12K",
  },
  {
    name: "Chidi Okafor",
    store: "Naija Electronics",
    initials: "CO",
    location: "Abuja",
    rating: 4.7,
    sales: "6K",
  },
];

// ─── Stat Badge ─────────────────────────────────────────────────

function StatBadge({
  icon: Icon,
  value,
  label,
}: {
  icon: React.FC<{ className?: string }>;
  value: string;
  label: string;
}) {
  const IconComponent = Icon as React.FC<{ className?: string }>;
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-default-100/80 px-4 py-3 min-w-[80px]">
      <IconComponent className="w-4 h-4 text-accent mb-0.5" />
      <span className="text-base font-bold text-foreground">{value}</span>
      <span className="text-[11px] text-default-400 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}

// ─── Previous Seller Card ───────────────────────────────────────

function PreviousSellerCard({
  seller,
  index,
}: {
  seller: PreviousSeller;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
      className="flex-1 min-w-[200px]"
    >
      <Card className="p-4 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer border border-transparent hover:border-accent/20">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm">
              {seller.initials}
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm truncate group-hover:text-accent transition-colors">
              {seller.name}
            </h4>
            <p className="text-xs text-default-400 truncate">{seller.store}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-default-400 flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {seller.location}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-warning">
                <Star className="w-3 h-3 fill-warning" />
                {seller.rating}
              </span>
              <span className="text-[11px] text-default-400">
                {seller.sales} sales
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Export ────────────────────────────────────────────────

export function SellerSpotlight() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isSectionInView = useInView(sectionRef, {
    once: true,
    margin: "-80px",
  });
  const isCardInView = useInView(cardRef, { once: true, margin: "-60px" });

  const statIcons = [Package, Star, TrendingUp, Calendar];

  return (
    <section className="py-20 bg-default-50/30 dark:bg-default-50/50 relative overflow-hidden">
      {/* Subtle decorative dots */}
      <div className="absolute inset-0 pattern-dots opacity-[0.03] pointer-events-none" />

      <div className="container mx-auto px-0 md:px-4  relative z-10">
        {/* Section Header */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={
            isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
          }
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Chip variant="soft" className="mb-4">
            <Award className="w-4 h-4 mr-1" />
            This Week
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Seller Spotlight
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto">
            Celebrating our most outstanding sellers who deliver exceptional
            products and service to customers across Africa.
          </p>
        </motion.div>

        {/* Featured Seller Card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={
            isCardInView
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 30, scale: 0.97 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto mb-14"
        >
          <Card className="p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-accent/20">
            {/* Avatar + Name Row */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Avatar with BadgeCheck overlay */}
              <div className="relative mb-4">
                <div className="w-[60px] h-[60px] rounded-full bg-accent flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {featuredSeller.initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-accent flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4 text-accent" />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-1">{featuredSeller.name}</h3>
              <p className="text-sm font-medium text-accent mb-1">
                {featuredSeller.store}
              </p>
              <div className="flex items-center gap-1 text-xs text-default-400">
                <MapPin className="w-3 h-3" />
                <span>{featuredSeller.location}</span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-default-500 text-center leading-relaxed mb-6 max-w-lg mx-auto">
              {featuredSeller.bio}
            </p>

            {/* Stats Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {featuredSeller.stats.map((stat, i) => (
                <StatBadge
                  key={stat.label}
                  icon={statIcons[i]}
                  value={stat.value}
                  label={stat.label}
                />
              ))}
            </div>

            {/* Sample Product Images */}
            <div className="flex justify-center gap-3 mb-6">
              {featuredSeller.products.map((product) => (
                <div
                  key={product.alt}
                  className="w-[80px] h-[80px] rounded-lg overflow-hidden border border-divider hover:border-accent/40 transition-colors group/img"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.src}
                    alt={product.alt}
                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="kwik-gradient text-white font-semibold shadow-clean-md">
                <ShoppingBag className="w-4 h-4 mr-1.5" />
                Visit Store
              </Button>
              <Button variant="ghost" className="font-medium">
                View All Products
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Previously Featured Sellers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isCardInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-default-400 uppercase tracking-wider">
              Previously Featured
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {previousSellers.map((seller, index) => (
              <PreviousSellerCard
                key={seller.name}
                seller={seller}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
