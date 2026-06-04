import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/services';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderOperationsService {
  private readonly logger = new Logger(OrderOperationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Resolve vendor store from userId
   */
  async getVendorStore(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: userId },
    });
    if (!store) {
      throw new NotFoundException('No store found for this vendor.');
    }
    return store;
  }

  /**
   * Find order and verify it belongs to vendor's store
   */
  async findAndVerifyOrder(orderId: string, storeId: string) {
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

    if (order.storeId !== storeId) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    return order;
  }

  // ─── Status Transition Logic ─────────────────────────────────────────

  private static readonly VALID_TRANSITIONS: Record<string, OrderStatus> = {
    accept: 'CONFIRMED',
    reject: 'CANCELLED',
    prepare: 'PROCESSING',
    ready: 'FULFILLED',
    cancel: 'CANCELLED',
  };

  private static readonly REQUIRED_STATUS: Record<string, OrderStatus[]> = {
    accept: ['PENDING', 'PAID'],
    reject: ['PENDING', 'PAID'],
    prepare: ['CONFIRMED'],
    ready: ['PROCESSING'],
    cancel: ['PENDING', 'CONFIRMED', 'PROCESSING'],
  };

  /**
   * Validate and perform a status transition on an order
   */
  async transitionOrderStatus(
    orderId: string,
    storeId: string,
    action: string,
    userId: string,
    note?: string,
    reason?: string,
  ) {
    const order = await this.findAndVerifyOrder(orderId, storeId);

    const requiredStatuses = OrderOperationsService.REQUIRED_STATUS[action];
    if (!requiredStatuses || !requiredStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot ${action} order in ${order.status} status. ` +
          `Order must be ${requiredStatuses?.join(' or ')}.`,
      );
    }

    const newStatus = OrderOperationsService.VALID_TRANSITIONS[action];
    if (!newStatus) {
      throw new BadRequestException(`Unknown action: ${action}`);
    }

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

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Audit log
    await this.auditService.log({
      userId,
      action: `order.${action}`,
      entity: 'Order',
      entityId: order.id,
      changes: {
        previousStatus: order.status,
        newStatus: updatedOrder.status,
        note: note || undefined,
        reason: reason || undefined,
      },
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

  /**
   * Add an internal note to an order
   */
  async addOrderNote(
    orderId: string,
    storeId: string,
    userId: string,
    content: string,
  ) {
    const order = await this.findAndVerifyOrder(orderId, storeId);

    // Store note via audit log (dedicated notes table can be added later)
    await this.auditService.log({
      userId,
      action: 'order.note.added',
      entity: 'Order',
      entityId: order.id,
      changes: {
        note: content,
        noteType: 'internal',
      },
    });

    return {
      success: true,
      orderId: order.id,
      note: content,
      notedBy: userId,
      notedAt: new Date().toISOString(),
    };
  }
}
