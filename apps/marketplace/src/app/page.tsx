// KWIKSELLER - Landing Page
// Africa's Most Powerful Commerce Operating System

'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Store,
  Truck,
  Shield,
  Coins,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Star,
  LogOut,
  User,
  Menu,
  X,
  UserPlus,
  Search,
  Package,
  ShoppingBag,
  Sparkles,
  Flower2,
  Home,
  Car,
  ChevronDown,
  HelpCircle,
} from 'lucide-react'
import {
  Button,
  Card,
  Chip,
  Separator,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
  AccordionHeading,
  AccordionBody,
  AccordionIndicator,
} from '@heroui/react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { OfflineBanner, cn } from '@kwikseller/ui'
import { useAuth, kwikToast } from '@kwikseller/utils'
import { useCartStore, useWishlistStore } from '@/stores'
import { ThemeToggle } from '@/components/theme-toggle'
import { FloatingButtons } from '@/components/landing/floating-buttons'
import { TrendingProducts } from '@/components/landing/trending-products'
import { TopVendors } from '@/components/landing/top-vendors'
import { SocialProof } from '@/components/landing/social-proof'
import { NewsletterSection } from '@/components/landing/newsletter-section'
import { TestimonialCarousel } from '@/components/landing/testimonial-carousel'
import { CartDrawer } from '@/components/landing/cart-drawer'
import { PromoBanner } from '@/components/landing/promo-banner'
import { ScrollProgress } from '@/components/landing/scroll-progress'
import { MobileBottomNav } from '@/components/landing/mobile-bottom-nav'
import { RecentlyViewed } from '@/components/landing/recently-viewed'
import { AppPromoBanner } from '@/components/landing/app-promo-banner'
import { EnhancedFooter } from '@/components/landing/enhanced-footer'
import { HeroBackground } from '@/components/landing/hero-background'
import { LiveActivityFeed } from '@/components/landing/live-activity-feed'
import { CookieConsentBanner } from '@/components/landing/cookie-consent-banner'
import { DealsOfTheDay } from '@/components/landing/deals-of-the-day'
import { TrustIndicators } from '@/components/landing/trust-indicators'
import { VendorOnboarding } from '@/components/landing/vendor-onboarding'
import { AfricaCoverageMap } from '@/components/landing/africa-coverage-map'
import { EnhancedSearchOverlay } from '@/components/landing/enhanced-search-overlay'
import { MegaNav } from '@/components/landing/mega-menu'
import { ComparePanel } from '@/components/landing/compare-panel'
import { SectionDivider } from '@/components/landing/section-divider'
import { StatsTicker } from '@/components/landing/stats-ticker'
import { PoolSellingExplainer } from '@/components/landing/pool-selling-explainer'
import { KwikCoinsRewards } from '@/components/landing/kwikcoins-rewards'
import { SellerStories } from '@/components/landing/seller-stories'
import { DeliveryTracker } from '@/components/landing/delivery-tracker'
import { WishlistSidebar } from '@/components/landing/wishlist-sidebar'
import { NotificationBell } from '@/components/landing/notification-bell'
import { InteractiveFeatures } from '@/components/landing/interactive-features'
import { VideoTestimonials } from '@/components/landing/video-testimonials'
import { ProductRatingWidget } from '@/components/landing/product-rating-widget'
import { KwikCoinsWallet } from '@/components/landing/kwikcoins-wallet'
import { VendorSpotlight } from '@/components/landing/vendor-spotlight'
import { PageLoader } from '@/components/landing/page-loader'
import { CommunityMilestones } from '@/components/landing/community-milestones'

// ─── Animation helpers ─────────────────────────────────────────────

