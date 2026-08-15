import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface TrendingSearchItem {
  id: string;
  label: string;
  query: string;
  category: string;
  count: number;
  trending: boolean;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns trending search terms derived from real database data.
   * Combines top-selling product names, popular categories, and popular brands.
   */
  async getTrending(limit: number = 12): Promise<TrendingSearchItem[]> {
    const effectiveLimit = Math.min(Math.max(limit, 1), 50);

    // Fetch top products by totalSales
    const topProducts = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ totalSales: 'desc' }, { rating: 'desc' }],
      take: effectiveLimit,
      select: {
        id: true,
        name: true,
        slug: true,
        totalSales: true,
        category: { select: { name: true } },
      },
    });

    // Fetch top categories by product count
    const topCategories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { products: { _count: 'desc' } },
      take: Math.ceil(effectiveLimit / 3),
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    });

    // Fetch top brands by product count
    const topBrands = await this.prisma.brand.findMany({
      where: { status: true },
      orderBy: { products: { _count: 'desc' } },
      take: Math.ceil(effectiveLimit / 3),
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    });

    const results: TrendingSearchItem[] = [];

    // Add product-based trending searches
    for (const product of topProducts) {
      const label = product.name.length > 40
        ? product.name.slice(0, 37) + '...'
        : product.name;
      results.push({
        id: `product-${product.id}`,
        label,
        query: product.name,
        category: product.category?.name || 'Products',
        count: product.totalSales || 0,
        trending: true,
      });
    }

    // Add category-based trending searches
    for (const cat of topCategories) {
      results.push({
        id: `category-${cat.id}`,
        label: cat.name,
        query: cat.name,
        category: 'Categories',
        count: cat._count.products,
        trending: true,
      });
    }

    // Add brand-based trending searches
    for (const brand of topBrands) {
      results.push({
        id: `brand-${brand.id}`,
        label: brand.name,
        query: brand.name,
        category: 'Brands',
        count: brand._count.products,
        trending: true,
      });
    }

    // Deduplicate by query (case-insensitive), keep the one with the highest count
    const seen = new Map<string, TrendingSearchItem>();
    for (const item of results) {
      const key = item.query.toLowerCase();
      const existing = seen.get(key);
      if (!existing || item.count > existing.count) {
        seen.set(key, item);
      }
    }

    // Sort by count desc, take the limit
    return Array.from(seen.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, effectiveLimit);
  }

  /**
   * Returns autocomplete suggestions for a search term.
   * Searches product names, category names, and brand names.
   */
  async getSuggestions(q: string, limit: number = 8): Promise<string[]> {
    if (!q || !q.trim()) return [];

    const effectiveLimit = Math.min(Math.max(limit, 1), 20);
    const term = q.trim();

    // Search product names
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        name: { contains: term },
      },
      orderBy: [{ totalSales: 'desc' }, { rating: 'desc' }],
      take: effectiveLimit,
      select: { name: true },
    });

    // Search category names
    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: term },
      },
      take: Math.ceil(effectiveLimit / 3),
      select: { name: true },
    });

    // Search brand names
    const brands = await this.prisma.brand.findMany({
      where: {
        status: true,
        name: { contains: term },
      },
      take: Math.ceil(effectiveLimit / 3),
      select: { name: true },
    });

    // Combine and deduplicate
    const suggestions = [
      ...products.map((p) => p.name),
      ...categories.map((c) => c.name),
      ...brands.map((b) => b.name),
    ];

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const s of suggestions) {
      const lower = s.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(s);
      }
    }

    return unique.slice(0, effectiveLimit);
  }
}
