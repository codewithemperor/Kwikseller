import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SearchProductsDto } from './dto';
import {
  allProducts,
  SearchableProduct,
  categoriesMetadata,
  CategoryMetadata,
} from './products.data';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  /**
   * Search products by query string.
   * Searches name, description, category, store, and tags.
   * Returns results sorted by relevance score.
   */
  search(dto: SearchProductsDto) {
    const { q, category, limit = 20 } = dto;

    // If category specified without query, filter by category
    if (category && !q?.trim()) {
      const filtered = allProducts
        .filter((p) => p.categorySlug === category)
        .slice(0, limit);

      return {
        data: filtered,
        meta: {
          query: '',
          category,
          total: filtered.length,
          categories: this.getCategories(),
        },
      };
    }

    // If query provided, search products
    if (q?.trim()) {
      const terms = q
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const scored = allProducts
        .map((product) => {
          let score = 0;
          const name = product.name.toLowerCase();
          const desc = product.description.toLowerCase();
          const cat = product.category.toLowerCase();
          const catSlug = product.categorySlug.toLowerCase();
          const store = product.store.toLowerCase();
          const tags = product.tags.map((t) => t.toLowerCase());

          for (const term of terms) {
            // Name match (highest weight)
            if (name === term) score += 100;
            else if (name.startsWith(term)) score += 80;
            else if (name.includes(term)) score += 60;

            // Tag exact match
            if (tags.some((t) => t === term)) score += 50;
            else if (tags.some((t) => t.includes(term))) score += 30;

            // Category match
            if (cat === term || catSlug === term) score += 40;
            else if (cat.includes(term) || catSlug.includes(term)) score += 25;

            // Store match
            if (store.includes(term)) score += 15;

            // Description match
            if (desc.includes(term)) score += 10;

            // Boost featured and new products
            if (product.isFeatured) score += 5;
            if (product.isNew) score += 3;
          }

          // Filter by category if specified
          if (category && product.categorySlug !== category) {
            score = 0;
          }

          return { product, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.product);

      return {
        data: scored,
        meta: {
          query: q,
          category: category || '',
          total: scored.length,
          categories: this.getCategories(),
        },
      };
    }

    // No query or category - return empty with categories
    return {
      data: [],
      meta: {
        query: '',
        category: '',
        total: 0,
        categories: this.getCategories(),
      },
    };
  }

  /**
   * Get all unique categories with counts
   */
  private getCategories(): { slug: string; name: string; count: number }[] {
    const catMap = new Map<string, { name: string; count: number }>();
    for (const p of allProducts) {
      const existing = catMap.get(p.categorySlug);
      if (existing) {
        existing.count++;
      } else {
        catMap.set(p.categorySlug, { name: p.category, count: 1 });
      }
    }
    return Array.from(catMap.entries()).map(([slug, { name, count }]) => ({
      slug,
      name,
      count,
    }));
  }

  /**
   * Get a single product by ID
   */
  getById(id: string): SearchableProduct | null {
    return allProducts.find((p) => p.id === id) || null;
  }

  /**
   * Get featured products
   */
  getFeatured(limit = 8): SearchableProduct[] {
    return allProducts.filter((p) => p.isFeatured).slice(0, limit);
  }

  /**
   * Get trending products — featured products sorted by rating,
   * then high-rated non-featured products.
   */
  getTrending(limit = 10): SearchableProduct[] {
    return allProducts
      .slice()
      .sort((a, b) => {
        // Featured products first
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Then by rating descending
        return b.rating - a.rating;
      })
      .slice(0, limit);
  }

  /**
   * Get top products — sorted by rating descending, limited.
   */
  getTop(limit = 10): SearchableProduct[] {
    return allProducts
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get deal of the day products — products with a comparePrice (discount),
   * sorted by discount percentage descending.
   */
  getDeals(limit = 10): SearchableProduct[] {
    return allProducts
      .filter((p) => p.comparePrice && p.comparePrice > p.price)
      .map((p) => {
        const discountPercent =
          ((p.comparePrice! - p.price) / p.comparePrice!) * 100;
        return { product: p, discountPercent };
      })
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit)
      .map((item) => ({
        ...item.product,
        discountPercent: Math.round(item.discountPercent),
      })) as (SearchableProduct & { discountPercent: number })[];
  }

  /**
   * Get products for a specific category with full category details.
   */
  getCategoryDetail(slug: string, limit = 20) {
    const categoryMeta = categoriesMetadata.find((c) => c.slug === slug);

    const products = allProducts.filter((p) => p.categorySlug === slug);
    const productCount = products.length;

    // Build category detail — use metadata if available, otherwise derive from products
    let category: CategoryMetadata & { productCount: number };

    if (categoryMeta) {
      category = {
        ...categoryMeta,
        productCount,
      };
    } else if (products.length > 0) {
      // Fallback: derive from the first product's data
      category = {
        slug,
        name: products[0].category,
        description: '',
        image: products[0].image,
        productCount,
      };
    } else {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    return {
      category,
      products: products.slice(0, limit),
      total: productCount,
    };
  }
}
