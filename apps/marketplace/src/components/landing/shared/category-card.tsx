"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@kwikseller/ui";
import { AppImage } from "@/components/ui/app-image";
import {
  CATEGORY_CARD_ACCENT_COLORS,
  CATEGORY_CARD_TEXT_COLORS,
  CATEGORY_STYLES,
  DEFAULT_CATEGORY_STYLE,
  type CategoryStyle,
} from "@/constants/marketplace";

export interface CategoryCardData {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
  itemCount?: number;
  productCount?: number;
  description?: string | null;
}

function resolveStyle(name: string, slug: string, index: number): CategoryStyle {
  const key = (slug || "").toLowerCase();
  if (CATEGORY_STYLES[key]) return CATEGORY_STYLES[key];
  for (const [k, v] of Object.entries(CATEGORY_STYLES)) {
    if (name.toLowerCase().includes(k) || key.includes(k)) return v;
  }
  const colorIdx = index % CATEGORY_CARD_ACCENT_COLORS.length;
  return {
    color: CATEGORY_CARD_ACCENT_COLORS[colorIdx],
    textColor: CATEGORY_CARD_TEXT_COLORS[colorIdx],
    Icon: DEFAULT_CATEGORY_STYLE.Icon,
  };
}

// The CATEGORY_STYLES map provides a Lucide Icon component based on slug/name.
// We use that as the primary icon source — it's deterministic and styled
// per-category. The raw `icon` string from the API (a lucide icon name) is
// not rendered here because mapping string→component at runtime would
// require importing the entire lucide-react package.

/**
 * Reusable CategoryCard — used by both the homepage "Browse by category"
 * section and the /categories listing page.
 *
 * Design:
 *  - Icon-based card with a colored accent box (per-category slug mapping)
 *  - Shows name + item count
 *  - Chevron on hover
 *  - Fully dark-mode compliant (bg-background, border-border, text-foreground)
 *  - No gradients, no hardcoded light-mode colors
 *  - Links to /categories/[id] (dedicated route, not query param)
 *
 * The `index` prop is used only to cycle accent colors for categories that
 * don't have an explicit style mapping.
 */
export function CategoryCard({
  category,
  index = 0,
  variant = "default",
}: {
  category: CategoryCardData;
  index?: number;
  variant?: "default" | "compact";
}) {
  const style = resolveStyle(category.name, category.slug, index);
  const { Icon } = style;
  const href = `/categories/${category.slug || category.id}`;
  const count = category.itemCount ?? category.productCount ?? 0;
  const countLabel = count > 0 ? `${count} product${count !== 1 ? "s" : ""}` : "Browse";

  if (variant === "compact") {
    // Compact variant — used in tight horizontal carousels on the homepage.
    return (
      <Link
        href={href}
        className="group flex items-center gap-3 border border-border bg-background p-3 transition-all duration-300 hover:border-foreground/30 dark:hover:border-white/40"
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-110",
            style.color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{category.name}</h3>
          <p className="text-xs text-muted-foreground">{countLabel}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-kwik-orange" />
      </Link>
    );
  }

  // Default variant — used in the /categories grid and homepage section.
  return (
    <Link
      href={href}
      className="group flex h-full items-center gap-4 border border-border bg-background p-4 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm dark:hover:border-white/40"
    >
      {/* Colored icon box */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110",
          style.color,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      {/* Category info */}
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-foreground">{category.name}</h3>
        {count > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">{countLabel}</p>
        )}
        {category.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-kwik-orange" />
    </Link>
  );
}

/**
 * CategoryCardImage — image-based variant for sections that prefer
 * a visual category tile (image + overlay text). Used when the category
 * has an imageUrl and the layout calls for a visual grid.
 */
export function CategoryCardImage({
  category,
  index = 0,
}: {
  category: CategoryCardData;
  index?: number;
}) {
  const style = resolveStyle(category.name, category.slug, index);
  const { Icon } = style;
  const href = `/categories/${category.slug || category.id}`;
  const count = category.itemCount ?? category.productCount ?? 0;

  return (
    <Link href={href} className="group block border-b border-border pb-4">
      <div className="relative aspect-[5/3] overflow-hidden bg-muted dark:bg-white/5">
        <AppImage
          src={category.image}
          alt={category.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          fallbackVariant="product"
        />
        {/* Icon overlay bottom-left — gives the card a branded accent even
            when the category has no image */}
        <div
          className={cn(
            "absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-md",
            style.color,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{category.name}</p>
      <p className="text-xs text-muted-foreground">
        {count > 0 ? `${count} products` : "Browse"}
      </p>
    </Link>
  );
}
