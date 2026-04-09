# Task 6-b: Hero Parallax Component

**Status**: ✅ Completed
**File**: `src/components/landing/hero-parallax.tsx`

## Summary

Created a `HeroParallax` component with multi-layer parallax scrolling for the Kwikseller marketplace landing page.

## What was built

### 3 Parallax Layers
1. **Layer 1 (Background, 0.2× speed)**: Two large blurred gradient orbs (accent/20, warning/20, ~350-380px) + grid pattern overlay at low opacity
2. **Layer 2 (Midground, 0.5× speed)**: 5 floating "product bubbles" with icons (ShoppingCart, Laptop, Smartphone, Shirt, Package), each with unique position/rotation/float animation, semi-transparent (0.2-0.35 opacity), individual scroll drift per bubble
3. **Layer 3 (Foreground, normal speed)**: Hero content with staggered entrance animations:
   - Chip badge: "🌍 Africa's #1 Commerce Platform"
   - H1: "Africa's Most Powerful Commerce Operating System" with kwik-gradient-text
   - Description paragraph
   - 2 CTA buttons: "Start Selling Free" (kwik-gradient) + "Browse Marketplace" (bordered)
   - 3 trust indicators with icons

### Scroll Effects
- Hero fades out (opacity 1→0) over 200px of scroll
- Background orbs shift at 0.2× apparent speed
- Product bubbles drift in different directions at 0.5× speed
- Each bubble has independent x/y drift vectors

### Responsive Design
- H1: text-4xl md:text-6xl
- Buttons: vertical stack on mobile, horizontal on sm+
- Trust indicators: flex-wrap on mobile
- Product bubbles: hidden on mobile (hidden md:block)

### Performance
- `will-change: transform` on all parallax layers
- GPU-accelerated transforms via framer-motion's translate3d
- `prefers-reduced-motion` fully respected (static fallback with no animations)

### Dependencies Used
- `framer-motion`: useScroll, useTransform, motion
- `@heroui/react`: Button, Chip
- `lucide-react`: ShoppingCart, Laptop, Smartphone, Shirt, Package, ArrowRight, Check, ShieldCheck, Zap
- `@kwikseller/ui`: cn utility

### ESLint
- ✅ 0 errors, 0 warnings
