// KWIKSELLER - Enhanced About Page
// Mission, vision, values, team, journey, stats, partners, CTA

"use client";

import React, { useRef, useState } from "react";
import {
  Store,
  ShoppingCart,
  Coins,
  Truck,
  Shield,
  TrendingUp,
  UserPlus,
  Search,
  ShoppingBag,
  Package,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Heart,
  Users,
  Globe,
  Rocket,
  Award,
  Handshake,
  Target,
  Calendar,
  Eye,
  Sparkles,
  Star,
  Zap,
  Linkedin,
  Twitter,
  MapPin,
  Quote,
} from "lucide-react";
import { Button, Card, Chip, Separator } from "@heroui/react";
import { motion, useInView } from "framer-motion";
import { cn } from "@kwikseller/ui";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { SectionDivider } from "@/components/landing/section-divider";
import { SocialProof } from "@/components/landing/social-proof";
import { AfricaCoverageMap } from "@/components/landing/africa-coverage-map";

// ─── Animation helpers ─────────────────────────────────────────────

function AnimatedSection({
  children,
  className = "",
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
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
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CounterAnimation({
  target,
  suffix = "",
  display,
}: {
  target: number;
  suffix?: string;
  display?: string;
}) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  React.useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        setDone(true);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return (
    <span ref={ref}>
      {done && display ? display : `${count.toLocaleString()}${suffix}`}
    </span>
  );
}

// ─── Data ──────────────────────────────────────────────────────

const values = [
  {
    icon: Shield,
    title: "Trust",
    description:
      "Built on transparency and escrow-protected transactions, we ensure every buyer and seller feels secure. Your trust is the foundation of everything we build.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We constantly push boundaries with cutting-edge technology to simplify commerce for every African entrepreneur. Our platform evolves to meet the unique needs of emerging markets.",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: Heart,
    title: "Community",
    description:
      "We believe in the power of community. Every vendor, buyer, and rider is part of the Kwikseller family, working together to uplift African commerce.",
    color: "bg-danger/10 text-danger",
  },
  {
    icon: Star,
    title: "Excellence",
    description:
      "We set the highest standards for ourselves and our platform. From code quality to customer support, excellence is not a goal — it is our baseline.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Sparkles,
    title: "Simplicity",
    description:
      "Commerce should be effortless. We obsess over removing friction from every interaction — from signing up to receiving your first order payment.",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    icon: TrendingUp,
    title: "Growth",
    description:
      "We grow when our vendors grow. Our tools, insights, and support systems are designed to help entrepreneurs scale from their first sale to their ten-thousandth.",
    color: "bg-teal-500/10 text-teal-500",
  },
];

const team = [
  {
    initials: "AO",
    name: "Adewale Okonkwo",
    role: "Founder & CEO",
    bio: "A serial entrepreneur with 10+ years in African fintech. Passionate about empowering SMBs through technology.",
    color: "bg-accent",
    location: "Lagos, Nigeria",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    initials: "FN",
    name: "Fatima Ndiaye",
    role: "Chief Technology Officer",
    bio: "Full-stack engineer from Dakar who previously led engineering teams at Flutterwave. Builds scalable systems for millions.",
    color: "bg-success",
    location: "Dakar, Senegal",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    initials: "KM",
    name: "Kwame Mensah",
    role: "Head of Operations",
    bio: "Logistics expert from Accra with deep expertise in last-mile delivery across West Africa. Ensures every order arrives on time.",
    color: "bg-warning",
    location: "Accra, Ghana",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    initials: "SZ",
    name: "Sara Zulu",
    role: "VP of Growth",
    bio: "Marketing strategist from Lusaka who has helped scale startups from seed to Series B across 8 African markets.",
    color: "bg-danger",
    location: "Lusaka, Zambia",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    initials: "JM",
    name: "James Mwangi",
    role: "Chief Financial Officer",
    bio: "Former investment banker at Standard Bank with deep expertise in emerging market finance and venture capital.",
    color: "bg-teal-500",
    location: "Nairobi, Kenya",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    initials: "AC",
    name: "Amara Conteh",
    role: "VP of Product",
    bio: "Product leader from Freetown with a track record of building user-centric platforms used by millions across Africa.",
    color: "bg-warning",
    location: "Freetown, Sierra Leone",
    socials: { twitter: "#", linkedin: "#" },
  },
];

const journey = [
  {
    year: "2021",
    title: "Founded in Lagos",
    description:
      "Kwikseller was born from a simple idea: make selling online as easy as a WhatsApp message. Our founding team of three set up shop in Yaba, Lagos — Nigeria's tech hub — and built the first version of the platform. Within three months, 50 vendors joined and listed their first products.",
    icon: Rocket,
    stat: "50 Vendors",
  },
  {
    year: "2022",
    title: "First 1,000 Vendors",
    description:
      "We hit our first major milestone — 1,000 active vendors across Nigeria and Ghana. Launched escrow-protected payments through Paystack and Flutterwave integration, and rolled out our Product Pool feature enabling zero-inventory selling for the first time.",
    icon: Users,
    stat: "3 Countries",
  },
  {
    year: "2023",
    title: "Expanded to 5 Countries",
    description:
      "Kwikseller crossed borders into Kenya, Tanzania, and Uganda. We introduced KwikCoins — our rewards program — and partnered with local delivery networks to offer same-day delivery in major cities. The vendor community grew to 5,000 with over 200,000 products listed.",
    icon: Globe,
    stat: "5K Vendors",
  },
  {
    year: "2024",
    title: "10K Vendors, 500K Products",
    description:
      "A landmark year. We crossed 10,000 vendors and 500,000 products on the platform. Launched our Growth and Pro plans for serious sellers, introduced AI-powered product recommendations, and expanded our rider network to over 5,000 active delivery partners across 12 countries.",
    icon: Award,
    stat: "500K Products",
  },
  {
    year: "2025",
    title: "Pan-African Coverage",
    description:
      "Kwikseller now operates in 15+ African countries with full coverage. We processed over 2 million orders with a 99.9% satisfaction rate, introduced vendor analytics dashboards, and surpassed ₦2 billion in cumulative gross merchandise value. Our community of entrepreneurs is building the future of African commerce.",
    icon: Target,
    stat: "15+ Countries",
  },
];

const stats = [
  {
    value: 15,
    suffix: "+",
    label: "African Countries",
    display: "15+",
    icon: Globe,
  },
  {
    value: 10000,
    suffix: "+",
    label: "Active Vendors",
    display: "10K+",
    icon: Store,
  },
  {
    value: 500000,
    suffix: "+",
    label: "Products Listed",
    display: "500K+",
    icon: Package,
  },
  {
    value: 2000000,
    suffix: "+",
    label: "Orders Processed",
    display: "2M+",
    icon: ShoppingCart,
  },
];

const partners = [
  {
    name: "Paystack",
    type: "Payment",
    description: "Seamless payment processing across Africa",
  },
  {
    name: "Flutterwave",
    type: "Payment",
    description: "Unified payments for African businesses",
  },
  {
    name: "FedEx",
    type: "Logistics",
    description: "International shipping and delivery",
  },
  {
    name: "GIG Logistics",
    type: "Logistics",
    description: "Last-mile delivery across Nigeria",
  },
  {
    name: "AWS",
    type: "Technology",
    description: "Cloud infrastructure and scalability",
  },
  {
    name: "Google for Startups",
    type: "Partner",
    description: "Growth support and technical resources",
  },
  {
    name: "MTN",
    type: "Telecom",
    description: "Mobile money and connectivity across Africa",
  },
  {
    name: "Stripe",
    type: "Payment",
    description: "Global payment infrastructure",
  },
];

// ─── Page ──────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <MarketplaceLayout>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
        {/* Decorative blurred orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  pt-16 sm:pt-20 pb-16 sm:pb-20 relative">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <Chip
                variant="soft"
                className="mb-6 bg-white/20 text-white border-white/20"
              >
                <Store className="w-3.5 h-3.5 mr-1.5" />
                About Kwikseller
              </Chip>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Africa&apos;s Most Powerful{" "}
                <span className="text-shadow-sm">Commerce Platform</span>
              </h1>
              <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                We&apos;re on a mission to democratize digital commerce for
                every African entrepreneur — from street vendors in Lagos to
                artisans in Kigali, and everyone in between.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button
                  size="lg"
                  className="bg-white text-accent font-semibold hover:bg-white/90 transition-colors shadow-lg"
                >
                  Start Selling Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  Learn More
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </AnimatedSection>

          {/* Floating stat pills */}
          <AnimatedSection delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-12 max-w-2xl mx-auto">
              {[
                { label: "Founded 2021", icon: Calendar },
                { label: "15+ Countries", icon: Globe },
                { label: "10K+ Vendors", icon: Store },
                { label: "2M+ Orders", icon: ShoppingCart },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/90 text-xs sm:text-sm font-medium"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. OUR MISSION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-warning/5 blur-[80px] pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                {/* Left — Icon + label */}
                <div className="flex-shrink-0 text-center lg:text-left">
                  <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <Chip variant="soft" className="bg-accent/10 text-accent">
                    Our Mission
                  </Chip>
                </div>
                {/* Right — narrative */}
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                    Democratizing Commerce for{" "}
                    <span className="text-accent">Every African</span>
                  </h2>
                  <p className="text-default-600 dark:text-default-400 leading-relaxed mb-4">
                    Africa is home to the world&apos;s fastest-growing
                    population of entrepreneurs, yet millions face barriers to
                    digital trade — from limited access to payment
                    infrastructure to complex logistics networks. Kwikseller was
                    built to change that.
                  </p>
                  <p className="text-default-600 dark:text-default-400 leading-relaxed mb-4">
                    We envision a continent where a seamstress in Accra, a phone
                    dealer in Lagos, and an artisan in Kigali can all reach
                    customers across borders with the same ease as the largest
                    global brands. Our platform provides the tools, the trust
                    layer, and the network to make that possible.
                  </p>
                  <p className="text-default-600 dark:text-default-400 leading-relaxed">
                    By combining escrow-protected payments, a shared Product
                    Pool for zero-inventory selling, and a continent-wide rider
                    network, Kwikseller isn&apos;t just a marketplace —
                    it&apos;s an economic engine for Africa&apos;s creative and
                    entrepreneurial class.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          3. OUR VISION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="container mx-auto px-0 md:px-4  relative">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16">
                {/* Right — Icon + label */}
                <div className="flex-shrink-0 text-center lg:text-left">
                  <div className="w-20 h-20 rounded-2xl bg-warning flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
                    <Eye className="w-10 h-10 text-white" />
                  </div>
                  <Chip variant="soft" className="bg-warning/10 text-warning">
                    Our Vision
                  </Chip>
                </div>
                {/* Left — narrative */}
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                    The Future of{" "}
                    <span className="text-accent">African Commerce</span>
                  </h2>
                  <p className="text-default-600 dark:text-default-400 leading-relaxed mb-4">
                    We envision a world where geography is no longer a barrier
                    to trade in Africa. A single mother in Nairobi should be
                    able to sell her handcrafted jewelry to a customer in
                    Abidjan with the same confidence and convenience as selling
                    to her neighbor.
                  </p>
                  <p className="text-default-600 dark:text-default-400 leading-relaxed mb-4">
                    By 2030, we aim to power over 100,000 businesses across 30+
                    African countries, facilitating over $1 billion in annual
                    transactions. We&apos;re building the infrastructure that
                    will enable the next generation of African entrepreneurs to
                    compete on a global stage.
                  </p>
                  <p className="text-default-600 dark:text-default-400 leading-relaxed">
                    Every line of code we write, every partnership we forge, and
                    every feature we ship is in service of this vision — an
                    Africa where opportunity is universal, commerce is
                    borderless, and every entrepreneur has the tools to thrive.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <SectionDivider icon={Sparkles} label="What Drives Us" />

      {/* ═══════════════════════════════════════════════════════════
          4. OUR VALUES
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-default-50 relative">
        <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Heart className="w-4 h-4 mr-1" />
                Our Values
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Drives Us Every Day
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                Six core values guide every decision we make, every feature we
                build, and every partnership we forge.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <StaggerChild key={index} index={index}>
                <Card className="group border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 h-full">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                      value.color,
                    )}
                  >
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-default-500 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. OUR STORY / TIMELINE
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative">
        <div className="container mx-auto px-0 md:px-4 ">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Calendar className="w-4 h-4 mr-1" />
                Our Story
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Building Africa&apos;s Commerce Future
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                From a small idea in Lagos to a pan-African platform serving
                millions — here&apos;s how we got here, year by year.
              </p>
            </div>
          </AnimatedSection>

          <div className="relative max-w-4xl mx-auto">
            {/* Vertical line — desktop centered */}
            <div className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-accent/20" />
            {/* Vertical line — mobile left-aligned */}
            <div className="md:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-accent/20" />

            <div className="space-y-10 md:space-y-14">
              {journey.map((milestone, index) => {
                const Icon = milestone.icon;
                const isEven = index % 2 === 0;
                return (
                  <StaggerChild key={index} index={index}>
                    <div
                      className={cn(
                        "relative flex flex-col md:flex-row gap-4 md:gap-8",
                        isEven ? "md:flex-row" : "md:flex-row-reverse",
                      )}
                    >
                      {/* Dot */}
                      <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent ring-4 ring-accent/20 z-10 top-3" />

                      {/* Content card */}
                      <div
                        className={cn(
                          "ml-14 md:ml-0 md:w-[calc(50%-2.5rem)]",
                          isEven
                            ? "md:text-right md:pr-6"
                            : "md:text-left md:pl-6",
                        )}
                      >
                        <Card className="border-none shadow-sm p-5 sm:p-6 hover:shadow-md transition-all duration-300 group">
                          <div
                            className={cn(
                              "flex items-center gap-2 mb-3",
                              isEven ? "md:justify-end" : "md:justify-start",
                            )}
                          >
                            <Chip
                              size="sm"
                              variant="soft"
                              color="warning"
                              className="font-semibold"
                            >
                              {milestone.year}
                            </Chip>
                            <span className="text-xs text-default-400 font-medium bg-default-100 dark:bg-default-100/50 px-2 py-0.5 rounded-full">
                              {milestone.stat}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-3 mb-3",
                              isEven ? "md:justify-end" : "md:justify-start",
                            )}
                          >
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="text-lg font-semibold">
                              {milestone.title}
                            </h3>
                          </div>
                          <p className="text-default-500 text-sm leading-relaxed">
                            {milestone.description}
                          </p>
                        </Card>
                      </div>

                      {/* Spacer for alternating layout */}
                      <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
                    </div>
                  </StaggerChild>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. TEAM SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-default-50 relative">
        <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Users className="w-4 h-4 mr-1" />
                Our Team
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The People Behind Kwikseller
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                A passionate team of builders from across Africa, united by the
                mission to transform continental commerce.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <StaggerChild key={index} index={index}>
                <Card className="group border-none shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 h-full">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-105 transition-transform flex-shrink-0",
                        member.color,
                      )}
                    >
                      {member.initials}
                    </div>
                    {/* Name + role */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold leading-tight">
                        {member.name}
                      </h3>
                      <p className="text-accent text-sm font-medium mt-0.5">
                        {member.role}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5 text-default-400">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{member.location}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-default-500 text-sm leading-relaxed mb-4">
                    {member.bio}
                  </p>
                  {/* Social links */}
                  <div className="flex items-center gap-2 pt-3 border-t border-default-100">
                    <a
                      href={member.socials.twitter}
                      aria-label={`${member.name} on Twitter`}
                      className="w-8 h-8 rounded-lg bg-default-100 hover:bg-accent/10 hover:text-accent flex items-center justify-center text-default-400 transition-colors"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={member.socials.linkedin}
                      aria-label={`${member.name} on LinkedIn`}
                      className="w-8 h-8 rounded-lg bg-default-100 hover:bg-accent/10 hover:text-accent flex items-center justify-center text-default-400 transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. STATS SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-accent relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip
                variant="soft"
                className="mb-4 bg-white/15 text-white border-white/20"
              >
                <Zap className="w-4 h-4 mr-1" />
                By the Numbers
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Impact Across Africa
              </h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                Every number represents real entrepreneurs, real products, and
                real economic impact across the continent.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <StaggerChild key={index} index={index}>
                <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    <CounterAnimation
                      target={stat.value}
                      suffix={stat.suffix}
                      display={stat.display}
                    />
                  </div>
                  <div className="text-sm text-white/80 font-medium">
                    {stat.label}
                  </div>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. PARTNERS & BACKERS
          ═══════════════════════════════════════════════════════════ */}
      <SocialProof />

      <section className="py-16 sm:py-20 relative">
        <div className="container mx-auto px-0 md:px-4 ">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Chip variant="soft" className="mb-4">
                <Handshake className="w-4 h-4 mr-1" />
                Partners & Backers
              </Chip>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-default-500 max-w-2xl mx-auto">
                We work with the best partners in payments, logistics,
                technology, and telecommunications to deliver a seamless
                experience for vendors and buyers across Africa.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {partners.map((partner, index) => (
              <StaggerChild key={index} index={index}>
                <Card className="group border-none shadow-sm hover:shadow-md transition-all duration-300 p-5 h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-default-100 dark:bg-default-100/50 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/10 transition-colors">
                    <span className="text-lg font-bold text-default-400 group-hover:text-accent transition-colors">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{partner.name}</h3>
                  <Chip
                    size="sm"
                    variant="soft"
                    className="bg-accent/10 text-accent text-[10px] mb-2"
                  >
                    {partner.type}
                  </Chip>
                  <p className="text-default-400 text-xs leading-relaxed">
                    {partner.description}
                  </p>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          AFRICA COVERAGE MAP
          ═══════════════════════════════════════════════════════════ */}
      <AfricaCoverageMap />

      {/* ═══════════════════════════════════════════════════════════
          9. CTA SECTION — JOIN OUR MISSION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent opacity-[0.03] pointer-events-none" />
        <div className="container mx-auto px-0 md:px-4  relative">
          <AnimatedSection>
            <Card className="border-none p-8 sm:p-10 md:p-14 bg-accent text-white overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/3 pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto text-center">
                {/* Quote icon */}
                <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-6">
                  <Quote className="w-7 h-7 text-white" />
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  Join Our Mission
                </h2>
                <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
                  Whether you&apos;re a vendor looking to grow your business, a
                  buyer searching for the best deals, or a partner who shares
                  our vision — there&apos;s a place for you in the Kwikseller
                  community.
                </p>
                <p className="text-white/60 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                  Together, we&apos;re building the infrastructure that will
                  power the next generation of African commerce. Start your
                  journey today and be part of something bigger.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-accent font-semibold hover:bg-white/90 transition-colors shadow-lg kwik-shadow"
                  >
                    Create Your Free Store
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    Explore the Marketplace
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10 pt-8 border-t border-white/15">
                  {[
                    { icon: Shield, label: "Escrow Protected" },
                    { icon: Truck, label: "Fast Delivery" },
                    { icon: Zap, label: "24/7 Support" },
                    { icon: CheckCircle, label: "Free to Start" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-1.5 text-white/70 text-sm"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>
    </MarketplaceLayout>
  );
}
