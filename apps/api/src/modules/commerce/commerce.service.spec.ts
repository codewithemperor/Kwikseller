import { CommerceService } from './commerce.service';

describe('CommerceService split checkout helpers', () => {
  let service: CommerceService;

  beforeEach(() => {
    service = new CommerceService({} as any, {} as any, {} as any);
  });

  it('groups cart lines by vendor store and keeps fulfillment flags', () => {
    const groups = [
      ...((service as any).groupCartItemsByStore([
        {
          id: 'cart-1',
          productId: 'prod-a',
          productType: 'PHYSICAL',
          productSource: 'VENDOR_STOCK',
          requiresShipping: true,
          quantity: 2,
          price: 1000,
          product: {
            storeId: 'store-a',
            store: { name: 'Vendor A', slug: 'vendor-a' },
          },
        },
        {
          id: 'cart-2',
          productId: 'prod-b',
          productType: 'DIGITAL',
          productSource: 'VENDOR_STOCK',
          requiresShipping: false,
          quantity: 1,
          price: 500,
          product: {
            storeId: 'store-a',
            store: { name: 'Vendor A', slug: 'vendor-a' },
          },
        },
        {
          id: 'cart-3',
          productId: 'prod-c',
          productType: 'PHYSICAL',
          productSource: 'POOL_RESALE',
          poolOfferId: 'offer-c',
          requiresShipping: true,
          quantity: 1,
          price: 2500,
          product: {
            storeId: 'store-b',
            store: { name: 'Vendor B', slug: 'vendor-b' },
          },
        },
      ]) as Map<string, any>).values(),
    ];

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      storeId: 'store-a',
      storeName: 'Vendor A',
      storeSlug: 'vendor-a',
      subtotal: 2500,
      requiresShipping: true,
      hasDigitalDelivery: true,
    });
    expect(groups[1]).toMatchObject({
      storeId: 'store-b',
      storeName: 'Vendor B',
      subtotal: 2500,
      requiresShipping: true,
    });
  });

  it('allocates cart-level coupon discounts proportionally and preserves cents', () => {
    const allocations = (service as any).allocateDiscount(333.33, [
      { storeId: 'store-a', subtotal: 1000 },
      { storeId: 'store-b', subtotal: 2000 },
    ]) as Map<string, number>;

    const total = [...allocations.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(333.33, 2);
    expect(allocations.get('store-a')).toBeCloseTo(111.11, 2);
    expect(allocations.get('store-b')).toBeCloseTo(222.22, 2);
  });

  it('normalizes storefront design config safely', () => {
    const normalized = (service as any).normalizeStorefrontDesign({
      themePreset: 'FRESH',
      primaryColor: '#064E3B',
      accentColor: '#14B8A6',
      sections: 'not-json',
    });

    expect(normalized).toMatchObject({
      themePreset: 'CLASSIC',
      navbarTemplate: 'NAVBAR_CLASSIC',
      bottomNavTemplate: 'BOTTOM_TABS_CLASSIC',
      layoutTemplate: 'GRID_COMMERCE',
      cartTemplate: 'CART_COMPACT',
      typographyPreset: 'FIGTREE_QUESTRIAL',
      primaryColor: '#064E3B',
      accentColor: '#14B8A6',
      sections: ['hero', 'products', 'pool', 'policies'],
    });
  });
});
