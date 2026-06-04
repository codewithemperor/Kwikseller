import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderOperationsService } from './order-operations.service';

// ─── DTOs ────────────────────────────────────────────────────────────────

class AddOrderNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

// ─── Controller ──────────────────────────────────────────────────────────

/**
 * Vendor Order Operations Controller
 *
 * Handles order operation endpoints under /vendor/orders/:id/...
 * Note: accept, reject, prepare, ready, cancel are handled by
 * the existing VendorOrdersController in the orders module.
 * This controller adds the internal note endpoint.
 */
@ApiTags('Vendor Order Operations')
@ApiBearerAuth()
@Controller('vendor/orders')
@UseGuards(JwtAuthGuard)
export class VendorOrderOperationsController {
  constructor(private readonly orderOpsService: OrderOperationsService) {}

  @Post(':id/note')
  @ApiOperation({ summary: 'Add internal note to order' })
  async addNote(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: AddOrderNoteDto,
  ) {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Note content is required.');
    }
    const store = await this.orderOpsService.getVendorStore(user.sub);
    return this.orderOpsService.addOrderNote(
      orderId,
      store.id,
      user.sub,
      dto.content.trim(),
    );
  }
}
