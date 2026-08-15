import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto';

/**
 * Shape of a review row as returned to the client.
 *
 * NOTE on `images`: the Prisma `Review.images` column is a JSON-encoded string
 * (schema line ~1804). We parse it into a string[] before returning so the
 * frontend never sees the raw JSON string.
 */
export interface ReviewResponse {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  vendorReply: string | null;
  vendorRepliedAt: Date | null;
  createdAt: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface ReviewSummaryResponse {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewEligibilityResponse {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  reason: string | null;
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Parse the JSON-encoded `images` column on a Review row into a string[].
   * Returns [] if the column is null or unparseable.
   */
  private parseImages(raw: string | null | undefined): string[] {
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch {
      // Not valid JSON — treat as empty.
      return [];
    }
  }

  /**
   * Map a Prisma Review row (with `user.profile` included) to the client shape.
   */
  private mapReview(review: any): ReviewResponse {
    const profile = review.user?.profile;
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      title: review.title ?? null,
      comment: review.comment ?? null,
      images: this.parseImages(review.images),
      isVerifiedPurchase: review.isVerifiedPurchase ?? false,
      helpfulCount: review.helpfulCount ?? 0,
      vendorReply: review.vendorReply ?? null,
      vendorRepliedAt: review.vendorRepliedAt ?? null,
      createdAt: review.createdAt,
      user: profile
        ? {
            firstName: profile.firstName ?? null,
            lastName: profile.lastName ?? null,
            avatarUrl: profile.avatarUrl ?? null,
          }
        : null,
    };
  }

  /**
   * The Prisma include used when fetching reviews for display.
   */
  private readonly reviewInclude = {
    user: {
      select: {
        id: true,
        profile: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
    },
  };

  // ---------------------------------------------------------------------------
  // Public queries
  // ---------------------------------------------------------------------------

  /**
   * GET /reviews/:productId
   * Returns all approved reviews for a product, ordered by helpfulness then recency.
   */
  async getProductReviews(productId: string): Promise<ReviewResponse[]> {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: this.reviewInclude,
      orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
    });

    return reviews.map((r) => this.mapReview(r));
  }

  /**
   * GET /reviews/summary/:productId
   * Returns the average rating, total count, and per-star distribution.
   */
  async getProductReviewSummary(productId: string): Promise<ReviewSummaryResponse> {
    // Aggregate average + total in a single query.
    const aggregate = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const total = aggregate._count.rating;
    const average = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : 0;

    // Group by rating for the distribution. 5..1 keys.
    const grouped = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId, isApproved: true },
      _count: { rating: true },
    });

    const distribution: ReviewSummaryResponse['distribution'] = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    for (const row of grouped) {
      const star = row.rating;
      if (star >= 1 && star <= 5) {
        distribution[star as 1 | 2 | 3 | 4 | 5] = row._count.rating;
      }
    }

    return { average, total, distribution };
  }

  /**
   * GET /reviews/eligibility/:productId
   * Check if the current user can review a product (purchase-verified).
   */
  async getEligibility(productId: string, userId: string): Promise<ReviewEligibilityResponse> {
    // Run purchase + review checks in parallel.
    const [hasPurchased, hasReviewed] = await Promise.all([
      this.userHasPurchasedProduct(userId, productId),
      this.userHasReviewedProduct(userId, productId),
    ]);

    let reason: string | null = null;
    if (!hasPurchased) {
      reason = 'NOT_PURCHASED';
    } else if (hasReviewed) {
      reason = 'ALREADY_REVIEWED';
    }

    return {
      canReview: hasPurchased && !hasReviewed,
      hasPurchased,
      hasReviewed,
      reason,
    };
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * POST /reviews
   * Create a purchase-verified review. Auto-approved for now.
   */
  async createReview(userId: string, dto: CreateReviewDto): Promise<ReviewResponse> {
    // 1. Verify the product exists and is active.
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found`);
    }

    // 2. Backend purchase verification — the user must have a delivered order
    //    containing this product.
    const hasPurchased = await this.userHasPurchasedProduct(userId, dto.productId);
    if (!hasPurchased) {
      throw new ForbiddenException(
        'You can only review products you have purchased and received',
      );
    }

    // 3. Hasn't already reviewed this product.
    const hasReviewed = await this.userHasReviewedProduct(userId, dto.productId);
    if (hasReviewed) {
      throw new ConflictException('You have already reviewed this product');
    }

    // 4. Optionally verify the orderId (if provided) belongs to the user + product.
    let verifiedOrderId: string | undefined = undefined;
    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: dto.orderId,
          buyerId: userId,
          status: 'DELIVERED',
          items: { some: { productId: dto.productId } },
        },
        select: { id: true },
      });
      if (order) {
        verifiedOrderId = order.id;
      }
    }

    // 5. Create the review.
    const review = await this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        orderId: verifiedOrderId ?? null,
        rating: dto.rating,
        title: dto.title ?? null,
        comment: dto.comment,
        images: dto.images && dto.images.length > 0 ? JSON.stringify(dto.images) : null,
        isVerifiedPurchase: true,
        isApproved: true, // auto-approve for now
        helpfulCount: 0,
      },
      include: this.reviewInclude,
    });

    // 6. Recompute the parent product's rating + reviewCount.
    await this.refreshProductRating(dto.productId);

    this.logger.log(
      `Review created: productId=${dto.productId} userId=${userId} rating=${dto.rating}`,
    );

    return this.mapReview(review);
  }

  /**
   * POST /reviews/:id/helpful
   * Increment the helpfulCount for a review.
   */
  async markHelpful(reviewId: string): Promise<{ success: true }> {
    // Use updateMany so we silently no-op (rather than throwing) if the review
    // doesn't exist or isn't approved — helpful-vote endpoints should be idempotent.
    await this.prisma.review.updateMany({
      where: { id: reviewId, isApproved: true },
      data: { helpfulCount: { increment: 1 } },
    });

    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * True if the user has any DELIVERED order containing this product as an
   * OrderItem.
   *
   * NOTE: the OrderStatus enum in this schema has DELIVERED but not COMPLETED
   * (see prisma/schema.prisma ~line 1094). We use DELIVERED as the "received"
   * trigger.
   */
  private async userHasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: {
        buyerId: userId,
        status: 'DELIVERED',
        items: { some: { productId } },
      },
    });
    return count > 0;
  }

  /**
   * True if the user already has any Review (approved or not) for this product.
   */
  private async userHasReviewedProduct(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.review.count({
      where: { userId, productId },
    });
    return count > 0;
  }

  /**
   * Recompute the Product.rating + Product.reviewCount fields from all approved
   * reviews. Called after a review is created (or in future: updated/deleted).
   */
  private async refreshProductRating(productId: string): Promise<void> {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const reviewCount = aggregate._count.rating;
    const rating = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : 0;

    await this.prisma.product.update({
      where: { id: productId },
      data: { rating, reviewCount },
    });
  }
}
