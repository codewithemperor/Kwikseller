import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush, { PushSubscription, WebPushError } from 'web-push';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: {
    url?: string;
    orderId?: string;
    type?: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;

  // Push notification event types
  static readonly EVENTS = {
    ORDER_RECEIVED: 'ORDER_RECEIVED',
    ORDER_STATUS_UPDATE: 'ORDER_STATUS_UPDATE',
    NEW_DELIVERY: 'NEW_DELIVERY',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    LOW_STOCK: 'LOW_STOCK',
    FLASH_DEAL: 'FLASH_DEAL',
    SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
    MILESTONE_EARNED: 'MILESTONE_EARNED',
  } as const;

  constructor(private readonly configService: ConfigService) {
    this.vapidPublicKey = this.configService.get<string>(
      'VAPID_PUBLIC_KEY',
      '',
    );
    this.vapidPrivateKey = this.configService.get<string>(
      'VAPID_PRIVATE_KEY',
      '',
    );

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      this.configService.get<string>('VAPID_EMAIL', 'support@kwikseller.com'),
      this.vapidPublicKey,
      this.vapidPrivateKey,
    );

    this.logger.log('PushService initialized with VAPID keys');
  }

  /**
   * Get VAPID public key for frontend
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Send a push notification to a specific subscription
   */
  async sendPush(
    subscription: PushSubscriptionData,
    payload: PushPayload,
  ): Promise<boolean> {
    try {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        {
          TTL: 86400, // 24 hours
          urgency: 'high',
          topic: payload.data?.type || 'general',
        },
      );

      this.logger.debug(`Push notification sent: ${payload.title}`);
      return true;
    } catch (error) {
      if (error instanceof WebPushError) {
        // Handle expired or invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          this.logger.warn(
            `Push subscription expired: ${subscription.endpoint}`,
          );
          return false;
        }
      }
      this.logger.error('Push notification failed:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple subscriptions
   */
  async sendPushToMany(
    subscriptions: PushSubscriptionData[],
    payload: PushPayload,
  ): Promise<{ sent: number; failed: number }> {
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendPush(sub, payload)),
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;
    const failed = results.length - sent;

    this.logger.log(`Push sent: ${sent}, failed: ${failed}`);
    return { sent, failed };
  }

  /**
   * Create push payload for new order notification (Vendor)
   */
  createOrderReceivedPayload(
    orderId: string,
    buyerName: string,
    total: number,
  ): PushPayload {
    return {
      title: 'New Order!',
      body: `Order from ${buyerName} - ₦${total.toLocaleString()}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        url: `/orders/${orderId}`,
        orderId,
        type: PushService.EVENTS.ORDER_RECEIVED,
      },
      actions: [
        { action: 'view', title: 'View Order' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };
  }

  /**
   * Create push payload for order status update (Buyer)
   */
  createOrderStatusPayload(
    orderId: string,
    status: string,
    _productName: string,
  ): PushPayload {
    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed',
      PROCESSING: 'Your order is being processed',
      SHIPPED: 'Your order has been shipped',
      DELIVERED: 'Your order has been delivered',
      CANCELLED: 'Your order has been cancelled',
    };

    return {
      title: `Order ${status.toLowerCase()}`,
      body: statusMessages[status] || `Order status: ${status}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        url: `/orders/${orderId}`,
        orderId,
        type: PushService.EVENTS.ORDER_STATUS_UPDATE,
      },
    };
  }

  /**
   * Create push payload for delivery assignment (Rider)
   */
  createDeliveryAssignedPayload(
    orderId: string,
    pickupAddress: string,
    estimatedPay: number,
  ): PushPayload {
    return {
      title: 'New Delivery Assigned',
      body: `Pickup at ${pickupAddress} - Earn ₦${estimatedPay.toLocaleString()}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        url: `/deliveries/${orderId}`,
        orderId,
        type: PushService.EVENTS.NEW_DELIVERY,
      },
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
      ],
    };
  }

  /**
   * Create push payload for payment received (Vendor)
   */
  createPaymentReceivedPayload(
    orderId: string,
    amount: number,
  ): PushPayload {
    return {
      title: 'Payment Received',
      body: `₦${amount.toLocaleString()} for order #${orderId}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        url: `/orders/${orderId}`,
        orderId,
        type: PushService.EVENTS.PAYMENT_RECEIVED,
      },
    };
  }

  /**
   * Create push payload for low stock alert (Vendor)
   */
  createLowStockPayload(
    productId: string,
    productName: string,
    stockRemaining: number,
  ): PushPayload {
    return {
      title: 'Low Stock Alert',
      body: `${productName} has only ${stockRemaining} items left`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        url: `/products/${productId}`,
        type: PushService.EVENTS.LOW_STOCK,
      },
    };
  }

  /**
   * Create push payload for milestone earned (Vendor)
   */
  createMilestoneEarnedPayload(
    milestoneName: string,
    coinsAwarded: number,
  ): PushPayload {
    return {
      title: 'Milestone Achieved! 🎉',
      body: `You earned ${coinsAwarded} KwikCoins for: ${milestoneName}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        url: '/kwikcoins',
        type: PushService.EVENTS.MILESTONE_EARNED,
      },
    };
  }
}

/**
 * Generate VAPID keys (run once during setup)
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}
