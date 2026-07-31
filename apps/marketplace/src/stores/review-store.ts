import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductReview {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
}

interface ReviewState {
  reviews: ProductReview[];
  addReview: (review: Omit<ProductReview, "id" | "date" | "verified">) => void;
  getReviews: (productId: string) => ProductReview[];
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],
      addReview: (review) =>
        set((state) => ({
          reviews: [
            {
              ...review,
              id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              date: new Date().toISOString(),
              verified: true,
            },
            ...state.reviews,
          ],
        })),
      getReviews: (productId) =>
        get().reviews.filter((r) => r.productId === productId),
    }),
    { name: "kwikseller-reviews" },
  ),
);
