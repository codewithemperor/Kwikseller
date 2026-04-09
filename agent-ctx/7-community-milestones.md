# Task 7 — community-milestones.tsx

## Summary
Created the `CommunityMilestones` component at `src/components/landing/community-milestones.tsx`.

## What was built
- **Animated timeline** showcasing 8 growth milestones of KWIKSELLER (Jan 2023 → Apr 2025)
- **Alternating layout**: Desktop shows cards alternating left/right of a center vertical line; mobile shows linear layout with all cards to the right of a left-aligned line
- **Glassmorphism cards**: `bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl` with hover scale/brightness effects
- **kwik-gradient** background section with `pattern-grid` overlay at opacity-10
- **Scroll-triggered animations**: Cards slide in from left/right (alternating), timeline line grows on scroll, header & CTA fade up on view
- **Pulse animation** on the latest milestone node (Apr 2025) using `animate-pulse-glow` + `animate-ping`
- **Bottom CTA**: "Join Our Journey" button with white background and accent text
- **Section header**: HeroUI `Chip` with Milestone icon, heading, and description in white text

## Technical details
- Uses `'use client'` directive
- HeroUI v3 components: `Chip`, `Button`
- Framer Motion: `motion`, `useInView` for scroll-triggered animations
- `cn()` from `@kwikseller/ui` for class merging
- All icons from `lucide-react`
- Named export only: `CommunityMilestones`
- ESLint: **0 errors**
- No existing files were modified

## File created
- `/home/z/my-project/apps/marketplace/src/components/landing/community-milestones.tsx`
