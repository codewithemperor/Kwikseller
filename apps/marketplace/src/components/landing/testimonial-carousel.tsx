"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button, Card } from "@heroui/react";

const testimonials = [
  {
    name: "Amara Okonkwo",
    business: "Fashion by Amara",
    location: "Lagos, Nigeria",
    quote:
      "KWIKSELLER helped me take my boutique online. Sales increased by 300% in the first month! The dashboard is intuitive and the delivery network is incredibly reliable.",
    rating: 5,
    avatar: "AO",
    accentColor: "from-pink-500 to-rose-500",
  },
  {
    name: "Kwame Asante",
    business: "Tech Gadgets Ghana",
    location: "Accra, Ghana",
    quote:
      "The pool feature is amazing! I can sell products without inventory. Truly revolutionary for small business owners in Africa. Revenue grew 5x in 6 months.",
    rating: 5,
    avatar: "KA",
    accentColor: "from-cyan-500 to-blue-500",
  },
  {
    name: "Fatima Ibrahim",
    business: "Fati's Kitchen",
    location: "Abuja, Nigeria",
    quote:
      "From kitchen to delivery — KWIKSELLER made it seamless. The rider network is fantastic! My food business now reaches customers across 3 cities.",
    rating: 5,
    avatar: "FI",
    accentColor: "from-orange-500 to-amber-500",
  },
  {
    name: "David Mwangi",
    business: "EcoWear Nairobi",
    location: "Nairobi, Kenya",
    quote:
      "As a sustainable fashion brand, KWIKSELLER aligned perfectly with our values. The analytics tools help us understand our customers better than ever before.",
    rating: 5,
    avatar: "DM",
    accentColor: "from-green-500 to-emerald-500",
  },
  {
    name: "Amina Diallo",
    business: "Beads & Crafts Dakar",
    location: "Dakar, Senegal",
    quote:
      "KWIKSELLER opened my business to the entire African market. The escrow payment protection gives both me and my customers peace of mind.",
    rating: 5,
    avatar: "AD",
    accentColor: "from-purple-500 to-violet-500",
  },
];

// Desktop: 3 cards per slide, Mobile: 1 card per slide
// These are constants to avoid hydration mismatch
const DESKTOP_PER_PAGE = 3;
const MOBILE_PER_PAGE = 1;
const TOTAL_DOTS = testimonials.length; // Always render all dots to avoid hydration issues

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // Track viewport width to determine items per page
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const itemsPerPage = isDesktop ? DESKTOP_PER_PAGE : MOBILE_PER_PAGE;
  const maxIndex = Math.max(0, testimonials.length - itemsPerPage);
  const safeCurrent = Math.min(current, maxIndex);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxIndex));
      setDirection(clamped > current ? 1 : -1);
      setCurrent(clamped);
    },
    [current, maxIndex],
  );

  const next = useCallback(() => {
    goTo(current >= maxIndex ? 0 : current + 1);
  }, [current, maxIndex, goTo]);

  const prev = useCallback(() => {
    goTo(current <= 0 ? maxIndex : current - 1);
  }, [current, maxIndex, goTo]);

  // Auto-rotate
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        next();
      }
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <section id="about" className="py-20 overflow-hidden">
      <div className="container mx-auto px-0 md:px-4 ">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Quote className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent">
                Success Stories
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by African Entrepreneurs
            </h2>
            <p className="text-default-500 max-w-2xl mx-auto">
              Join thousands of successful vendors who are building thriving
              businesses across Africa with KWIKSELLER.
            </p>
          </div>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => (isPausedRef.current = true)}
          onMouseLeave={() => (isPausedRef.current = false)}
        >
          <div className="overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="grid md:grid-cols-3 gap-6"
              >
                {testimonials
                  .slice(current, current + 3)
                  .map((testimonial, index) => (
                    <Card
                      key={`${current}-${index}`}
                      className="p-6 h-full relative group hover:shadow-lg transition-all duration-300"
                    >
                      {/* Quote decoration */}
                      <div className="absolute top-4 right-4 text-default-100 group-hover:text-accent/10 transition-colors">
                        <Quote className="w-8 h-8" />
                      </div>

                      {/* Stars */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-warning text-warning"
                          />
                        ))}
                      </div>

                      {/* Quote text */}
                      <p className="text-sm text-default-500 mb-6 leading-relaxed min-h-[80px]">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 mt-auto">
                        <div
                          className={`w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm shadow-md`}
                        >
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            {testimonial.name}
                          </div>
                          <div className="text-xs text-default-400">
                            {testimonial.business}
                          </div>
                          <div className="text-xs text-default-300">
                            {testimonial.location}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              className="w-10 h-10"
              onPress={prev}
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <nav className="flex gap-2" aria-label="Testimonial navigation">
              {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
                // On mobile, show all dots. On desktop, only show up to maxIndex+1 active dots.
                const isVisible = !isDesktop ? true : i <= maxIndex;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? "bg-accent w-8"
                        : "bg-default-200 hover:bg-default-300 w-2"
                    } ${!isVisible ? "opacity-0 pointer-events-none" : ""}`}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === current ? "true" : undefined}
                  />
                );
              })}
            </nav>

            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              className="w-10 h-10"
              onPress={next}
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
