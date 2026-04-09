'use client'

import React, { useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import { ShoppingCart, Heart, Star, Eye, TrendingUp, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { Button, Chip, Card } from '@heroui/react'
import { useCartStore, useWishlistStore } from '@/stores'
import { kwikToast } from '@kwikseller/utils'
import { QuickViewModal, QuickViewProduct } from '@/components/landing/quick-view-modal'
import { ProductFilterChips } from '@/components/landing/product-filter-chips'

// Sample product data for the landing page with categories
const trendingProducts = [
  {
    id: '1',
    name: 'Premium Ankara Fabric Bundle',
    price: 12500,
    comparePrice: 18000,
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 234,
    store: 'Fabrics by Nneka',
    isNew: true,
    category: 'fashion',
    images: [
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '2',
    name: 'Wireless Bluetooth Earbuds Pro',
    price: 8500,
    comparePrice: 12000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop',
    rating: 4.6,
    reviewCount: 189,
    store: 'TechHub Lagos',
    isNew: false,
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '3',
    name: 'Organic Shea Butter 500g',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 412,
    store: 'Natural Glow GH',
    isNew: false,
    category: 'beauty',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '4',
    name: 'Handcrafted Leather Sandals',
    price: 15000,
    comparePrice: 22000,
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop',
    rating: 4.7,
    reviewCount: 156,
    store: 'Aso Oke Designs',
    isNew: true,
    category: 'fashion',
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '5',
    name: 'Stainless Steel Water Bottle',
    price: 4500,
    comparePrice: 6000,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
    rating: 4.5,
    reviewCount: 98,
    store: 'EcoWear Nairobi',
    isNew: false,
    category: 'home',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '6',
    name: 'Smart Watch Fitness Tracker',
    price: 28000,
    comparePrice: 35000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    rating: 4.4,
    reviewCount: 321,
    store: 'GadgetWorld KE',
    isNew: false,
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '7',
    name: 'Hibiscus Hair Growth Oil',
    price: 2800,
    comparePrice: 4000,
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 567,
    store: 'Afro Beauty Lab',
    isNew: true,
    category: 'beauty',
    images: [
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '8',
    name: 'Jollof Rice Spice Mix Kit',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 892,
    store: "Mama's Kitchen",
    isNew: false,
    category: 'food',
    images: [
      'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '9',
    name: 'iPhone 15 Pro Phone Case',
    price: 5500,
    comparePrice: 7500,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop',
    rating: 4.3,
    reviewCount: 145,
    store: 'CaseMaster NG',
    isNew: false,
    category: 'phones',
    images: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '10',
    name: 'Handwoven Kente Throw Pillow',
    price: 9200,
    comparePrice: 13000,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&h=400&fit=crop',
    rating: 4.7,
    reviewCount: 78,
    store: 'Ghana Home Decor',
    isNew: true,
    category: 'home',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '11',
    name: 'Samsung Galaxy Buds FE',
    price: 22000,
    comparePrice: 28000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop',
    rating: 4.5,
    reviewCount: 234,
    store: 'PhoneZone Accra',
    isNew: false,
    category: 'phones',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=600&fit=crop',
    ],
  },
  {
    id: '12',
    name: 'Premium Ogbono Soup Pack',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=400&fit=crop',
    rating: 4.6,
    reviewCount: 345,
    store: 'Naija Foods Co',
    isNew: false,
    category: 'food',
    images: [
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&h=600&fit=crop',
    ],
  },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ProductCardProps {
  product: typeof trendingProducts[0]
  index: number
  onQuickView: (product: QuickViewProduct) => void
}

function ProductCardItem({ product, index, onQuickView }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const addItem = useCartStore((s) => s.addItem)
  const { toggleItem, isInWishlist } = useWishlistStore()
  const isWished = isInWishlist(product.id)

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.image,
      store: product.store,
    })
    kwikToast.success(`${product.name} added to cart!`)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.comparePrice,
      image: product.image,
      rating: product.rating,
      category: product.category,
    })
    kwikToast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist!')
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ring-1 ring-accent/0 hover:ring-accent/20">
        <div className="relative aspect-square overflow-hidden bg-default-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {discount > 0 && (
              <Chip size="sm" color="danger" className="shadow-sm">
                -{discount}%
              </Chip>
            )}
            {product.isNew && (
              <Chip size="sm" color="success" className="shadow-sm">
                New
              </Chip>
            )}
          </div>

          {/* Quick actions overlay */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-xl bg-background/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onQuickView(product as QuickViewProduct)
              }}
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-9 h-9 rounded-xl bg-background/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-colors ${
                isWished
                  ? 'bg-danger text-danger-foreground'
                  : 'hover:bg-danger hover:text-danger-foreground'
              }`}
              onClick={handleWishlistToggle}
              aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Add to cart button at bottom of image on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <Button
              size="sm"
              className="w-full bg-background/95 backdrop-blur-sm shadow-lg hover:bg-accent hover:text-accent-foreground font-medium transition-all duration-300"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative">
                Add to Cart
                <span className="absolute inset-0 bg-gradient-to-r from-accent via-warning to-accent bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                  Add to Cart
                </span>
              </span>
            </Button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-1.5">
          <span className="text-xs text-accent font-medium">{product.store}</span>
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-accent transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              <Star className="w-3.5 h-3.5 fill-warning text-warning" />
              <span className="text-xs font-semibold ml-1">{product.rating}</span>
            </div>
            <span className="text-xs text-default-400">
              ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-bold text-base text-accent">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-xs text-default-400 line-through">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function TrendingProducts() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const [quickViewProduct, setQuickViewProduct] = React.useState<QuickViewProduct | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredProducts = activeFilter === 'all'
    ? trendingProducts
    : trendingProducts.filter((p) => p.category === activeFilter)

  const productCount = filteredProducts.length

  return (
    <>
      <section className="py-20 bg-default-50">
        <div className="container mx-auto px-4">
          <motion.div
            ref={sectionRef}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <Chip variant="soft" className="mb-4">
                <TrendingUp className="w-4 h-4 mr-1" />
                Hot Right Now
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trending Products</h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                Discover what&apos;s popular across Africa&apos;s fastest-growing marketplace.
              </p>
            </div>
          </motion.div>

          {/* Filter Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <SlidersHorizontal className="w-4 h-4 text-default-400" />
              <span className="text-sm font-medium text-default-500">Filter by category</span>
              <span className="text-xs text-default-400 ml-auto">{productCount} products</span>
            </div>
            <ProductFilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </motion.div>

          {/* Product Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {filteredProducts.map((product, index) => (
                <ProductCardItem
                  key={product.id}
                  product={product}
                  index={index}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-default-400">No products found in this category.</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-10"
          >
            <Button variant="outline" size="lg">
              View All Products
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  )
}
