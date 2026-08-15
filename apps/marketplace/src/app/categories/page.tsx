"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, PackageOpen, SlidersHorizontal } from "lucide-react";
import { cn } from "@kwikseller/ui";
import { CategoryCard, type CategoryCardData } from "@/components/landing/shared/category-card";
import { useCategories, type Category } from "@/lib/api-hooks";

// ─── Sort options ───────────────────────────────────────────────────────────

const CATEGORY_SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
] as const;

type CategorySortValue = (typeof CATEGORY_SORT_OPTIONS)[number]["value"];

// ─── Page component ─────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const categoriesQuery = useCategories();
  const [sortBy, setSortBy] = useState<CategorySortValue>("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Map API categories → CategoryCardData.
  const categories: CategoryCardData[] = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((c: Category) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.id,
        image: c.imageUrl ?? null,
        icon: c.icon ?? null,
        itemCount: c._count?.products ?? 0,
        productCount: c._count?.products ?? 0,
        description: null,
      })),
    [categoriesQuery.data],
  );

  // Sort client-side.
  const filteredCategories = useMemo(() => {
    const result = [...categories];

    switch (sortBy) {
      case "az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "za":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "popular":
        result.sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0));
        break;
    }

    return result;
  }, [categories, sortBy]);

  const isLoading = categoriesQuery.isLoading;
  const totalCount = categories.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-kwik-orange">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Categories</span>
          </nav>

          <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                All Categories
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading
                  ? "Loading categories…"
                  : `${totalCount} categor${totalCount !== 1 ? "ies" : "y"} — browse products by department`}
              </p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((v) => !v)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  aria-expanded={isSortOpen}
                  aria-label="Sort categories"
                >
                  <SlidersHorizontal className="h-4 w-4 text-kwik-orange" />
                  <span className="hidden sm:inline">Sort</span>
                </button>
                {isSortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSortOpen(false)}
                    />
                    <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
                      {CATEGORY_SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.value);
                            setIsSortOpen(false);
                          }}
                          className={cn(
                            "block w-full px-3 py-2.5 text-left text-sm transition-colors",
                            sortBy === opt.value
                              ? "bg-kwik-orange-tint font-medium text-kwik-orange"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category grid ── */}
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse border border-border bg-muted/40 dark:bg-white/5"
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filteredCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <PackageOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">
              No categories yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Categories will appear here once sellers start listing products.
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && filteredCategories.length > 0 && (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={`${category.id}-${index}`}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.35, ease: "easeOut" },
                    },
                  }}
                >
                  <CategoryCard category={category} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
