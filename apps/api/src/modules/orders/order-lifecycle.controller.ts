import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderLifecycleService } from './order-lifecycle.service';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class CancelOrderDto {
  reason?: string;
}

class DispatchOrderDto {
  trackingNumber?: string;
  carrier?: string;
}

class CompletePickupDto {
  note?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * OrderLifecycleController
 *
 * Customer + vendor order action endpoints. All routes require JWT auth.
 *
 * Customer routes:
 *   POST /orders/:id/confirm-receipt  — triggers Kwikscrow release → vendor wallet credit
 *   POST /orders/:id/cancel           — pre-payment cancellation
 *
 * Vendor routes:
 *   POST /orders/:id/prepare          — CONFIRMED/PAID → PROCESSING
 *   POST /orders/:id/ready-for-pickup — PROCESSING → FULFILLED (PICKUP orders only)
 *   POST /orders/:id/dispatch         — PROCESSING → SHIPPED (STANDARD_DELIVERY only)
 *   POST /orders/:id/mark-delivered   — SHIPPED → DELIVERED (does NOT release escrow)
 *
 * Note: the old `@Controller('vendor/orders')` controller at `orders.controller.ts`
 * still exists for backward compatibility (accept/reject/prepare/ready/cancel via
 * PATCH verbs). This new controller is the clean, canonical implementation that
 * frontend code should target.
 */
@ApiTags('Order Lifecycle')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderLifecycleController {
  constructor(private readonly lifecycle: OrderLifecycleService) {}

  // ─── Customer Actions ─────────────────────────────────────────────────────

  @Post(':id/confirm-receipt')
  @ApiOperation({
    summary:
      'Customer confirms receipt of order — triggers Kwikscrow release to vendor wallet',
  })
  async confirmReceipt(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.lifecycle.confirmReceipt(user, orderId);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary:
      'Customer cancels order (only allowed before payment — paid orders must use dispute/refund flow)',
  })
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto?: CancelOrderDto,
  ) {
    return this.lifecycle.cancelOrder(user, orderId, dto);
  }

  // ─── Vendor Actions ───────────────────────────────────────────────────────

  @Post(':id/prepare')
  @ApiOperation({ summary: 'Vendor starts preparing order (→ PROCESSING)' })
  async prepareOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.lifecycle.prepareOrder(user, orderId);
  }

  @Post(':id/ready-for-pickup')
  @ApiOperation({
    summary: 'Vendor marks PICKUP order as ready for customer pickup (→ FULFILLED)',
  })
  async readyForPickup(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.lifecycle.readyForPickup(user, orderId);
  }

  @Post(':id/dispatch')
  @ApiOperation({
    summary:
      'Vendor dispatches STANDARD_DELIVERY order (→ SHIPPED, creates Fulfillment with tracking)',
  })
  async dispatchOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto?: DispatchOrderDto,
  ) {
    return this.lifecycle.dispatchOrder(user, orderId, dto);
  }

  @Post(':id/mark-delivered')
  @ApiOperation({
    summary:
      'Vendor marks STANDARD_DELIVERY order as delivered after rider drop-off (→ DELIVERED). Does NOT release escrow — customer confirm-receipt does that.',
  })
  async markDelivered(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.lifecycle.markDelivered(user, orderId);
  }

  @Post(':id/complete-pickup')
  @ApiOperation({
    summary:
      'Vendor confirms an in-store pickup handoff for a PICKUP order and releases Kwikscrow immediately',
  })
  async completePickup(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto?: CompletePickupDto,
  ) {
    return this.lifecycle.completePickup(user, orderId, dto);
  }
}
