"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@kwikseller/ui";
import {
  Leaf,
  Sprout,
  Recycle,
  ShoppingBag,
  Star,
  ArrowRight,
  TreePine,
} from "lucide-react";
import { Card, Chip, Button } from "@heroui/react";
import { useCartStore } from "@/stores";

// ─── Data ────────────────────────────────────────────────────

const ecoProducts = [
  {
    id: "eco1",
    name: "Organic Shea Butter",
    price: 3200,
    store: "Natural Glow Store",
    city: "Lagos",
    tags: ["Organic", "Fair Trade"],
    rating: 4.8,
    reviews: 142,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    id: "eco2",
    name: "Recycled Glass Beads",
    price: 5800,
    store: "Craft Heritage",
    city: "Accra",
    tags: ["Recycled", "Handmade"],
    rating: 4.9,
    reviews: 89,
    iconBg: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "eco3",
    name: "Bamboo Kitchen Set",
    price: 8500,
    store: "Green Living",
    city: "Nairobi",
    tags: ["Biodegradable", "Organic"],
    rating: 4.7,
    reviews: 63,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "eco4",
    name: "Natural Dye Fabric",
    price: 12000,
    store: "Adire Masters",
    city: "Lagos",
    tags: ["Handmade", "Natural"],
    rating: 5.0,
    reviews: 217,
    iconBg: "bg-lime-100 dark:bg-lime-900/30",
    iconColor: "text-lime-600 dark:text-lime-400",
  },
];

const ecoStats = [
  { icon: Leaf, label: "Eco Products", value: "10K+", color: "text-green-500" },
  {
    icon: Sprout,
    label: "Green Sellers",
    value: "2K+",
    color: "text-emerald-500",
  },
  {
    icon: Recycle,
    label: "Waste Saved",
    value: "500+ Tons",
    color: "text-teal-500",
  },
];

// ─── Animation Helpers ──────────────────────────────────────

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerChild({
  children,
  className = "",
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut" as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function EcoFriendlyProducts() {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <section className="py-10 sm:py-16 bg-default-50/50 dark:bg-default-50/30">
      <div className="container mx-auto px-0 md:px-4 ">
        {/* Section Header */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Chip variant="soft" color="success" size="sm">
                <Leaf className="w-3.5 h-3.5 mr-1" />
                Sustainable
              </Chip>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Eco-Friendly Finds
            </h2>
            <p className="text-sm text-default-500 max-w-md mx-auto">
              Shop products that are good for you and the planet
            </p>
          </div>
        </AnimatedSection>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {ecoProducts.map((product, index) => (
            <StaggerChild key={product.id} index={index}>
              <Card className="border border-default-200 dark:border-default-100 bg-background shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                {/* Product Image Placeholder */}
                <div className="relative h-40 overflow-hidden">
                  <div
                    className={cn(
                      "w-full h-full flex items-center justify-center",
                      product.iconBg,
                    )}
                  >
                    <TreePine
                      className={cn("w-16 h-16 opacity-30", product.iconColor)}
                    />
                  </div>
                  {/* Eco Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider">
                      <Leaf className="w-2.5 h-2.5" />
                      Eco Verified
                    </span>
                  </div>
                  {/* Quick add to cart */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      addItem({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        image: "",
                      })
                    }
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:opacity-100"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                  <p className="text-xs text-default-400 mb-2">
                    {product.store} · {product.city}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Rating + Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                      <span className="text-xs font-medium">
                        {product.rating}
                      </span>
                      <span className="text-[10px] text-default-400">
                        ({product.reviews})
                      </span>
                    </div>
                    <span className="text-sm font-bold text-accent">
                      ₦{product.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </StaggerChild>
          ))}
        </div>

        {/* Eco Stats */}
        <AnimatedSection delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {ecoStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 px-5 py-4 rounded-xl bg-background border border-default-200 dark:border-default-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-xs text-default-400">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection delay={0.4}>
          <div className="text-center">
            <Button
              variant="bordered"
              className="border-accent text-accent hover:bg-accent/5 press-scale"
              onPress={() => {
                const el = document.getElementById("categories");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore All Eco Products
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
