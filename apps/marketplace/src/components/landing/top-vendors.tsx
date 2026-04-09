'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, Store, MapPin, Award, ArrowRight } from 'lucide-react'
import { Button, Card, Chip, Avatar } from '@heroui/react'

const topVendors = [
  {
    id: '1',
    name: "Nneka's Fabrics",
    slug: 'nnekas-fabrics',
    avatar: 'NF',
    description: 'Premium African fabrics and textiles',
    location: 'Lagos, Nigeria',
    rating: 4.9,
    reviewCount: 1240,
    totalSales: '15K+',
    badge: 'Top Seller',
    isVerified: true,
    accentColor: 'from-pink-500 to-rose-500',
  },
  {
    id: '2',
    name: 'TechHub Ghana',
    slug: 'techhub-ghana',
    avatar: 'TH',
    description: 'Electronics and gadgets at best prices',
    location: 'Accra, Ghana',
    rating: 4.8,
    reviewCount: 890,
    totalSales: '8K+',
    badge: 'Verified',
    isVerified: true,
    accentColor: 'from-cyan-500 to-blue-500',
  },
  {
    id: '3',
    name: "Fati's Kitchen",
    slug: 'fatis-kitchen',
    avatar: 'FK',
    description: 'Authentic African food and spices',
    location: 'Abuja, Nigeria',
    rating: 4.9,
    reviewCount: 2100,
    totalSales: '25K+',
    badge: 'Top Seller',
    isVerified: true,
    accentColor: 'from-orange-500 to-amber-500',
  },
  {
    id: '4',
    name: 'EcoWear Nairobi',
    slug: 'ecowear-nairobi',
    avatar: 'EW',
    description: 'Sustainable fashion and accessories',
    location: 'Nairobi, Kenya',
    rating: 4.7,
    reviewCount: 560,
    totalSales: '4K+',
    badge: 'Rising Star',
    isVerified: true,
    accentColor: 'from-green-500 to-emerald-500',
  },
]

function VendorCard({ vendor, index }: { vendor: typeof topVendors[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
    >
      <Card className="group p-6 h-full cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-transparent hover:border-accent/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${vendor.accentColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
              {vendor.avatar}
            </div>
            {vendor.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center border-2 border-background">
                <Award className="w-3 h-3 text-success-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{vendor.name}</h3>
              <Chip
                size="sm"
                variant="soft"
                className="text-[10px] shrink-0"
              >
                {vendor.badge}
              </Chip>
            </div>
            <div className="flex items-center gap-1 text-xs text-default-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{vendor.location}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-default-500 mb-4">{vendor.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-warning text-warning" />
            <span className="text-sm font-semibold">{vendor.rating}</span>
            <span className="text-xs text-default-400">({vendor.reviewCount.toLocaleString()})</span>
          </div>
          <div className="text-xs text-default-400">
            <Store className="w-3 h-3 inline mr-1" />
            {vendor.totalSales} sales
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function TopVendors() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <Chip variant="soft" className="mb-4">
              <Store className="w-4 h-4 mr-1" />
              Featured Stores
            </Chip>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Top Vendors</h2>
            <p className="text-default-500 max-w-2xl mx-auto">
              Meet our highest-rated sellers delivering exceptional products and service across Africa.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {topVendors.map((vendor, index) => (
            <VendorCard key={vendor.id} vendor={vendor} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg">
            Explore All Stores
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
