import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@Controller('notifications/push')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get the VAPID public key for push subscription' })
  getVapidPublicKey() {
    const publicKey = this.config.get<string>('vapid.publicKey') || '';
    return { publicKey };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Register a push subscription for the current user' })
  async subscribe(
    @CurrentUser() user: any,
    @Body()
    body: {
      endpoint: string;
      p256dh: string;
      auth: string;
      deviceName?: string;
    },
  ) {
    const userId = user.sub ?? user.id;
    if (!body?.endpoint || !body?.p256dh || !body?.auth) {
      return { success: false, message: 'endpoint, p256dh and auth are required' };
    }

    // Dedup: delete any existing subscription for this user with the same endpoint,
    // then create a fresh one. This handles re-subscription cleanly.
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint: body.endpoint },
    }).catch(() => undefined);

    const subscription = await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        deviceName: body.deviceName ?? null,
      },
    });

    return { success: true, id: subscription.id };
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Remove a push subscription for the current user' })
  async unsubscribe(
    @CurrentUser() user: any,
    @Body() body: { endpoint: string },
  ) {
    const userId = user.sub ?? user.id;
    if (!body?.endpoint) {
      return { success: false, message: 'endpoint is required' };
    }

    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint: body.endpoint },
    }).catch(() => undefined);

    return { success: true };
  }
}
