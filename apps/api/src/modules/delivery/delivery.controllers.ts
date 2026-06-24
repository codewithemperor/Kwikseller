import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeliveryService } from './delivery.service';
import { DeliveryFilterDto, AssignRiderDto, ReassignRiderDto } from './dto/delivery.dto';

function getUserId(user: any) {
  return user?.id ?? user?.sub ?? user?.userId;
}

// ─── Vendor Delivery Controller ────────────────────────────────────────────────

@ApiTags('Vendor Deliveries')
@ApiBearerAuth()
@Controller('vendor/deliveries')
@UseGuards(JwtAuthGuard)
export class VendorDeliveryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryService: DeliveryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List vendor deliveries with optional filters' })
  async listVendorDeliveries(
    @CurrentUser() user: any,
    @Query() filters: DeliveryFilterDto,
  ) {
    return this.deliveryService.findVendorDeliveries(getUserId(user), filters);
  }

  @Post(':id/preparing')
  @ApiOperation({ summary: 'Mark delivery as preparing (ACCEPTED → PREPARING)' })
  async markPreparing(
    @CurrentUser() user: any,
    @Param('id') deliveryId: string,
  ) {
    return this.deliveryService.markPreparing(deliveryId, getUserId(user));
  }

  @Post(':id/ready')
  @ApiOperation({ summary: 'Mark delivery as ready for pickup (PREPARING → READY_FOR_PICKUP)' })
  async markReady(
    @CurrentUser() user: any,
    @Param('id') deliveryId: string,
  ) {
    return this.deliveryService.markReady(deliveryId, getUserId(user));
  }

  @Post(':id/pickup-confirm')
  @ApiOperation({ summary: 'Vendor confirms handoff to rider (READY_FOR_PICKUP → PICKED_UP)' })
  async confirmPickup(
    @CurrentUser() user: any,
    @Param('id') deliveryId: string,
  ) {
    return this.deliveryService.confirmPickup(deliveryId, getUserId(user));
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get full delivery tracking info' })
  async getTracking(
    @CurrentUser() user: any,
    @Param('id') deliveryId: string,
  ) {
    return this.deliveryService.getDeliveryTracking(deliveryId, getUserId(user));
  }
}

// ─── Vendor Escrow Controller ─────────────────────────────────────────────────

@ApiTags('Vendor Wallet')
@ApiBearerAuth()
@Controller('vendor/wallet')
@UseGuards(JwtAuthGuard)
export class VendorEscrowController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('escrow-holdings')
  @ApiOperation({ summary: 'Get vendor escrow holdings' })
  async getEscrowHoldings(@CurrentUser() user: any) {
    return this.deliveryService.getEscrowHoldings(getUserId(user));
  }
}

// ─── Admin Delivery Controller ───────────────────────────────────────────────

@ApiTags('Admin Deliveries')
@ApiBearerAuth()
@Controller('admin/deliveries')
@UseGuards(JwtAuthGuard)
export class AdminDeliveryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryService: DeliveryService,
  ) {}

  /**
   * Helper: verify admin or super_admin role
   */
  private verifyAdmin(user: any) {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Admin access required.');
    }
  }

  @Post(':orderId/assign')
  @ApiOperation({ summary: 'Assign rider to an order (creates Delivery record)' })
  async assignRider(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: AssignRiderDto,
  ) {
    this.verifyAdmin(user);
    return this.deliveryService.assignRider(orderId, dto.riderId, getUserId(user), dto.estimatedMinutes);
  }

  @Get()
  @ApiOperation({ summary: 'List all deliveries (admin)' })
  async listAllDeliveries(@CurrentUser() user: any, @Query() filters: DeliveryFilterDto) {
    this.verifyAdmin(user);
    return this.deliveryService.listAllDeliveries(filters);
  }

  @Patch(':id/reassign')
  @ApiOperation({ summary: 'Reassign rider to a delivery' })
  async reassignRider(
    @CurrentUser() user: any,
    @Param('id') deliveryId: string,
    @Body() dto: ReassignRiderDto,
  ) {
    this.verifyAdmin(user);
    return this.deliveryService.reassignRider(deliveryId, dto.riderId);
  }
}

// ─── Admin Escrow Controller ───────────────────────────────────────────────────

@ApiTags('Admin Escrow')
@ApiBearerAuth()
@Controller('admin/escrow')
@UseGuards(JwtAuthGuard)
export class AdminEscrowController {
  constructor(private readonly deliveryService: DeliveryService) {}

  private verifyAdmin(user: any) {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Admin access required.');
    }
  }

  @Post(':deliveryId/manual-release')
  @ApiOperation({ summary: 'Manually release escrow to vendor wallet' })
  async manualEscrowRelease(
    @CurrentUser() user: any,
    @Param('deliveryId') deliveryId: string,
  ) {
    this.verifyAdmin(user);
    return this.deliveryService.manualEscrowRelease(deliveryId);
  }

  @Post(':deliveryId/refund')
  @ApiOperation({ summary: 'Refund escrow to customer' })
  async refundEscrow(
    @CurrentUser() user: any,
    @Param('deliveryId') deliveryId: string,
  ) {
    this.verifyAdmin(user);
    return this.deliveryService.refundEscrow(deliveryId);
  }
}
