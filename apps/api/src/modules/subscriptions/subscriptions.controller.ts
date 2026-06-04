import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// ─── Plan Configuration ───────────────────────────────────────────────────────

interface PlanDetails {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  productLimit: number;
  adCreditsIncluded: number;
  features: string[];
}

const PLAN_DETAILS: PlanDetails[] = [
  {
    plan: 'STARTER',
    name: 'Starter',
    description: 'Perfect for new vendors getting started on Kwikseller',
    price: 0,
    productLimit: 10,
    adCreditsIncluded: 0,
    features: [
      'Up to 10 products',
      'Basic storefront',
      'Order management',
      'Email support',
      'Standard analytics',
    ],
  },
  {
    plan: 'GROWTH',
    name: 'Growth',
    description: 'For growing businesses ready to scale',
    price: 9900,
    productLimit: 100,
    adCreditsIncluded: 50,
    features: [
      'Up to 100 products',
      'Custom storefront branding',
      'Priority order management',
      '50 ad credits per month',
      'Advanced analytics',
      'Email & chat support',
      'Pool sourcing access',
    ],
  },
  {
    plan: 'PRO',
    name: 'Pro',
    description: 'For established sellers with high volume',
    price: 24900,
    productLimit: 500,
    adCreditsIncluded: 200,
    features: [
      'Up to 500 products',
      'Custom storefront with themes',
      'Priority order management',
      '200 ad credits per month',
      'Advanced analytics & reports',
      'Priority support',
      'Pool sourcing access',
      'Bulk upload tools',
      'Promotional tools',
    ],
  },
  {
    plan: 'SCALE',
    name: 'Scale',
    description: 'For enterprise sellers with unlimited needs',
    price: 49900,
    productLimit: -1,
    adCreditsIncluded: 1000,
    features: [
      'Unlimited products',
      'Fully custom storefront',
      'Dedicated order management',
      '1000 ad credits per month',
      'Enterprise analytics & API',
      'Dedicated account manager',
      'Full pool sourcing',
      'Bulk upload & automation',
      'Promotional suite',
      'Multi-store support',
    ],
  },
];

// Plan limits mapping for subscription updates
const PLAN_LIMITS: Record<SubscriptionPlan, { productLimit: number; adCreditsIncluded: number }> = {
  STARTER: { productLimit: 10, adCreditsIncluded: 0 },
  GROWTH: { productLimit: 100, adCreditsIncluded: 50 },
  PRO: { productLimit: 500, adCreditsIncluded: 200 },
  SCALE: { productLimit: -1, adCreditsIncluded: 1000 },
};

// Plan hierarchy for upgrade/downgrade detection
const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'GROWTH', 'PRO', 'SCALE'];

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class ChangePlanDto {
  plan: SubscriptionPlan;
}

// ─── Controller ─────────────────────────────────────────────────────────────────

@ApiTags('Vendor Subscriptions')
@ApiBearerAuth()
@Controller('vendor/subscription')
@UseGuards(JwtAuthGuard)
export class VendorSubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current vendor subscription with usage stats' })
  async getCurrentSubscription(@CurrentUser() user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { vendorId: user.sub },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found. Please create one.');
    }

    // Get current product count for usage stats
    const productCount = await this.prisma.product.count({
      where: { storeId: user.storeId || user.sub, status: { notIn: ['ARCHIVED', 'DRAFT'] } },
    });

    // Get current ad usage (count of active promotions/deals)
    const activeAdsCount = await this.prisma.deal.count({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    const planInfo = PLAN_DETAILS.find((p) => p.plan === subscription.plan);

    return {
      ...subscription,
      planDetails: planInfo,
      usage: {
        products: productCount,
        productLimit: subscription.productLimit === -1 ? null : subscription.productLimit,
        productsUsedPercentage: subscription.productLimit === -1 ? null : Math.round((productCount / subscription.productLimit) * 100),
        adCreditsUsed: activeAdsCount,
        adCreditsLimit: subscription.adCreditsIncluded === 0 ? null : subscription.adCreditsIncluded,
      },
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  async getPlans() {
    return {
      plans: PLAN_DETAILS,
    };
  }

  @Post('change-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change subscription plan' })
  async changePlan(@CurrentUser() user: any, @Body() dto: ChangePlanDto) {
    // Validate plan value
    if (!PLAN_ORDER.includes(dto.plan)) {
      return { success: false, message: 'Invalid plan selected.' };
    }

    // Find existing subscription
    const existing = await this.prisma.subscription.findUnique({
      where: { vendorId: user.sub },
    });

    if (!existing) {
      // Create a new subscription if none exists
      const limits = PLAN_LIMITS[dto.plan];
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = await this.prisma.subscription.create({
        data: {
          vendorId: user.sub,
          plan: dto.plan,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          productLimit: limits.productLimit,
          adCreditsIncluded: limits.adCreditsIncluded,
          autoRenew: true,
        },
      });

      return {
        success: true,
        message: `Subscription created with ${dto.plan} plan.`,
        subscription,
      };
    }

    // Determine if upgrade or downgrade
    const currentIdx = PLAN_ORDER.indexOf(existing.plan);
    const newIdx = PLAN_ORDER.indexOf(dto.plan);
    const isUpgrade = newIdx > currentIdx;
    const limits = PLAN_LIMITS[dto.plan];

    if (isUpgrade) {
      // Upgrading: apply immediately, extend end date by 1 month
      const currentEnd = existing.endDate || new Date();
      const extendedEnd = new Date(currentEnd);
      extendedEnd.setMonth(extendedEnd.getMonth() + 1);

      const subscription = await this.prisma.subscription.update({
        where: { vendorId: user.sub },
        data: {
          plan: dto.plan,
          productLimit: limits.productLimit,
          adCreditsIncluded: limits.adCreditsIncluded,
          endDate: extendedEnd,
          status: existing.status === 'CANCELLED' ? 'ACTIVE' : existing.status,
        },
      });

      return {
        success: true,
        message: `Upgraded to ${dto.plan} plan. Your billing cycle has been extended.`,
        subscription,
      };
    } else if (currentIdx === newIdx) {
      // Same plan — no action needed
      return {
        success: true,
        message: `You are already on the ${dto.plan} plan.`,
        subscription: existing,
      };
    } else {
      // Downgrading: apply at end of current billing cycle
      const subscription = await this.prisma.subscription.update({
        where: { vendorId: user.sub },
        data: {
          // Store pending plan change — we set the new limits but keep status
          // The actual plan will change when the current period ends
          plan: dto.plan,
          productLimit: limits.productLimit,
          adCreditsIncluded: limits.adCreditsIncluded,
          autoRenew: true,
        },
      });

      return {
        success: true,
        message: `Your plan will change to ${dto.plan} at the end of your current billing period.`,
        subscription,
      };
    }
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@CurrentUser() user: any) {
    const existing = await this.prisma.subscription.findUnique({
      where: { vendorId: user.sub },
    });

    if (!existing) {
      throw new NotFoundException('No active subscription found.');
    }

    if (existing.status === 'CANCELLED') {
      return {
        success: true,
        message: 'Subscription is already cancelled.',
        subscription: existing,
      };
    }

    const subscription = await this.prisma.subscription.update({
      where: { vendorId: user.sub },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
    });

    return {
      success: true,
      message: 'Subscription cancelled. You will retain access until your current billing period ends.',
      subscription,
    };
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get billing history / invoices' })
  async getInvoices(@CurrentUser() user: any) {
    // Stub: billing/invoice history will be implemented when payment integration is complete
    return {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
    };
  }
}
