import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderStatus } from '@prisma/client';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class RejectOrderDto {
  reason: string;
}

class CancelOrderDto {
  reason: string;
}

class AcceptOrderDto {
  note?: string;
}

// ─── Status Transition Map ────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, OrderStatus> = {
  accept: 'CONFIRMED',
  reject: 'CANCELLED',
  prepare: 'PROCESSING',
  ready: 'FULFILLED',
  cancel: 'CANCELLED',
};

const REQUIRED_CURRENT_STATUS: Record<string, OrderStatus[]> = {
  accept: ['PENDING', 'PAID'],
  reject: ['PENDING', 'PAID'],
  prepare: ['CONFIRMED'],
  ready: ['PROCESSING'],
  cancel: ['PENDING', 'CONFIRMED', 'PROCESSING'],
};

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Vendor Orders')
@ApiBearerAuth()
@Controller('vendor/orders')
@UseGuards(JwtAuthGuard)
export class VendorOrdersController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: find order and verify it belongs to vendor's store
   */
  private async findAndVerifyOrder(orderId: string, userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: userId },
    });

    if (!store) {
      throw new NotFoundException('No store found for this vendor.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { select: { url: true }, take: 1 },
              },
            },
          },
        },
        payment: true,
        escrow: true,
        fulfillments: true,
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    if (order.storeId !== store.id) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    return { order, store };
  }

  /**
   * Helper: validate and perform status transition
   */
  private async transitionStatus(
    orderId: string,
    action: string,
    userId: string,
    note?: string,
    reason?: string,
  ) {
    const { order } = await this.findAndVerifyOrder(orderId, userId);

    const requiredStatuses = REQUIRED_CURRENT_STATUS[action];
    if (!requiredStatuses || !requiredStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot ${action} order in ${order.status} status. Order must be ${requiredStatuses?.join(' or ')}.`,
      );
    }

    const newStatus = VALID_TRANSITIONS[action];

    // Build update data
    const updateData: Record<string, any> = {
      status: newStatus,
    };

    // Create fulfillment for 'ready' action
    if (action === 'ready') {
      await this.prisma.fulfillment.create({
        data: {
          orderId: order.id,
          type: 'PHYSICAL_MANUAL',
          status: 'READY',
        },
      });
    }

    // Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return {
      success: true,
      orderId: order.id,
      previousStatus: order.status,
      newStatus: updatedOrder.status,
      ...(note && { note }),
      ...(reason && { reason }),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full order detail' })
  async getOrderDetail(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    const { order } = await this.findAndVerifyOrder(orderId, user.sub);
    return order;
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept an order (PENDING/PAID → CONFIRMED)' })
  async acceptOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto?: AcceptOrderDto,
  ) {
    return this.transitionStatus(orderId, 'accept', user.sub, dto?.note);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an order (PENDING/PAID → CANCELLED)' })
  async rejectOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: RejectOrderDto,
  ) {
    if (!dto.reason) {
      throw new BadRequestException('Rejection reason is required.');
    }
    return this.transitionStatus(orderId, 'reject', user.sub, undefined, dto.reason);
  }

  @Patch(':id/prepare')
  @ApiOperation({ summary: 'Start preparing order (CONFIRMED → PROCESSING)' })
  async prepareOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.transitionStatus(orderId, 'prepare', user.sub);
  }

  @Patch(':id/ready')
  @ApiOperation({ summary: 'Mark order as ready for pickup (PROCESSING → FULFILLED)' })
  async readyOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.transitionStatus(orderId, 'ready', user.sub);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (PENDING/CONFIRMED/PROCESSING → CANCELLED)' })
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
  ) {
    if (!dto.reason) {
      throw new BadRequestException('Cancellation reason is required.');
    }
    return this.transitionStatus(orderId, 'cancel', user.sub, undefined, dto.reason);
  }
}
