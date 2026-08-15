import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ==================== PUBLIC ENDPOINTS ====================
  //
  // NOTE: route declaration order matters in NestJS. The static two-segment
  // routes (summary/:productId, eligibility/:productId) MUST be declared
  // before the dynamic single-segment :productId route so that requests like
  // /reviews/summary/abc are matched by the static handler and not by
  // :productId (= "summary", then trailing path fails to match).
  // In practice @Get(':productId') only matches a single segment, so two-
  // segment requests would never collide, but we keep the order defensive.

  @Public()
  @Get('summary/:productId')
  @ApiOperation({ summary: 'Get rating summary (average + distribution) for a product' })
  @ApiResponse({ status: 200, description: 'Rating summary returned' })
  async getSummary(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviewSummary(productId);
  }

  @Public()
  @Get(':productId')
  @ApiOperation({ summary: 'List approved reviews for a product' })
  @ApiResponse({ status: 200, description: 'Reviews returned' })
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  @UseGuards(JwtAuthGuard)
  @Get('eligibility/:productId')
  @ApiOperation({ summary: 'Check if the current user can review a product' })
  @ApiResponse({ status: 200, description: 'Eligibility returned' })
  async getEligibility(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.getEligibility(productId, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a purchase-verified product review' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 403, description: 'User has not purchased the product' })
  @ApiResponse({ status: 409, description: 'User has already reviewed this product' })
  async createReview(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a review as helpful (increments helpfulCount)' })
  @ApiResponse({ status: 200, description: 'Helpful vote recorded' })
  async markHelpful(@Param('id') id: string) {
    return this.reviewsService.markHelpful(id);
  }
}