function AnimatedSection({
  children,
  className = '',
  delay = 0,
  once = true,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  once?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerChild({ children, className = '', index = 0 }: { children: React.ReactNode; className?: string; index?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function CounterAnimation({ target, suffix = '', display }: { target: number; suffix?: string; display?: string }) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        setDone(true)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])

  return (
    <span ref={ref}>
      {done && display ? display : `${count.toLocaleString()}${suffix}`}
    </span>
  )
}

// ─── Mobile Drawer Content ────────────────────────────────────────

function MobileDrawerContent({
  onClose,
  isAuthenticated,
  user,
  isAuthLoading,
  handleLogout,
  router,
}: {
  onClose: () => void
  isAuthenticated: boolean
  user: any
  isAuthLoading: boolean
  handleLogout: () => void
  router: ReturnType<typeof useRouter>
}) {
  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ]

  const handleNavClick = (href: string) => {
    onClose()
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex flex-col h-full py-6 px-6">
      {/* Close button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg kwik-gradient flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">KWIKSELLER</span>
        </div>
        <Button isIconOnly variant="ghost" onPress={onClose} aria-label="Close menu">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-2 mb-8">
        {navLinks.map((link) => (
          <button
            key={link.href}
            onClick={() => handleNavClick(link.href)}
            className="text-left px-4 py-3 rounded-xl text-default-500 hover:text-foreground hover:bg-default-50 transition-colors text-base font-medium"
          >
            {link.label}
          </button>
        ))}
      </nav>

      <Separator className="mb-6" />

      {/* Auth buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        {isAuthLoading ? null : isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-default-50">
              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold">
                {(user.profile?.firstName || user.email.split('@')[0]).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-sm">{user.profile?.firstName || user.email.split('@')[0]}</div>
                <div className="text-xs text-default-500">{user.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onPress={() => {
                handleLogout()
                onClose()
              }}
              isDisabled={isAuthLoading}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="w-full"
              onPress={() => {
                router.push('/login')
                onClose()
              }}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              className="w-full kwik-shadow"
              onPress={() => {
                router.push('/register')
                onClose()
              }}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page Component ───────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1800)
    return () => clearTimeout(timer)
  }, [])
  const cartItemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0))
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const wishlistItemCount = useWishlistStore((s) => s.itemCount)

  const handleLogout = async () => {
    try {
      await logout()
      kwikToast.success('Logged out successfully')
      router.refresh()
    } catch {
      kwikToast.error('Failed to log out')
    }
  }

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  // ─── Data ──────────────────────────────────────────────────
  const features = [
    {
      icon: Store,
      title: 'Create Your Store',
      description: 'Set up your online store in minutes with our intuitive dashboard and start selling today.',
    },
    {
      icon: ShoppingCart,
      title: 'Sell Products',
      description: 'List unlimited products, manage inventory, and fulfill orders with ease.',
    },
    {
      icon: Coins,
      title: 'KwikCoins Rewards',
      description: 'Earn rewards for every sale and milestone. Use coins for ads and premium features.',
    },
    {
      icon: Truck,
      title: 'Delivery Network',
      description: 'Connect with our rider network for reliable delivery across Africa.',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Escrow-protected transactions with Paystack and Flutterwave integration.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Access analytics, advertising tools, and the product pool to scale your store.',
    },
  ]

  const howItWorksSteps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Create Account',
      description: 'Sign up for free in seconds. Set up your vendor profile and customize your store.',
    },
    {
      number: 2,
      icon: Search,
      title: 'Browse Products',
      description: 'Explore thousands of products across multiple categories or add your own listings.',
    },
    {
      number: 3,
      icon: ShoppingBag,
      title: 'Place Order',
      description: 'Add items to cart, choose payment method, and checkout securely with escrow protection.',
    },
    {
      number: 4,
      icon: Package,
      title: 'Get Delivery',
      description: 'Track your order in real-time. Our rider network delivers to your doorstep across Africa.',
    },
  ]

  const categories = [
    { icon: Sparkles, title: 'Fashion', count: '12K+', color: 'from-pink-500/10 to-rose-500/10' },
    { icon: Car, title: 'Electronics', count: '8K+', color: 'from-blue-500/10 to-cyan-500/10' },
    { icon: Flower2, title: 'Food & Drinks', count: '15K+', color: 'from-green-500/10 to-emerald-500/10' },
    { icon: Star, title: 'Beauty', count: '6K+', color: 'from-purple-500/10 to-violet-500/10' },
    { icon: Home, title: 'Home & Garden', count: '9K+', color: 'from-amber-500/10 to-yellow-500/10' },
    { icon: Truck, title: 'Automobiles', count: '4K+', color: 'from-red-500/10 to-orange-500/10' },
  ]

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for getting started',
      features: ['Up to 10 products', 'Basic analytics', 'Standard support', '15% platform fee'],
      popular: false,
    },
    {
      name: 'Growth',
      price: '₦5,000',
      yearlyPrice: '₦48,000',
      period: '/month',
      description: 'For growing businesses',
      features: [
        'Up to 50 products',
        'Advanced analytics',
        'Priority support',
        '12% platform fee',
        '100 KwikCoins bonus',
      ],
      popular: true,
    },
    {
      name: 'Pro',
      price: '₦15,000',
      yearlyPrice: '₦144,000',
      period: '/month',
      description: 'For serious sellers',
      features: [
        'Up to 200 products',
        'Full analytics suite',
        '24/7 support',
        '10% platform fee',
        '300 KwikCoins bonus',
        'Pool access',
      ],
      popular: false,
    },
  ]

  const faqs = [
    {
      question: 'What is KWIKSELLER?',
      answer:
        'KWIKSELLER is Africa\'s most powerful commerce operating system. It allows entrepreneurs to create online stores, sell products, manage orders, accept payments, and deliver goods — all from one comprehensive platform.',
    },
    {
      question: 'How much does it cost to start selling?',
      answer:
        'Getting started is completely free! Our Starter plan lets you list up to 10 products at no cost. You can upgrade to Growth (₦5,000/month) or Pro (₦15,000/month) plans as your business scales for more features and lower platform fees.',
    },
    {
      question: 'How does the delivery network work?',
      answer:
        'KWIKSELLER connects vendors with a network of verified riders across Africa. When a customer places an order, you can request a pickup through the platform. The rider picks up the product and delivers it to the customer with real-time tracking for both parties.',
    },
    {
      question: 'What payment methods are supported?',
      answer:
        'We integrate with Paystack and Flutterwave, supporting bank transfers, card payments, mobile money, USSD, and more. All transactions are escrow-protected, meaning funds are held securely until the customer confirms delivery.',
    },
    {
      question: 'What is the KwikCoins rewards program?',
      answer:
        'KwikCoins is our loyalty rewards system. Vendors earn coins for every sale, milestone achieved, and referral made. You can use KwikCoins to run promotional ads on the marketplace, access premium features, or get discounts on subscription plans.',
    },
    {
      question: 'Can I sell without holding inventory?',
      answer:
        'Yes! KWIKSELLER offers a unique Product Pool feature that allows vendors to sell products from a shared inventory. You can list products from the pool and earn commissions without needing to hold stock or handle fulfillment.',
    },
  ]

  const stats = [
    { value: 10000, suffix: '+', label: 'Active Vendors', display: '10K+' },
    { value: 500000, suffix: '+', label: 'Products Listed', display: '500K+' },
    { value: 2000000, suffix: '+', label: 'Orders Processed', display: '2M+' },
    { value: 15, suffix: '+', label: 'African Countries', display: '15+' },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageLoader isLoading={isPageLoading} />
      <ScrollProgress />
      <OfflineBanner />
      <PromoBanner />

      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-divider">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg kwik-gradient flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">KWIKSELLER</span>
            </div>

            {/* Desktop Nav — Mega Menu */}
            <MegaNav />

            {/* Right side: theme toggle + auth + hamburger */}
            <div className="flex items-center gap-2">
              {/* Search button - always visible */}
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search"
                className="text-default-400 hover:text-foreground"
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Cart button */}
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setCartOpen(true)}
                aria-label="Shopping cart"
                className="relative text-default-400 hover:text-foreground"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center shadow-sm"
                  >
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </motion.span>
                )}
              </Button>

              <ThemeToggle />

              {/* Desktop auth buttons */}
              <div className="hidden md:flex items-center gap-3">
                {isAuthLoading ? null : isAuthenticated && user ? (
                  <>
                    <span className="hidden sm:inline-flex items-center gap-2 text-sm text-default-500">
                      <User className="w-4 h-4" />
                      {user.profile?.firstName || user.email.split('@')[0]}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={handleLogout}
                      isDisabled={isAuthLoading}
                      className="text-default-500 hover:text-danger"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onPress={() => router.push('/login')}>
                      Sign In
                    </Button>
                    <Button variant="primary" size="sm" onPress={() => router.push('/register')}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <Button
                isIconOnly
                variant="ghost"
                className="md:hidden"
                onPress={() => setIsDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
              onClick={closeDrawer}
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-background border-l border-divider z-50 md:hidden shadow-2xl"
            >
              <MobileDrawerContent
                onClose={closeDrawer}
                isAuthenticated={isAuthenticated}
                user={user}
                isAuthLoading={isAuthLoading}
                handleLogout={handleLogout}
                router={router}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Search Overlay ──────────────────────────────── */}
      <EnhancedSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ─── Main Content ────────────────────────────────────── */}
      <main className="flex-1 scroll-smooth pb-20 md:pb-0">
        {/* ─── Hero Section ─────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <HeroBackground />
          <div className="container mx-auto px-4 py-20 md:py-32 relative">
            <div className="max-w-3xl mx-auto text-center">
              <AnimatedSection>
                <Chip variant="soft" className="mb-4">
                  🌍 Africa&apos;s #1 Commerce Platform
                </Chip>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  Africa&apos;s Most Powerful{' '}
                  <span className="kwik-gradient-text">Commerce Operating System</span>
                </h1>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <p className="text-lg md:text-xl text-default-500 mb-8 max-w-2xl mx-auto">
                  Create your online store, sell products, manage orders, and grow your business with
                  our comprehensive platform designed for African entrepreneurs.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="primary" size="lg" className="kwik-shadow relative overflow-hidden">
                    Start Selling Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                    <span className="absolute inset-0 animate-shimmer opacity-20 pointer-events-none" aria-hidden="true" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Browse Marketplace
                  </Button>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.4}>
                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-default-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Setup in 5 minutes</span>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={Sparkles} label="Featured Products" />

        {/* ─── Features Section ─────────────────────────────── */}
        <section id="features" className="py-20 bg-default-50 relative">
          {/* Decorative dot pattern */}
          <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <Chip variant="soft" className="mb-4">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Powerful Features
                </Chip>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Sell Online</h2>
                <p className="text-default-500 max-w-2xl mx-auto">
                  From creating your store to fulfilling orders, KWIKSELLER provides all the tools you need
                  to succeed in African e-commerce.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <StaggerChild key={index} index={index}>
                  <Card className="group border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 h-full">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-default-500 text-sm">{feature.description}</p>
                  </Card>
                </StaggerChild>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={TrendingUp} label="Trusted By" />

        {/* ─── Social Proof / Partners ─────────────────────── */}
        <SocialProof />

        {/* ─── Stats Ticker ──────────────────────────────── */}
        <StatsTicker />

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={Search} label="Simple Steps" />

        {/* ─── How It Works Section ─────────────────────────── */}
        <section className="py-20 relative">
          {/* Decorative diagonal pattern */}
          <div className="absolute inset-0 pattern-diagonal opacity-20 pointer-events-none" />
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <Chip variant="soft" className="mb-4">
                  Simple Process
                </Chip>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                <p className="text-default-500 max-w-2xl mx-auto">
                  Get started in just four simple steps and join thousands of African entrepreneurs already
                  growing with KWIKSELLER.
                </p>
              </div>
            </AnimatedSection>

            <div className="relative">
              {/* Connecting line on desktop */}
              <div className="hidden lg:block absolute top-16 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gradient-to-r from-accent/30 via-accent/60 to-accent/30" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                {howItWorksSteps.map((step, index) => (
                  <StaggerChild key={index} index={index}>
                    <div className="flex flex-col items-center text-center">
                      {/* Number circle */}
                      <div className="relative mb-6">
                        <div className="w-14 h-14 rounded-full kwik-gradient flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {step.number}
                        </div>
                        <div className="absolute -inset-2 rounded-full bg-accent/10 -z-10" />
                      </div>

                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-default-50 flex items-center justify-center mb-4">
                        <step.icon className="w-6 h-6 text-accent" />
                      </div>

                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-default-500 max-w-[240px]">{step.description}</p>
                    </div>
                  </StaggerChild>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={Coins} label="Our Impact" />

        {/* ─── Stats Section ────────────────────────────────── */}
        <section className="py-20 kwik-gradient relative">
          <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <AnimatedSection>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <StaggerChild key={index} index={index}>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                        <CounterAnimation target={stat.value} suffix={stat.suffix} display={stat.display} />
                      </div>
                      <div className="text-sm text-white/80">{stat.label}</div>
                    </div>
                  </StaggerChild>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={Home} label="Categories" />

        {/* ─── Shop by Category Section ─────────────────────── */}
        <section id="categories" className="py-20">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <Chip variant="soft" className="mb-4">
                  Explore Categories
                </Chip>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
                <p className="text-default-500 max-w-2xl mx-auto">
                  Discover products across a wide range of categories curated for the African market.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <StaggerChild key={index} index={index}>
                  <Card className="group border-none shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer hover:scale-[1.02] h-full">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110',
                        category.color
                      )}
                    >
                      <category.icon className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
                    <p className="text-sm text-default-500">{category.count} Products</p>
                  </Card>
                </StaggerChild>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Interactive Features ───────────────────────── */}
        <InteractiveFeatures />

        {/* ─── Trending Products ──────────────────────────── */}
        <TrendingProducts />

        {/* ─── Deals of the Day ────────────────────────────── */}
        <DealsOfTheDay />

        {/* ─── Africa Coverage Map ──────────────────────── */}
        <AfricaCoverageMap />

        {/* ─── Delivery Tracker ────────────────────────── */}
        <DeliveryTracker />

        {/* ─── Pricing Section ──────────────────────────────── */}
        <section id="pricing" className="py-20 bg-default-50 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-warning/5 blur-[80px] pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <AnimatedSection>
              <div className="text-center mb-4">
                <Chip variant="soft" className="mb-4">
                  <Coins className="w-4 h-4 mr-1" />
                  Simple Pricing
                </Chip>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose the Right Plan for You</h2>
                <p className="text-default-500 max-w-2xl mx-auto">
                  Start free and scale as you grow. All plans include core marketplace features.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 mb-10">
                <span className={cn('text-sm font-medium transition-colors', !isYearly ? 'text-foreground' : 'text-default-400')}>Monthly</span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={cn('relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none', isYearly ? 'bg-accent' : 'bg-default-300')}
                  role="switch"
                  aria-checked={isYearly}
                  aria-label="Toggle yearly pricing"
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5"
                    animate={{ left: isYearly ? 26 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className={cn('text-sm font-medium transition-colors', isYearly ? 'text-foreground' : 'text-default-400')}>Yearly</span>
                <AnimatePresence>
                  {isYearly && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Chip size="sm" variant="soft" color="success" className="ml-1">Save 20%</Chip>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <StaggerChild key={index} index={index}>
                  <Card className={cn('relative p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1', plan.popular ? 'border-accent kwik-shadow-lg ring-1 ring-accent/20' : '')}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Chip variant="primary">Most Popular</Chip>
                      </div>
                    )}
                    <div className="flex flex-col items-center pb-2 pt-4">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline gap-1">
                        {plan.price !== 'Free' && isYearly && plan.yearlyPrice && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-lg text-default-400 line-through mr-1"
                          >
                            {plan.price}
                          </motion.span>
                        )}
                        <span className="text-4xl font-bold">
                          {isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                        </span>
                        <span className="text-default-500">{isYearly ? '/year' : (plan.period || '')}</span>
                      </div>
                      <p className="text-sm text-default-500 mt-1">{plan.description}</p>
                    </div>

                    <Separator className="my-4" />

                    <ul className="space-y-2 py-4">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? 'primary' : 'ghost'}
                      className="w-full mt-4"
                    >
                      Get Started
                    </Button>
                  </Card>
                </StaggerChild>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Vendor Onboarding ──────────────────────────── */}
        <VendorOnboarding />

        {/* ─── Pool Selling Explainer ─────────────────────── */}
        <PoolSellingExplainer />

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={Store} label="Top Sellers" />

        {/* ─── Top Vendors ─────────────────────────────────── */}
        <TopVendors />

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={Star} label="Testimonials" />

        {/* ─── Testimonials Carousel ───────────────────────── */}
        <TestimonialCarousel />

        {/* ─── Seller Success Stories ──────────────────────── */}
        <SellerStories />

        {/* ─── Video Testimonials ──────────────────────────── */}
        <VideoTestimonials />

        {/* ─── Product Rating Widget ───────────────────────── */}
        <ProductRatingWidget />

        {/* ─── Vendor Spotlight ──────────────────────────────── */}
        <VendorSpotlight />

        {/* ─── KwikCoins Wallet Dashboard ─────────────────── */}
        <KwikCoinsWallet />

        {/* ─── Community Milestones ──────────────────────── */}
        <CommunityMilestones />

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={HelpCircle} label="FAQ" />

        {/* ─── FAQ Section ──────────────────────────────────── */}
        <section className="py-20 bg-default-50 relative">
          <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none" />
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <Chip variant="soft" className="mb-4">
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Got Questions?
                </Chip>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-default-500 max-w-2xl mx-auto">
                  Find answers to common questions about KWIKSELLER and how it works.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="max-w-3xl mx-auto">
                <Accordion variant="bordered" className="gap-3" selectionMode="multiple">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} id={`faq-${index}`}>
                      <AccordionTrigger>
                        <AccordionHeading>
                          <span className="text-sm md:text-base font-medium">{faq.question}</span>
                        </AccordionHeading>
                        <AccordionIndicator className="text-default-400">
                          <ChevronDown className="w-4 h-4" />
                        </AccordionIndicator>
                      </AccordionTrigger>
                      <AccordionPanel>
                        <AccordionBody>
                          <p className="text-sm text-default-500 pt-1">{faq.answer}</p>
                        </AccordionBody>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={ArrowRight} label="Get Started" />

        {/* ─── CTA Section ──────────────────────────────────── */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto text-center kwik-gradient rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/5" />
                <div className="relative">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
                  <p className="text-white/80 mb-8 max-w-xl mx-auto">
                    Join thousands of African entrepreneurs who are building successful businesses with
                    KWIKSELLER.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-white text-accent hover:bg-white/90 font-semibold relative overflow-hidden"
                    >
                      Create Your Free Store
                      <ArrowRight className="ml-2 w-4 h-4" />
                      <span className="absolute inset-0 animate-shimmer opacity-15 pointer-events-none" aria-hidden="true" />
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      className="border border-white text-white hover:bg-white/10"
                    >
                      Contact Sales
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider icon={Shield} label="Why Choose Us" />

        {/* ─── Trust Indicators ──────────────────────────── */}
        <TrustIndicators />

        {/* ─── KwikCoins Rewards ────────────────────────── */}
        <KwikCoinsRewards />

        {/* ─── Section Divider ──────────────────────────── */}
        <SectionDivider />

        {/* ─── Newsletter Section ───────────────────────────── */}
        <NewsletterSection />

        {/* ─── App Download Banner ────────────────────────── */}
        <AppPromoBanner />

        {/* ─── Recently Viewed Products ───────────────────── */}
        <RecentlyViewed />
      </main>

      {/* ─── Floating Buttons ─────────────────────────────── */}
      <CartDrawer />
      <WishlistSidebar isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <ComparePanel />
      <FloatingButtons />
      <LiveActivityFeed />
      <MobileBottomNav onSearchOpen={() => setIsSearchOpen(true)} />
      <CookieConsentBanner />

      {/* ─── Footer ─────────────────────────────────────────── */}
      <EnhancedFooter />
    </div>
  )
}


