/**
 * Dummy-data API gateway.
 *
 * Catch-all route handler for /api/v1/*. When NEXT_PUBLIC_USE_DUMMY_DATA
 * is "true", every marketplace API call is served here from the in-memory
 * dummy dataset — no external backend or database required.
 *
 * When the flag is "false" (production), requests are proxied to the real
 * NestJS backend configured via API_URL / NEXT_PUBLIC_API_URL, and the
 * dummy data modules are never imported (keeping them out of production).
 *
 * Response shape matches `ApiResponse<T>` = { success, data, message?, meta? }
 * so the existing api-client works unchanged.
 */

import { NextRequest } from "next/server";

const USE_DUMMY = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true";

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok<T>(data: T, meta?: Record<string, unknown>, message?: string) {
  return Response.json({ success: true, data, message, meta });
}

function err(status: number, message: string) {
  return Response.json({ success: false, message, statusCode: status }, { status });
}

function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    meta: { page, limit, total, totalPages },
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Lazy dummy-data loader (only imported in dummy mode) ──────────────────

async function loadDummy() {
  const catalog = await import("@/lib/dummy-data/catalog");
  const userMod = await import("@/lib/dummy-data/user");
  return { catalog, userMod };
}

// ─── Proxy to real backend (production / non-dummy mode) ───────────────────

