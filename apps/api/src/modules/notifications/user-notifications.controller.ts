import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from '../../common/services/notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Customer / user-facing notifications controller.
 *
 * Mounted at `notifications` (i.e. `/api/v1/notifications`) — accessible to ANY
 * authenticated user (customer OR vendor). The existing
 * `VendorNotificationsController` at `vendor/notifications` is preserved for
 * backward compatibility with the vendor dashboard, but the marketplace header
 * bell uses THIS controller so buyers can see their own notifications.
 *
 * Routes:
 *   GET    /notifications                  — list (paginated, optional type filter)
 *   GET    /notifications/unread-count     — unread count
 *   PATCH  /notifications/:id/read         — mark single as read
 *   POST   /notifications/read-all         — mark all as read
 *
 * All routes are JWT-guarded and scoped to the authenticated user's id
 * (`user.sub`), so a user can only ever read or mutate their own notifications.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class UserNotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated user notifications' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = user?.sub ?? user?.id;
    return this.notificationService.getUserNotifications(userId, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for the authenticated user' })
  async getUnreadCount(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ) {
    const userId = user?.sub ?? user?.id;
    const result = await this.notificationService.markAsRead(notificationId, userId);
    return { success: true, updated: result.count > 0 };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for the authenticated user' })
  async markAllAsRead(@CurrentUser() user: any) {
    const userId = user?.sub ?? user?.id;
    const result = await this.notificationService.markAllAsRead(userId);
    return { success: true, updated: result.count };
  }
}
