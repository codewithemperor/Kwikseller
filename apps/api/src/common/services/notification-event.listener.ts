import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { PushService } from './push.service';

/**
 * NotificationEventListener — listens for `notification.created` events
 * emitted by NotificationService and dispatches push notifications to the
 * user's registered devices. This decouples push delivery from the
 * notification creation call site (commerce, escrow, orders, etc.).
 *
 * Best-effort: any push failure is logged and swallowed so it never breaks
 * the originating flow.
 */
@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  @OnEvent('notification.created')
  async handleNotificationCreated(event: {
    userId: string;
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      data?: string | null;
    };
  }) {
    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId: event.userId },
      });

      if (!subscriptions || subscriptions.length === 0) return;

      const payload = this.pushService.createOrderStatusPayload(
        event.notification.id,
        event.notification.type,
        event.notification.title,
      );

      // Override the title/body with the actual notification content
      payload.title = event.notification.title;
      payload.body = event.notification.message;
      payload.data = {
        ...payload.data,
        type: event.notification.type,
        url: `/dashboard/notifications`,
      };

      await this.pushService.sendPushToMany(
        subscriptions.map((s) => ({
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        })),
        payload,
      );
    } catch (error) {
      this.logger.warn(
        `Push dispatch for notification ${event?.notification?.id} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
