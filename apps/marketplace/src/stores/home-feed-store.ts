import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MarketplaceProduct } from "@/data/marketplace-home";

interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
  badge: string;
}

interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  itemCount: number;
}

interface HomeBrand {
  id: string;
  name: string;
  image: string | null;
  productCount: number;
}

export interface HomeFeedResponse {
  heroBanners: HomeBanner[];
  categories: HomeCategory[];
  brands: HomeBrand[];
  featuredProducts: MarketplaceProduct[];
  dealProducts: MarketplaceProduct[];
  trendingProducts: MarketplaceProduct[];
}

export interface PoolOffer {
  id: string;
  retailPrice: number;
  markup?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    images?: Array<{ url: string; isMain?: boolean }>;
    category?: { name: string };
  };
  poolProduct?: {
    name: string;
    description?: string;
    suggestedRetailPrice?: number;
    images?: string;
  };
  store?: { name: string };
}

export interface PoolCampaign {
  id: string;
  title: string;
  targetQuantity: number;
  committedQuantity: number;
  unitPrice: number;
  status: string;
  poolProduct?: { name: string };
}

interface HomeFeedStore {
  feed: HomeFeedResponse | null;
  poolOffers: PoolOffer[];
  campaigns: PoolCampaign[];
  fetchedAt: number;
  setHomeFeed: (payload: {
    feed: HomeFeedResponse;
    poolOffers: PoolOffer[];
    campaigns: PoolCampaign[];
    fetchedAt?: number;
  }) => void;
  isFresh: (ttlMs?: number) => boolean;
}

export const HOME_FEED_TTL_MS = 60 * 60 * 1000;

export const useHomeFeedStore = create<HomeFeedStore>()(
  persist(
    (set, get) => ({
      feed: null,
      poolOffers: [],
      campaigns: [],
      fetchedAt: 0,
      setHomeFeed: ({ feed, poolOffers, campaigns, fetchedAt }) =>
        set({
          feed,
          poolOffers,
          campaigns,
          fetchedAt: fetchedAt ?? Date.now(),
        }),
      isFresh: (ttlMs = HOME_FEED_TTL_MS) => {
        const { feed, fetchedAt } = get();
        return Boolean(feed && fetchedAt && Date.now() - fetchedAt < ttlMs);
      },
    }),
    {
      name: "kwikseller-home-feed-cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        feed: state.feed,
        poolOffers: state.poolOffers,
        campaigns: state.campaigns,
        fetchedAt: state.fetchedAt,
      }),
    },
  ),
);
