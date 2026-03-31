// KWIKSELLER - Landing Page
// Africa's Most Powerful Commerce Operating System

'use client'

import { 
  ShoppingCart, 
  Store, 
  Truck, 
  Shield, 
  Coins, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react'
import {
  Button,
  Card,
  Chip,
  Separator,
} from '@heroui/react'
import { OfflineBanner, cn } from '@kwikseller/ui'

export default function HomePage() {
  const features = [
    {
      icon: Store,
      title: "Create Your Store",
      description: "Set up your online store in minutes with our intuitive dashboard and start selling today."
    },
    {
      icon: ShoppingCart,
      title: "Sell Products",
      description: "List unlimited products, manage inventory, and fulfill orders with ease."
    },
    {
      icon: Coins,
      title: "KwikCoins Rewards",
      description: "Earn rewards for every sale and milestone. Use coins for ads and premium features."
    },
    {
      icon: Truck,
      title: "Delivery Network",
      description: "Connect with our rider network for reliable delivery across Africa."
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Escrow-protected transactions with Paystack and Flutterwave integration."
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Access analytics, advertising tools, and the product pool to scale your store."
    }
  ]

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for getting started",
      features: ["Up to 10 products", "Basic analytics", "Standard support", "15% platform fee"],
      popular: false
    },
    {
      name: "Growth",
      price: "₦5,000",
      period: "/month",
      description: "For growing businesses",
      features: ["Up to 50 products", "Advanced analytics", "Priority support", "12% platform fee", "100 KwikCoins bonus"],
      popular: true
    },
    {
      name: "Pro",
      price: "₦15,000",
      period: "/month",
      description: "For serious sellers",
      features: ["Up to 200 products", "Full analytics suite", "24/7 support", "10% platform fee", "300 KwikCoins bonus", "Pool access"],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-divider">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg kwik-gradient flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">KWIKSELLER</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-default-500 hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-default-500 hover:text-foreground transition-colors">Pricing</a>
              <a href="#about" className="text-sm text-default-500 hover:text-foreground transition-colors">About</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">Sign In</Button>
              <Button variant="primary" size="sm">Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Chip variant="soft" className="mb-4">
              🌍 Africa&apos;s #1 Commerce Platform
            </Chip>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Africa&apos;s Most Powerful{' '}
              <span className="kwik-gradient-text">Commerce Operating System</span>
            </h1>
            <p className="text-lg md:text-xl text-default-500 mb-8 max-w-2xl mx-auto">
              Create your online store, sell products, manage orders, and grow your business with 
              our comprehensive platform designed for African entrepreneurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" className="kwik-shadow">
                Start Selling Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline">
                Browse Marketplace
              </Button>
            </div>
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
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-default-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Sell Online</h2>
            <p className="text-default-500 max-w-2xl mx-auto">
              From creating your store to fulfilling orders, KWIKSELLER provides all the tools 
              you need to succeed in African e-commerce.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-default-500">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10K+", label: "Active Vendors" },
              { value: "500K+", label: "Products Listed" },
              { value: "2M+", label: "Orders Processed" },
              { value: "15+", label: "African Countries" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold kwik-gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-default-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-default-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-default-500 max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include core marketplace features.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={cn('relative p-6', plan.popular ? 'border-primary kwik-shadow-lg' : '')}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Chip variant="primary">Most Popular</Chip>
                  </div>
                )}
                <div className="flex flex-col items-center pb-2 pt-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-default-500">{plan.period}</span>
                    )}
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
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by African Entrepreneurs</h2>
            <p className="text-default-500 max-w-2xl mx-auto">
              Join thousands of successful vendors across Africa
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Amara Okonkwo",
                business: "Fashion by Amara",
                quote: "KWIKSELLER helped me take my boutique online. Sales increased by 300% in the first month!",
                rating: 5
              },
              {
                name: "Kwame Asante",
                business: "Tech Gadgets Ghana",
                quote: "The pool feature is amazing! I can sell products without inventory. Truly revolutionary.",
                rating: 5
              },
              {
                name: "Fatima Ibrahim",
                business: "Fati's Kitchen",
                quote: "From kitchen to delivery - KWIKSELLER made it seamless. The rider network is fantastic!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-default-500 mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-xs text-default-500">{testimonial.business}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of African entrepreneurs who are building successful businesses with KWIKSELLER.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Create Your Free Store
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="ghost" className="border border-white text-white hover:bg-white/10">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg kwik-gradient flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">KWIKSELLER</span>
              </div>
              <p className="text-sm text-default-500">
                Africa&apos;s most powerful commerce operating system.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-default-500">
                <li><a href="#" className="hover:text-foreground transition-colors">Marketplace</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Vendor Dashboard</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-default-500">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-default-500">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-default-500">
            <p>© {new Date().getFullYear()} KWIKSELLER. All rights reserved. Africa&apos;s Commerce Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
