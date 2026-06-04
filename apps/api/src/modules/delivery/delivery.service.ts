import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryStatus, EscrowStatus } from '@prisma/client';

// ─── Valid State Transitions ───────────────────────────────────────────────────

const VENDOR_TRANSITIONS: Record<string, { from: DeliveryStatus[]; to: DeliveryStatus }> = {
  preparing: { from: [DeliveryStatus.ACCEPTED], to: DeliveryStatus.PREPARING },
  ready: { from: [DeliveryStatus.PREPARING], to: DeliveryStatus.READY_FOR_PICKUP },
  pickupConfirm: { from: [DeliveryStatus.READY_FOR_PICKUP], to: DeliveryStatus.PICKED_UP },
};

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Vendor Methods ─────────────────────────────────────────────────────────

  /**
   * List vendor's deliveries with optional filters
   */
  async findVendorDeliveries(vendorId: string, filters?: { status?: DeliveryStatus; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    if (!store) {
      throw new NotFoundException('No store found for this vendor.');
    }

    const where: Record<string, unknown> = {
      order: { storeId: store.id },
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
            },
          },
          rider: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      data: deliveries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get full tracking info for a vendor's delivery
   */
  async getDeliveryTracking(deliveryId: string, vendorId: string) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    if (!store) {
      throw new NotFoundException('No store found for this vendor.');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            storeId: true,
            buyer: {
              select: {
                id: true,
                email: true,
                phone: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
        rider: {
          select: {
            id: true,
            phone: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found.`);
    }

    if (delivery.order.storeId !== store.id) {
      throw new NotFoundException(`Delivery ${deliveryId} not found.`);
    }

    // Build tracking timeline
    const timeline: Array<{ event: string; at: string; label: string }> = [];
    if (delivery.createdAt) {
      timeline.push({ event: 'CREATED', at: delivery.createdAt.toISOString(), label: 'Delivery created' });
    }
    if (delivery.assignedAt) {
      timeline.push({ event: 'ASSIGNED', at: delivery.assignedAt.toISOString(), label: 'Rider assigned' });
    }
    if (delivery.acceptedAt) {
      timeline.push({ event: 'ACCEPTED', at: delivery.acceptedAt.toISOString(), label: 'Rider accepted delivery' });
    }
    if (delivery.vendorPreparingAt) {
      timeline.push({ event: 'PREPARING', at: delivery.vendorPreparingAt.toISOString(), label: 'Vendor started preparing' });
    }
    if (delivery.vendorReadyAt) {
      timeline.push({ event: 'READY_FOR_PICKUP', at: delivery.vendorReadyAt.toISOString(), label: 'Order ready for pickup' });
    }
    if (delivery.pickupConfirmedAt) {
      timeline.push({ event: 'PICKED_UP', at: delivery.pickupConfirmedAt.toISOString(), label: 'Package picked up' });
    }
    if (delivery.inTransitAt) {
      timeline.push({ event: 'IN_TRANSIT', at: delivery.inTransitAt.toISOString(), label: 'Rider in transit' });
    }
    if (delivery.arrivedAt) {
      timeline.push({ event: 'ARRIVED', at: delivery.arrivedAt.toISOString(), label: 'Rider arrived at destination' });
    }
    if (delivery.deliveredAt) {
      timeline.push({ event: 'DELIVERED', at: delivery.deliveredAt.toISOString(), label: 'Delivery completed' });
    }

    return {
      ...delivery,
      timeline,
    };
  }

  /**
   * Mark delivery as preparing (ACCEPTED → PREPARING)
   */
  async markPreparing(deliveryId: string, vendorId: string) {
    return this.transitionDeliveryStatus(deliveryId, vendorId, 'preparing');
  }

  /**
   * Mark delivery as ready for pickup (PREPARING → READY_FOR_PICKUP)
   */
  async markReady(deliveryId: string, vendorId: string) {
    return this.transitionDeliveryStatus(deliveryId, vendorId, 'ready');
  }

  /**
   * Vendor confirms pickup handoff (READY_FOR_PICKUP → PICKED_UP)
   */
  async confirmPickup(deliveryId: string, vendorId: string) {
    return this.transitionDeliveryStatus(deliveryId, vendorId, 'pickupConfirm');
  }

  /**
   * Get vendor's escrow holdings
   */
  async getEscrowHoldings(vendorId: string) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    if (!store) {
      throw new NotFoundException('No store found for this vendor.');
    }

    const escrows = await this.prisma.escrow.findMany({
      where: {
        vendorId,
        status: { in: [EscrowStatus.HELD, EscrowStatus.PENDING_RELEASE, EscrowStatus.DISPUTED] },
      },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            delivery: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const wallet = await this.prisma.wallet.findUnique({
      where: { vendorId },
    });

    const totalHeld = escrows
      .filter((e) => e.status === EscrowStatus.HELD)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalPending = escrows
      .filter((e) => e.status === EscrowStatus.PENDING_RELEASE)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      escrows,
      summary: {
        totalHeld,
        totalPendingRelease: totalPending,
        availableBalance: wallet?.availableBalance ?? 0,
        pendingBalance: wallet?.pendingBalance ?? 0,
      },
    };
  }

  // ─── Admin Methods ─────────────────────────────────────────────────────────

  /**
   * Assign rider to order (creates Delivery record)
   */
  async assignRider(orderId: string, riderId: string, adminId: string, estimatedMinutes?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        escrow: true,
        buyer: {
          select: {
            id: true,
            phone: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        address: {
          include: {
            state: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    // Check if delivery already exists for this order
    const existingDelivery = await this.prisma.delivery.findUnique({
      where: { orderId },
    });

    if (existingDelivery) {
      throw new BadRequestException(`Delivery already exists for order ${orderId}. Use reassign instead.`);
    }

    // Verify rider exists
    const rider = await this.prisma.user.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${riderId} not found.`);
    }

    // Build address strings from the order's address
    const addrParts = order.address
      ? [order.address.line1, order.address.line2, order.address.city, order.address.state?.name].filter(Boolean)
      : [];
    const fullAddress = addrParts.length > 0 ? addrParts.join(', ') : 'Address not provided';

    // Create delivery record
    const delivery = await this.prisma.delivery.create({
      data: {
        orderId,
        status: DeliveryStatus.ASSIGNED,
        riderId,
        assignedAt: new Date(),
        assignedBy: adminId,
        estimatedMinutes: estimatedMinutes ?? 60,
        pickupAddress: 'Store address',
        deliveryAddress: fullAddress,
        deliveryContactName: order.buyer
          ? `${order.buyer.profile?.firstName || ''} ${order.buyer.profile?.lastName || ''}`.trim()
          : undefined,
        deliveryContactPhone: order.buyer?.phone,
      },
      include: {
        order: {
          select: { id: true },
        },
        rider: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return {
      success: true,
      delivery,
    };
  }

  /**
   * List all deliveries (admin)
   */
  async listAllDeliveries(filters?: { status?: DeliveryStatus; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              store: {
                select: { id: true, name: true },
              },
            },
          },
          rider: {
            select: {
              id: true,
              phone: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      data: deliveries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Reassign rider to a delivery
   */
  async reassignRider(deliveryId: string, newRiderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found.`);
    }

    const rider = await this.prisma.user.findUnique({
      where: { id: newRiderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${newRiderId} not found.`);
    }

    // Allow reassignment from any active state
    const activeStates: DeliveryStatus[] = [
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.ACCEPTED,
      DeliveryStatus.PREPARING,
      DeliveryStatus.READY_FOR_PICKUP,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.ARRIVED,
    ];

    if (!activeStates.includes(delivery.status)) {
      throw new BadRequestException(
        `Cannot reassign delivery in ${delivery.status} status.`,
      );
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        riderId: newRiderId,
        assignedAt: new Date(),
        status: DeliveryStatus.ASSIGNED,
      },
      include: {
        order: {
          select: { id: true },
        },
        rider: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return {
      success: true,
      previousRiderId: delivery.riderId,
      delivery: updated,
    };
  }

  /**
   * Manual escrow release (admin)
   */
  async manualEscrowRelease(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found.`);
    }

    const escrow = await this.prisma.escrow.findUnique({
      where: { orderId: delivery.orderId },
    });

    if (!escrow) {
      throw new NotFoundException(`No escrow found for delivery ${deliveryId}.`);
    }

    if (escrow.status === EscrowStatus.RELEASED) {
      throw new BadRequestException('Escrow has already been released.');
    }

    if (escrow.status === EscrowStatus.REFUNDED) {
      throw new BadRequestException('Escrow has already been refunded. Cannot release.');
    }

    // Release escrow and credit vendor wallet in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update escrow
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      // Credit vendor wallet
      const wallet = await tx.wallet.upsert({
        where: { vendorId: escrow.vendorId },
        create: {
          vendorId: escrow.vendorId,
          availableBalance: escrow.amount,
          totalEarned: escrow.amount,
        },
        update: {
          availableBalance: { increment: escrow.amount },
          totalEarned: { increment: escrow.amount },
        },
      });

      // Update delivery status
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.COMPLETED,
        },
      });

      return { escrow: updatedEscrow, wallet };
    });

    return {
      success: true,
      escrow: result.escrow,
      wallet: result.wallet,
    };
  }

  /**
   * Refund escrow to customer (admin)
   */
  async refundEscrow(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found.`);
    }

    const escrow = await this.prisma.escrow.findUnique({
      where: { orderId: delivery.orderId },
    });

    if (!escrow) {
      throw new NotFoundException(`No escrow found for delivery ${deliveryId}.`);
    }

    if (escrow.status === EscrowStatus.RELEASED) {
      throw new BadRequestException('Escrow has already been released. Cannot refund.');
    }

    if (escrow.status === EscrowStatus.REFUNDED) {
      throw new BadRequestException('Escrow has already been refunded.');
    }

    const updatedEscrow = await this.prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        status: EscrowStatus.REFUNDED,
        releasedAt: new Date(),
      },
    });

    // Update delivery status to cancelled
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.CANCELLED,
      },
    });

    return {
      success: true,
      escrow: updatedEscrow,
      note: `Escrow of ${escrow.amount} has been refunded. Payment gateway refund should be processed separately.`,
    };
  }

  /**
   * Cron: Auto-release escrows where releaseAt <= now() and status is PENDING_RELEASE
   */
  async processEscrowAutoRelease() {
    const pendingReleases = await this.prisma.escrow.findMany({
      where: {
        status: EscrowStatus.PENDING_RELEASE,
        releaseAt: { lte: new Date() },
      },
    });

    let released = 0;
    let errors = 0;

    for (const escrow of pendingReleases) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: {
              status: EscrowStatus.RELEASED,
              releasedAt: new Date(),
            },
          });

          await tx.wallet.upsert({
            where: { vendorId: escrow.vendorId },
            create: {
              vendorId: escrow.vendorId,
              availableBalance: escrow.amount,
              totalEarned: escrow.amount,
            },
            update: {
              availableBalance: { increment: escrow.amount },
              totalEarned: { increment: escrow.amount },
            },
          });
        });

        // Find associated delivery and mark as completed
        const delivery = await this.prisma.delivery.findUnique({
          where: { orderId: escrow.orderId },
        });

        if (delivery && delivery.status !== DeliveryStatus.CANCELLED) {
          await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: { status: DeliveryStatus.COMPLETED },
          });
        }

        released++;
      } catch (err) {
        errors++;
        console.error(`Failed to auto-release escrow ${escrow.id}:`, err);
      }
    }

    return {
      processed: pendingReleases.length,
      released,
      errors,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Transition delivery status with vendor ownership check
   */
  private async transitionDeliveryStatus(deliveryId: string, vendorId: string, action: string) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    if (!store) {
      throw new NotFoundException('No store found for this vendor.');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          select: { id: true, storeId: true },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found.`);
    }

    if (delivery.order.storeId !== store.id) {
      throw new NotFoundException(`Delivery ${deliveryId} not found.`);
    }

    const transition = VENDOR_TRANSITIONS[action];
    if (!transition) {
      throw new BadRequestException(`Unknown transition action: ${action}.`);
    }

    if (!transition.from.includes(delivery.status)) {
      throw new BadRequestException(
        `Cannot transition to ${transition.to} from current status ${delivery.status}. Must be one of: ${transition.from.join(', ')}.`,
      );
    }

    const updateData: Record<string, unknown> = {
      status: transition.to,
    };

    // Set appropriate timestamp
    if (action === 'preparing') {
      updateData.vendorPreparingAt = new Date();
    } else if (action === 'ready') {
      updateData.vendorReadyAt = new Date();
    } else if (action === 'pickupConfirm') {
      updateData.pickupConfirmedAt = new Date();
      updateData.pickupConfirmedBy = vendorId;
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    return {
      success: true,
      deliveryId: updated.id,
      previousStatus: delivery.status,
      newStatus: updated.status,
    };
  }
}