async function proxy(req: NextRequest, segments: string[]): Promise<Response> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    `${process.env.API_URL || "http://localhost:4000"}/api/v1`;
  const base = apiBase.endsWith("/api/v1") ? apiBase : `${apiBase.replace(/\/$/, "")}/api/v1`;
  const url = `${base}/${segments.join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(req.headers.get("authorization")
        ? { authorization: req.headers.get("authorization")! }
        : {}),
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }
  try {
    const upstream = await fetch(url, init);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch {
    return err(502, "Backend unreachable. Is the API running?");
  }
}

// ─── Main router ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  if (!USE_DUMMY) return proxy(req, path);
  return routeDummy(req, path, "GET");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  if (!USE_DUMMY) return proxy(req, path);
  return routeDummy(req, path, "POST");
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  if (!USE_DUMMY) return proxy(req, path);
  return routeDummy(req, path, "PUT");
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  if (!USE_DUMMY) return proxy(req, path);
  return routeDummy(req, path, "PATCH");
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  if (!USE_DUMMY) return proxy(req, path);
  return routeDummy(req, path, "DELETE");
}

// ─── Dummy router ──────────────────────────────────────────────────────────

async function routeDummy(req: NextRequest, path: string[], method: string): Promise<Response> {
  try {
    const { catalog, userMod } = await loadDummy();
    const { products, categories, brands, banners, deals, sellers, stores, deliveryRates, banks, paymentMethods, reviews } = catalog;
    const { user, addresses, orderStore, addOrder, findOrder, updateOrderStatus, nextOrderNumber, wallet, tiers, getNotificationPreferences, updateNotificationPreferences } = userMod;
    const q = req.nextUrl.searchParams;
    const body = method === "GET" || method === "DELETE" ? {} : await safeJson(req);

    // ── Products ──────────────────────────────────────────────────────────
    if (path[0] === "products") {
      if (path[1] === "home-feed") {
        // Map API products → flat MarketplaceProduct shape expected by the
        // home feed page (home-feed-page.tsx → rankProductsForMember).
        const toFlat = (p: typeof products[number]) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          comparePrice: p.comparePrice || undefined,
          image: p.images[0]?.url ?? "",
          rating: p.rating,
          reviewCount: p.reviewCount,
          store: p.store?.name ?? "Kwikseller",
          storeId: p.storeId,
          storeSlug: p.store?.slug,
          category: p.category?.name ?? "",
          productType: "PHYSICAL" as const,
          productSource: "VENDOR_STOCK" as const,
          requiresShipping: true,
          trackInventory: true,
          isNew: (p.tags?.map((t) => t.tag?.name).filter(Boolean) ?? []).includes("New"),
          tag: p.tags?.[0]?.tag?.name,
          description: p.description,
          images: p.images?.map((i) => i.url),
          stock: p.stock,
        });
        return ok({
          heroBanners: banners
            .filter((b) => b.bannerType === "hero")
            .map((b) => ({
              id: b.id,
              title: b.title ?? "",
              subtitle: b.subTitle ?? "",
              image: b.image,
              href: b.url ?? "/products",
              badge: b.buttonText ?? "Shop Now",
            })),
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            image: c.imageUrl,
            itemCount: c._count?.products ?? 0,
          })),
          brands: brands.map((b) => ({
            id: b.id,
            name: b.name,
            image: b.image,
            productCount: b._count?.products ?? 0,
          })),
          featuredProducts: products.filter((p) => p.isFeatured).slice(0, 10).map(toFlat),
          dealProducts: products.filter((p) => p.comparePrice && p.comparePrice > p.price).slice(0, 10).map(toFlat),
          trendingProducts: [...products].sort((a, b) => b.totalSales - a.totalSales).slice(0, 10).map(toFlat),
        });
      }

      if (path[1] === "search") {
        const term = (q.get("q") ?? "").toLowerCase().trim();
        const limit = Number(q.get("limit") ?? 20);
        const page = Number(q.get("page") ?? 1);
        let list = products;
        if (term)
          list = products.filter(
            (p) =>
              p.name.toLowerCase().includes(term) ||
              p.description.toLowerCase().includes(term) ||
              p.category.name.toLowerCase().includes(term) ||
              p.store.name.toLowerCase().includes(term) ||
              p.brand.name.toLowerCase().includes(term),
          );
        const { data, meta } = paginate(list, page, limit);
        return ok(data, meta);
      }

      if (path[1] === "trending") {
        const limit = Number(q.get("limit") ?? 10);
        return ok([...products].sort((a, b) => b.totalSales - a.totalSales).slice(0, limit));
      }
      if (path[1] === "top") {
        const limit = Number(q.get("limit") ?? 10);
        return ok([...products].sort((a, b) => b.rating - a.rating).slice(0, limit));
      }
      if (path[1] === "deals") {
        const limit = Number(q.get("limit") ?? 10);
        return ok(products.filter((p) => p.comparePrice && p.comparePrice > p.price).slice(0, limit));
      }
      if (path[1] === "categories") return ok(categories);
      if (path[1] === "category" && path[2]) {
        const slug = path[2];
        const limit = Number(q.get("limit") ?? 50);
        const list = products.filter((p) => p.category.slug === slug);
        return ok(list.slice(0, limit), { total: list.length });
      }
      if (path[1] === "slug" && path[2]) {
        const p = products.find((x) => x.slug === path[2]);
        return p ? ok(p) : err(404, "Product not found");
      }
      if (path[1] && !path[2]) {
        const p = products.find((x) => x.id === path[1] || x.slug === path[1]);
        return p ? ok(p) : err(404, "Product not found");
      }
      const page = Number(q.get("page") ?? 1);
      const limit = Number(q.get("limit") ?? 20);
      const search = q.get("search") ?? q.get("q") ?? "";
      const categoryId = q.get("categoryId") ?? q.get("category") ?? "";
      const brandId = q.get("brandId") ?? "";
      const storeId = q.get("storeId") ?? "";
      const isFeatured = q.get("isFeatured");
      const sortBy = q.get("sortBy") ?? "createdAt";
      const sortOrder = q.get("sortOrder") ?? "desc";
      let list = products.slice();
      if (search) {
        const t = search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t));
      }
      if (categoryId) list = list.filter((p) => p.categoryId === categoryId || p.category.slug === categoryId);
      if (brandId) list = list.filter((p) => p.brandId === brandId || p.brand.slug === brandId);
      if (storeId) list = list.filter((p) => p.storeId === storeId || p.store.slug === storeId);
      if (isFeatured === "true") list = list.filter((p) => p.isFeatured);
      list.sort((a, b) => {
        const dir = sortOrder === "asc" ? 1 : -1;
        if (sortBy === "price") return (a.price - b.price) * dir;
        if (sortBy === "rating") return (a.rating - b.rating) * dir;
        if (sortBy === "totalSales") return (a.totalSales - b.totalSales) * dir;
        return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * dir;
      });
      const { data, meta } = paginate(list, page, limit);
      return ok(data, meta);
    }

    // ── Search (trending terms + suggestions) ─────────────────────────────
    if (path[0] === "search") {
      if (path[1] === "trending") {
        // Return a curated list of trending search terms derived from the
        // catalog. The list is deterministic so the UI cache stays stable.
        const limit = Number(q.get("limit") ?? 12);
        const term = (q: string) => q.replace(/\s+/g, " ").trim();
        const trending = [
          "Ankara dresses",
          "iPhone 15",
          "Sneakers",
          "Skincare",
          "Wireless earbuds",
          "Smartwatch",
          "Headphones",
          "Sunglasses",
          "Handbags",
          "Foundation",
          "Air fryer",
          "Coffee maker",
          "Winter jacket",
          "Running shoes",
          "Bluetooth speaker",
          "Face serum",
        ]
          .slice(0, limit)
          .map((label, i) => ({
            id: `tr-${i + 1}`,
            label,
            query: term(label.toLowerCase()),
            category:
              [
                "Fashion & Apparel",
                "Electronics",
                "Fashion & Apparel",
                "Beauty & Health",
                "Electronics",
                "Electronics",
                "Electronics",
                "Fashion & Apparel",
                "Fashion & Apparel",
                "Beauty & Health",
                "Home & Living",
                "Home & Living",
                "Fashion & Apparel",
                "Fashion & Apparel",
                "Electronics",
                "Beauty & Health",
              ][i] ?? "All",
            count: Math.max(40, 480 - i * 25),
            trending: true,
          }));
        return ok(trending);
      }
      if (path[1] === "suggestions") {
        // Lightweight prefix suggestions for the search overlay.
        const term = (q.get("q") ?? "").toLowerCase().trim();
        const pool = Array.from(
          new Set(
            products
              .map((p) => p.name)
              .concat(brands.map((b) => b.name))
              .concat(categories.map((c) => c.name))
              .concat(stores.map((s) => s.name)),
          ),
        );
        const list = term
          ? pool.filter((n) => n.toLowerCase().includes(term)).slice(0, 8)
          : pool.slice(0, 8);
        return ok(list.map((label, i) => ({ id: `sg-${i}`, label, type: "suggestion" })));
      }
      return err(404, "Unknown search endpoint");
    }

    // ── Categories ────────────────────────────────────────────────────────
    if (path[0] === "categories") {
      if (path[1] === "slug" && path[2]) {
        const c = categories.find((x) => x.slug === path[2]);
        if (!c) return err(404, "Category not found");
        const catProducts = products.filter((p) => p.categoryId === c.id);
        return ok({ ...c, products: catProducts });
      }
      return ok(categories);
    }

    // ── Brands ────────────────────────────────────────────────────────────
    if (path[0] === "brands") return ok(brands);

    // ── Banners ───────────────────────────────────────────────────────────
    if (path[0] === "banners") {
      const type = q.get("type");
      const list = type ? banners.filter((b) => b.bannerType === type) : banners;
      return ok(list);
    }

    // ── Deals ─────────────────────────────────────────────────────────────
    if (path[0] === "deals") {
      if (path[1] === "flash") return ok(deals.filter((d) => d.dealType === "FLASH"));
      if (path[1] === "featured") return ok(deals.filter((d) => d.dealType === "FEATURED"));
      const dealType = q.get("dealType");
      const list = dealType ? deals.filter((d) => d.dealType === dealType) : deals;
      return ok(list);
    }

    // ── Sellers / Stores ──────────────────────────────────────────────────
    if (path[0] === "sellers") return ok(sellers);
    if (path[0] === "stores") {
      if (!path[1]) return ok(stores);
      const store = stores.find((s) => s.slug === path[1] || s.id === path[1]);
      if (!store) return err(404, "Store not found");
      if (path[2] === "products") {
        if (path[3]) {
          const p = products.find((x) => x.slug === path[3] && x.storeId === store.id);
          return p ? ok(p) : err(404, "Product not found");
        }
        const list = products.filter((p) => p.storeId === store.id);
        return ok(list);
      }
      return ok(store);
    }

    // ── Delivery rates / Banks / Payment methods ──────────────────────────
    if (path[0] === "delivery-rates") {
      const state = q.get("state");
      const lg = q.get("localGovernment");
      let list = deliveryRates;
      if (state) list = list.filter((r) => r.state.toLowerCase() === state.toLowerCase());
      if (lg) list = list.filter((r) => r.localGovernment.toLowerCase() === lg.toLowerCase());
      return ok(list[0] ?? deliveryRates[0]);
    }
    if (path[0] === "payments") {
      if (path[1] === "methods") return ok(paymentMethods);
      if (path[1] === "banks") return ok(banks);
      if (path[1] === "verify" && path[2]) {
        const order = findOrder(path[2]);
        return ok({ reference: path[2], status: "success", verified: true, orderId: order?.id });
      }
      if (path[1] === "paystack" && path[2] === "health") return ok({ status: "healthy" });
    }

    // ── Orders ────────────────────────────────────────────────────────────
    if (path[0] === "orders") {
      if (path[1] === "store") {
        const status = q.get("status");
        let list = orderStore.slice();
        if (status) list = list.filter((o) => o.status === status);
        return ok(list);
      }
      if (path[1] && path[2] === "tracking") {
        const order = findOrder(path[1]);
        if (!order) return err(404, "Order not found");
        // Attach a delivery agent + map snapshot once the order is en route.
        const agent = order.deliveryAgent
          ?? (order.status === "SHIPPED" || order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED"
            ? userMod.pickAgentForOrder(order.id)
            : undefined);
        const map = userMod.buildTrackingMap(order);
        return ok({
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
          timeline: order.timeline,
          deliveryAgent: agent,
          map,
        });
      }
      if (path[1] && path[2] && ["accept", "reject", "ready", "ship", "cancel"].includes(path[2])) {
        if (method !== "POST") return err(405, "Method not allowed");
        const statusMap: Record<string, string> = {
          accept: "CONFIRMED", ready: "READY", ship: "SHIPPED", cancel: "CANCELLED", reject: "REJECTED",
        };
        const order = updateOrderStatus(path[1], statusMap[path[2]] as never, (body as { reason?: string }).reason);
        if (!order) return err(404, "Order not found");
        return ok(order);
      }
      // POST /orders/:id/delivery-rating — buyer rates the delivery experience.
      // Persisted onto the order so the tracking page can show "Already rated" on revisit.
      if (path[1] && path[2] === "delivery-rating" && method === "POST") {
        const order = findOrder(path[1]);
        if (!order) return err(404, "Order not found");
        const { rating, comment, tags } = body as { rating?: number; comment?: string; tags?: string[] };
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
          return err(400, "Rating must be a number between 1 and 5");
        }
        const deliveryRating = {
          rating: Math.round(rating),
          comment: (comment ?? "").trim(),
          tags: Array.isArray(tags) ? tags.slice(0, 8) : [],
          createdAt: new Date().toISOString(),
        };
        // Attach to the order in memory (dummy mode keeps orderStore in module memory).
        (order as { deliveryRating?: typeof deliveryRating }).deliveryRating = deliveryRating;
        return ok({ success: true, deliveryRating });
      }
      // GET /orders/:id/delivery-rating — fetch the persisted delivery rating (if any).
      if (path[1] && path[2] === "delivery-rating" && method === "GET") {
        const order = findOrder(path[1]);
        if (!order) return err(404, "Order not found");
        const dr = (order as { deliveryRating?: unknown }).deliveryRating;
        return ok(dr ?? null);
      }
      if (path[1] && path[2] === "quote") {
        if (method !== "POST") return err(405, "Method not allowed");
        const order = findOrder(path[1]);
        if (!order) return err(404, "Order not found");
        const { deliveryFee, discount, discountType } = body as {
          deliveryFee?: number; discount?: number; discountType?: "AMOUNT" | "PERCENT";
        };
        if (typeof deliveryFee === "number") order.deliveryFee = deliveryFee;
        if (typeof discount === "number") {
          order.discount = discountType === "PERCENT" ? Math.round((order.subtotal * discount) / 100) : discount;
        }
        order.couponCode = discountType === "PERCENT" ? `${discount}% off` : `NGN${discount} off`;
        order.total = order.subtotal + order.deliveryFee - order.discount + order.platformFee;
        order.status = "CONFIRMED";
        order.updatedAt = new Date().toISOString();
        order.timeline.push({ status: "CONFIRMED", at: order.updatedAt, note: "Vendor quoted delivery & discount" });
        return ok(order);
      }
      if (path[1] && !path[2]) {
        const order = findOrder(path[1]);
        return order ? ok(order) : err(404, "Order not found");
      }
      const page = Number(q.get("page") ?? 1);
      const limit = Number(q.get("limit") ?? 20);
      const status = q.get("status");
      // In dummy mode there's no real auth, so return ALL orders (seeded
      // demo orders + those created via POST /checkout) so the buyer's
      // order list reflects the full marketplace activity.
      let list = orderStore.slice();
      if (status) list = list.filter((o) => o.status === status);
      const { data, meta } = paginate(list, page, limit);
      return ok(data, meta);
    }

    // ── Cart (server-side cart stub; marketplace uses client cart-store) ──
    if (path[0] === "cart") {
      if (path[1] === "validate") return ok({ valid: true, items: [], issues: [] });
      if (path[1] === "coupon" && method === "POST") {
        const code = (body as { code?: string }).code?.toUpperCase() ?? "";
        const cartItems = (body as { items?: Array<{ storeId?: string; store?: string; productStoreId?: string }> }).items ?? [];
        const coupon = catalog.coupons.find((c) => c.code === code && c.isActive);
        if (!coupon) return err(400, "Invalid or expired coupon code");
        // Check expiry
        if (new Date(coupon.expiresAt) < new Date()) return err(400, "This coupon has expired");
        // Vendor-specific coupon enforcement: if the coupon has a storeId, the
        // cart MUST contain at least one item from that vendor. We accept the
        // storeId on any of `storeId`, `store`, or `productStoreId` fields so
        // any client cart shape works.
        if (coupon.storeId) {
          const hasVendorItem = cartItems.some((it) => {
            const v = it.storeId ?? it.store ?? it.productStoreId ?? "";
            return v === coupon.storeId || v === coupon.storeName;
          });
          if (!hasVendorItem) {
            return ok({
              code,
              valid: false,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              storeName: coupon.storeName,
              storeId: coupon.storeId,
              message: `This coupon is exclusive to ${coupon.storeName}. Add an item from that vendor to your cart.`,
            });
          }
        }
        return ok({
          code,
          valid: true,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount,
          minOrder: coupon.minOrder,
          storeName: coupon.storeName,
          storeId: coupon.storeId,
          badgeText: coupon.badgeText,
          accentColor: coupon.accentColor,
          message: coupon.discountType === "FREE_DELIVERY"
            ? "Free delivery applied"
            : coupon.discountType === "AMOUNT"
              ? `₦${coupon.discountValue.toLocaleString()} off applied`
              : `${coupon.discountValue}% off applied`,
        });
      }
      return ok({ items: [], total: 0 });
    }

    // ── Coupons list (for the /coupons discovery page) ────────────────────
    if (path[0] === "coupons" && method === "GET") {
      const category = q.get("category");
      let list = catalog.coupons.filter((c) => c.isActive);
      if (category && category !== "ALL") list = list.filter((c) => c.category === category);
      return ok(list);
    }

    // ── FAQ + support tickets (Help & Support center) ─────────────────────
    if (path[0] === "faq" && method === "GET") {
      const category = q.get("category");
      let list = catalog.faqItems;
      if (category && category !== "ALL") list = list.filter((f) => f.category === category);
      return ok(list);
    }
    if (path[0] === "support" && path[1] === "tickets") {
      if (method === "GET") return ok(catalog.supportTickets);
      if (method === "POST") {
        const { subject, category, message, orderId, email } = body as {
          subject?: string; category?: string; message?: string; orderId?: string; email?: string;
        };
        if (!subject || !message) return err(400, "Subject and message are required");
        const ticket: catalog.SupportTicket = {
          id: `tkt-${Date.now().toString(36)}`,
          subject: subject.trim(),
          category: category ?? "GENERAL",
          message: message.trim(),
          orderId: orderId?.trim() || undefined,
          email: email?.trim() || undefined,
          status: "OPEN",
          createdAt: new Date().toISOString(),
        };
        catalog.supportTickets.unshift(ticket);
        return ok(ticket);
      }
    }

    // ── Checkout ─────────────────────────────────────────────────────────
    if (path[0] === "checkout") {
      if (method === "POST") {
        return handleCheckout(body, products, addresses, addOrder, nextOrderNumber, user, stores);
      }
      if (path[1] === "payments" && path[2]) {
        const order = findOrder(path[2]);
        return ok({ reference: path[2], status: "success", verified: true, order, amount: order?.total });
      }
      return err(405, "Method not allowed");
    }

    // ── Payments initialize ───────────────────────────────────────────────
    if (path[0] === "payments" && path[1] === "initialize" && method === "POST") {
      const { orderId, gateway } = body as { orderId?: string; gateway?: string };
      const order = orderId ? findOrder(orderId) : undefined;
      const reference = uid("ref");
      return ok({
        reference,
        authorizationUrl: `/checkout/verify?reference=${reference}`,
        gateway: gateway ?? "PAYSTACK",
        amount: order?.total ?? 0,
        orderId,
      });
    }

    // ── Users / Addresses ─────────────────────────────────────────────────
    if (path[0] === "users") {
      if (path[1] === "me" && path[2] === "notification-preferences") {
        const userId = user.id;
        if (method === "GET") {
          const prefs = getNotificationPreferences(userId);
          if (!prefs) return err(404, "Preferences not found");
          return ok(prefs);
        }
        if (method === "PUT" || method === "PATCH") {
          const patch = body as Partial<Parameters<typeof updateNotificationPreferences>[1]>;
          const next = updateNotificationPreferences(userId, patch);
          return ok(next);
        }
      }
      if (path[1] === "me" && path[2] === "wallet") return ok(wallet);
      if (path[1] === "me") return ok(user);
      if (path[1] === "addresses") {
        if (method === "POST") {
          const newAddr = { id: uid("addr"), isDefault: false, type: "OTHER" as const, ...(body as object) };
          addresses.push(newAddr as never);
          return ok(newAddr);
        }
        if (method === "DELETE" && path[2]) {
          const idx = addresses.findIndex((a) => a.id === path[2]);
          if (idx >= 0) {
            addresses.splice(idx, 1);
            return ok({ deleted: true });
          }
          return err(404, "Address not found");
        }
        return ok(addresses);
      }
      return ok(user);
    }

    // ── Auth (dummy tokens) ───────────────────────────────────────────────
    if (path[0] === "auth") {
      if (method === "POST" && (path[1] === "login" || path[1] === "register")) {
        return ok({
          user,
          accessToken: "dummy-access-token-" + Date.now(),
          refreshToken: "dummy-refresh-token-" + Date.now(),
        });
      }
      if (method === "POST" && path[1] === "refresh") {
        return ok({ accessToken: "dummy-access-token-" + Date.now(), refreshToken: "dummy-refresh-token-" + Date.now() });
      }
      if (path[1] === "me") return ok(user);
    }

    // ── Notifications ─────────────────────────────────────────────────────
    if (path[0] === "notifications") {
      return ok([
        { id: "n1", title: "Order shipped!", message: "Your Ankara Print Maxi Dress is on the way.", type: "ORDER", read: false, createdAt: new Date().toISOString() },
        { id: "n2", title: "Flash deal alert", message: "50% off electronics — ends tonight.", type: "PROMO", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "n3", title: "Welcome to Kwikseller!", message: "Enjoy 15% off your first order with WELCOME15.", type: "WELCOME", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ]);
    }

    // ── Dashboard stats ───────────────────────────────────────────────────
    if (path[0] === "dashboard" && path[1] === "stats") {
      return ok({
        totalProducts: products.length,
        totalOrders: orderStore.length,
        totalUsers: 1,
        totalRevenue: orderStore.reduce((s, o) => s + o.total, 0),
      });
    }

    // ── Reviews ───────────────────────────────────────────────────────────
    if (path[0] === "reviews") {
      // GET /reviews/store/:storeId — list reviews for products belonging to a store.
      // Used by the vendor reviews dashboard.
      if (path[1] === "store" && path[2]) {
        const storeId = path[2];
        const storeProducts = products.filter((p) => p.storeId === storeId);
        const productIds = new Set(storeProducts.map((p) => p.id));
        const list = reviews
          .filter((r) => productIds.has(r.productId) || productIds.has(`p-${r.productId.replace(/^p-/, "")}`))
          .map((r) => {
            const prod = products.find((p) => p.id === r.productId || p.id === `p-${r.productId.replace(/^p-/, "")}`);
            return {
              ...r,
              product: prod
                ? { id: prod.id, name: prod.name, slug: prod.slug, image: prod.images[0]?.url }
                : undefined,
            };
          });
        return ok(list);
      }
      // DELETE /reviews/:id/reply — vendor removes an existing reply.
      // Returns 200 with the updated review (vendorReply stripped) so the
      // UI can update immediately. Idempotent: deleting a review with no
      // reply still returns 200.
      if (path[1] && path[2] === "reply" && method === "DELETE") {
        const review = reviews.find((r) => r.id === path[1]);
        if (!review) return err(404, "Review not found");
        (review as { vendorReply?: unknown }).vendorReply = undefined;
        const prod = products.find((p) => p.id === review.productId || p.id === `p-${review.productId.replace(/^p-/, "")}`);
        return ok({
          ...review,
          product: prod ? { id: prod.id, name: prod.name, slug: prod.slug, image: prod.images[0]?.url } : undefined,
        });
      }
      // POST /reviews/:id/reply — vendor posts a reply to a review.
      if (path[1] && path[2] === "reply" && method === "POST") {
        const review = reviews.find((r) => r.id === path[1]);
        if (!review) return err(404, "Review not found");
        const { text, authorName } = body as { text?: string; authorName?: string };
        if (!text || !text.trim()) return err(400, "Reply text is required");
        const prod = products.find((p) => p.id === review.productId || p.id === `p-${review.productId.replace(/^p-/, "")}`);
        const reply = {
          id: `vr-${review.id}-${Date.now()}`,
          authorName: authorName?.trim() || prod?.store?.name || "Vendor",
          text: text.trim(),
          createdAt: new Date().toISOString(),
        };
        // Mutate in place — dummy mode keeps the catalog in module memory.
        (review as { vendorReply?: typeof reply }).vendorReply = reply;
        return ok({ ...review, product: prod ? { id: prod.id, name: prod.name, slug: prod.slug, image: prod.images[0]?.url } : undefined });
      }
      if (path[1]) {
        return ok(reviews.filter((r) => r.productId === path[1] || r.productId === path[1].replace(/^p-/, "")));
      }
      return ok(reviews);
    }

    // ── Store analytics (vendor dashboard) ────────────────────────────────
    if (path[0] === "store" && path[1] === "analytics") {
      const period = q.get("period") ?? "30d";
      const storeOrders = orderStore;
      const revenue = storeOrders.reduce((s, o) => s + o.total, 0);
      const pendingCount = storeOrders.filter((o) => o.status === "PENDING").length;
      const deliveredCount = storeOrders.filter((o) => o.status === "DELIVERED").length;

      // Build a 30-day trend (deterministic; same input → same output).
      // We seed each day's revenue/orders from the actual order total but
      // apply a stable pseudo-random curve so the chart looks realistic.
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const revenueTrend = Array.from({ length: days }).map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (days - 1 - i));
        // Deterministic pseudo-random: hash of date + index.
        const seed = (date.getDate() * 31 + i * 7 + 13) % 100;
        const wave = 0.55 + (Math.sin(i / 3.5) + 1) * 0.2 + (seed / 100) * 0.25;
        const dayRevenue = Math.max(0, Math.round((revenue / Math.max(days, 1)) * wave));
        const dayOrders = Math.max(0, Math.round((storeOrders.length / Math.max(days, 1)) * wave));
        return {
          day: i,
          date: date.toISOString().slice(0, 10),
          label: date.toLocaleDateString("en-NG", { weekday: "short", day: "numeric" }),
          revenue: dayRevenue,
          orders: dayOrders,
          visitors: Math.round(dayOrders * (8 + (seed % 6))),
          conversion: dayOrders > 0 ? Number(((dayOrders / Math.max(1, dayOrders * 10)) * 100).toFixed(1)) : 0,
        };
      });

      // Period-over-period deltas (deterministic).
      const lastPeriodRevenue = Math.round(revenue * 0.82);
      const revenueDeltaPct = lastPeriodRevenue > 0
        ? Number((((revenue - lastPeriodRevenue) / lastPeriodRevenue) * 100).toFixed(1))
        : 0;
      const lastPeriodOrders = Math.max(1, Math.round(storeOrders.length * 0.9));
      const ordersDeltaPct = Number(
        (((storeOrders.length - lastPeriodOrders) / Math.max(1, lastPeriodOrders)) * 100).toFixed(1),
      );

      return ok({
        period,
        revenue,
        ordersCount: storeOrders.length,
        pendingCount,
        deliveredCount,
        avgOrderValue: storeOrders.length ? Math.round(revenue / storeOrders.length) : 0,
        productsCount: products.length,
        // Period-over-period deltas.
        revenueDeltaPct,
        ordersDeltaPct,
        lastPeriodRevenue,
        lastPeriodOrders,
        // 30-day (or 7d/90d) trend with daily breakdown.
        revenueTrend,
        // Top 5 products by sales.
        topProducts: products.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          sales: p.totalSales,
          revenue: p.totalSales * p.price,
          image: p.images[0]?.url ?? null,
        })),
        // Category breakdown for the donut chart.
        categoryBreakdown: categories.slice(0, 6).map((c) => {
          const catProducts = products.filter((p) => p.categoryId === c.id);
          const catRevenue = catProducts.reduce((s, p) => s + p.totalSales * p.price, 0);
          return {
            id: c.id,
            name: c.name,
            products: catProducts.length,
            revenue: catRevenue,
            share: Number(((catRevenue / Math.max(1, revenue)) * 100).toFixed(1)),
          };
        }),
      });
    }

    // ── Wishlist ──────────────────────────────────────────────────────────
    if (path[0] === "wishlist") return ok(products.filter((p) => p.isFeatured).slice(0, 4));

    // ── KwikCoins wallet ──────────────────────────────────────────────────
    if (path[0] === "wallet") {
      // POST /wallet/redeem — convert KwikCoins to cash / ad credit / transfer.
      // Must be checked BEFORE the GET handlers below so POST isn't swallowed.
      if (method === "POST" && path[1] === "redeem") {
        const amount = Number((body as { amount?: unknown }).amount);
        const redemptionType = (body as { redemptionType?: string }).redemptionType as
          | "CASH"
          | "AD_CREDIT"
          | "TRANSFER"
          | undefined;

        if (!Number.isFinite(amount) || amount <= 0) {
          return err(400, "Enter a valid KwikCoins amount greater than 0");
        }
        if (!redemptionType || !["CASH", "AD_CREDIT", "TRANSFER"].includes(redemptionType)) {
          return err(400, "Invalid redemption type");
        }
        if (amount > wallet.balance) {
          return err(400, "Insufficient KwikCoins balance");
        }

        const nairaValue = amount * 10; // 1 KwikCoin = ₦10
        const categoryMap: Record<string, "REDEMPTION" | "AD_CREDIT"> = {
          CASH: "REDEMPTION",
          AD_CREDIT: "AD_CREDIT",
          TRANSFER: "REDEMPTION",
        };
        const labelMap: Record<string, string> = {
          CASH: "cash to wallet",
          AD_CREDIT: "ad credit",
          TRANSFER: "transfer",
        };
        const category = categoryMap[redemptionType];

        // Mutate the in-memory wallet (dummy mode only).
        wallet.balance -= amount;
        wallet.lifetimeSpent += amount;
        wallet.nairaEquivalent = wallet.balance * 10;

        const tx = {
          id: uid("wt"),
          type: "DEBIT" as const,
          amount,
          description: `Redeemed ${amount.toLocaleString()} KwikCoins for ₦${nairaValue.toLocaleString()} ${labelMap[redemptionType]}`,
          category,
          createdAt: new Date().toISOString(),
        };
        wallet.transactions.unshift(tx);

        return ok({ success: true, newBalance: wallet.balance, transaction: tx });
      }

      if (path[1] === "transactions") {
        const type = q.get("type") as "CREDIT" | "DEBIT" | null;
        let txs = wallet.transactions;
        if (type) txs = txs.filter((t) => t.type === type);
        return ok(txs);
      }
      if (path[1] === "tiers") return ok(tiers);
      // GET /wallet — full wallet summary
      return ok(wallet);
    }
    // (notification-preferences and wallet are handled inside the `users` block above)


    // ── Delivery agents (cycle 10) ───────────────────────────────────────
    // Public leaderboard of marketplace couriers, plus per-agent rating
    // aggregation. Used by the /delivery-agents page so buyers can see
    // which delivery partners are top-rated.
    if (path[0] === "delivery-agents") {
      // GET /delivery-agents — leaderboard (sorted by avg rating).
      if (!path[1]) {
        return ok(userMod.getDeliveryAgentLeaderboard());
      }
      // GET /delivery-agents/:id — single agent + their rating summary.
      if (path[1] && !path[2]) {
        const agent = userMod.deliveryAgents.find((a) => a.id === path[1]);
        if (!agent) return err(404, "Delivery agent not found");
        return ok({
          agent,
          summary: userMod.getDeliveryAgentRatings(agent.id),
        });
      }
      // GET /delivery-agents/:id/ratings — just the rating entries list.
      if (path[1] && path[2] === "ratings") {
        const summary = userMod.getDeliveryAgentRatings(path[1]);
        return ok({
          agentId: path[1],
          totalRatings: summary.totalRatings,
          averageRating: summary.averageRating,
          ratings: summary.recentRatings,
        });
      }
    }

    // ── Pool offers (stub) ────────────────────────────────────────────────
    if (path[0] === "pool") return ok([]);

    return err(404, `No dummy handler for ${method} /api/v1/${path.join("/")}`);
  } catch (e) {
    return err(500, e instanceof Error ? e.message : "Dummy API error");
  }
}

// ─── Checkout handler (TODO #6: vendor receives the order) ──────────────────

function handleCheckout(
  body: Record<string, unknown>,
  products: typeof import("@/lib/dummy-data/catalog").products,
  addresses: typeof import("@/lib/dummy-data/user").addresses,
  addOrder: typeof import("@/lib/dummy-data/user").addOrder,
  nextOrderNumber: typeof import("@/lib/dummy-data/user").nextOrderNumber,
  user: typeof import("@/lib/dummy-data/user").user,
  stores: typeof import("@/lib/dummy-data/catalog").stores,
): Response {
  const items = (body.items as Array<{ productId: string; quantity: number; variantId?: string }>) ?? [];
  const shippingAddress = body.shippingAddress as
    | { fullName: string; phone: string; addressLine1: string; city: string; state: string; addressLine2?: string; localGovernment?: string }
    | undefined;
  const addressId = body.addressId as string | undefined;
  const paymentMethod = (body.paymentMethod as string) ?? "CARD";
  const deliveryType = (body.deliveryType as string) ?? "STANDARD";
  const couponCode = body.couponCode as string | undefined;
  // Look up the coupon from the catalog — supports all 8 codes (PERCENT,
  // AMOUNT, and FREE_DELIVERY types).  If the code doesn't match an active
  // coupon, no discount is applied.
  const coupon = couponCode ? catalog.coupons.find((c) => c.code === couponCode.toUpperCase() && c.isActive) : undefined;

  if (!items.length) return err(400, "Cart is empty");

  const addr = addressId ? addresses.find((a) => a.id === addressId) : undefined;
  const deliveryAddress = addr
    ? {
        id: addr.id, label: addr.label, fullName: addr.fullName, phone: addr.phone,
        addressLine1: addr.addressLine1, addressLine2: addr.addressLine2, city: addr.city,
        state: addr.state, localGovernment: addr.localGovernment, isDefault: addr.isDefault, type: addr.type,
      }
    : {
        id: uid("addr"), label: "Checkout",
        fullName: shippingAddress?.fullName ?? `${user.firstName} ${user.lastName}`,
        phone: shippingAddress?.phone ?? user.phone, addressLine1: shippingAddress?.addressLine1 ?? "",
        addressLine2: shippingAddress?.addressLine2, city: shippingAddress?.city ?? "",
        state: shippingAddress?.state ?? "Lagos", localGovernment: shippingAddress?.localGovernment,
        isDefault: false, type: "OTHER" as const,
      };

  // Group items by vendor store → one order per store (split checkout).
  const byStore = new Map<string, typeof items>();
  for (const it of items) {
    const product = products.find((p) => p.id === it.productId || p.slug === it.productId);
    if (!product) continue;
    const list = byStore.get(product.storeId) ?? [];
    list.push(it);
    byStore.set(product.storeId, list);
  }

  const created: ReturnType<typeof addOrder>[] = [];
  for (const [storeId, storeItems] of byStore) {
    const store = stores.find((s) => s.id === storeId);
    const orderItems = storeItems.map((it, idx) => {
      const p = products.find((x) => x.id === it.productId || x.slug === it.productId)!;
      return {
        id: `item-${Date.now()}-${idx}`, productId: p.id,
        product: { id: p.id, name: p.name, slug: p.slug, image: p.images[0]?.url ?? "", price: p.price, storeId: p.storeId, storeName: store?.name ?? "" },
        quantity: it.quantity, unitPrice: p.price, totalPrice: p.price * it.quantity,
        variantId: it.variantId, variantName: p.variants[0]?.name,
      };
    });
    const subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);
    // Compute discount based on coupon type (PERCENT, AMOUNT, or FREE_DELIVERY).
    // Vendor-specific coupons only apply to the matching store's order.
    let discount = 0;
    const couponAppliesToThisStore = !coupon?.storeId || coupon.storeId === storeId;
    if (coupon && couponAppliesToThisStore) {
      if (coupon.discountType === "PERCENT") {
        const raw = Math.round((subtotal * coupon.discountValue) / 100);
        discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
      } else if (coupon.discountType === "AMOUNT") {
        discount = Math.min(coupon.discountValue, subtotal);
      }
      // FREE_DELIVERY: discount stays 0 here; delivery fee is waived below.
    }
    const platformFee = Math.round(subtotal * 0.05);
    const baseDeliveryFee = deliveryFeeByState(deliveryAddress.state);
    // Free-delivery coupons waive the delivery fee — but only for the matching
    // store when the coupon is vendor-specific.
    const isFreeDelivery = coupon?.discountType === "FREE_DELIVERY" && couponAppliesToThisStore;
    const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
    const total = subtotal + deliveryFee - discount + platformFee;
    const orderNumber = nextOrderNumber();
    const now = new Date().toISOString();
    const order = {
      id: uid("order"), orderNumber, buyerId: user.id,
      buyerName: `${user.firstName} ${user.lastName}`, buyerEmail: user.email, buyerPhone: user.phone,
      storeId, storeName: store?.name ?? "Vendor", items: orderItems, subtotal, discount, deliveryFee,
      platformFee, total, status: "PENDING" as const, paymentStatus: "PENDING" as const,
      paymentMethod, paymentReference: uid("ref"), deliveryAddress,
      deliveryType: deliveryType as "STANDARD" | "EXPRESS" | "PICKUP",
      estimatedDeliveryDays: deliveryType === "EXPRESS" ? 1 : 2, couponCode: couponCode ?? undefined,
      createdAt: now, updatedAt: now,
      timeline: [{ status: "PENDING" as const, at: now, note: "Order placed by buyer" }],
    };
    created.push(addOrder(order));
  }

  const reference = uid("ref");
  return ok({
    orders: created,
    order: created[0],
    payment: {
      reference, status: "initialized",
      gateway: paymentMethod === "WALLET" ? "KWIKCOINS" : "PAYSTACK",
      amount: created.reduce((s, o) => s + o.total, 0),
    },
    authorizationUrl: `/checkout/verify?reference=${reference}`,
    reference,
    requiresShipping: true,
  });
}

function deliveryFeeByState(state: string): number {
  const s = (state ?? "").toLowerCase();
  if (s.includes("lagos")) return 1500;
  if (s.includes("abuja")) return 2500;
  if (s.includes("rivers") || s.includes("port")) return 3000;
  if (s.includes("oyo") || s.includes("ibadan")) return 2200;
  if (s.includes("kano")) return 3200;
  return 2000;
}

async function safeJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
