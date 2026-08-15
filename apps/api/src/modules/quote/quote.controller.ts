import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QuoteService } from './quote.service';
import {
  QuoteNoteDto,
  RequestReductionDto,
  ReviseQuoteDto,
  SubmitQuoteDto,
} from './quote.dto';

/**
 * QuoteController — implements the quote negotiation lifecycle endpoints.
 *
 * All routes are under `/orders/:orderId/quote*` and `/orders/:orderId/initialize-payment`.
 * They share the `@Controller('orders')` prefix with the existing OrdersController
 * in commerce.controller.ts — NestJS routes them by full path match, so there is
 * no collision (the existing controller only registers `GET /orders` and
 * `GET /orders/:orderId`).
 *
 * Ownership is enforced server-side inside QuoteService:
 *   - Vendor actions verify `order.store.vendorId === user.id`
 *   - Customer actions verify `order.buyerId === user.id`
 *   - `getQuote` and `initializePayment` accept either party (payment init is
 *     customer-only by design — see below).
 */
@ApiTags('Quote Negotiation')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  // ─── Vendor actions ───────────────────────────────────────────────────────

  /** POST /orders/:orderId/quote — vendor submits initial delivery quote */
  @Post(':orderId/quote')
  @ApiOperation({ summary: 'Vendor: submit initial delivery quote' })
  submitQuote(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: SubmitQuoteDto,
  ) {
    return this.quoteService.submitQuote(user, orderId, dto);
  }

  /** PATCH /orders/:orderId/quote/revise — vendor revises after customer reduction */
  @Patch(':orderId/quote/revise')
  @ApiOperation({ summary: 'Vendor: revise quote after customer reduction request' })
  reviseQuote(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: ReviseQuoteDto,
  ) {
    return this.quoteService.reviseQuote(user, orderId, dto);
  }

  /** POST /orders/:orderId/quote/accept-reduction — vendor accepts customer's reduction */
  @Post(':orderId/quote/accept-reduction')
  @ApiOperation({ summary: 'Vendor: accept customer\u2019s requested reduction' })
  acceptReduction(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto?: QuoteNoteDto,
  ) {
    return this.quoteService.acceptReduction(user, orderId, dto);
  }

  /** POST /orders/:orderId/quote/reject-reduction — vendor rejects customer's reduction */
  @Post(':orderId/quote/reject-reduction')
  @ApiOperation({ summary: 'Vendor: reject customer\u2019s requested reduction' })
  rejectReduction(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto?: QuoteNoteDto,
  ) {
    return this.quoteService.rejectReduction(user, orderId, dto);
  }

  // ─── Customer actions ─────────────────────────────────────────────────────

  /** POST /orders/:orderId/quote/accept — customer accepts vendor's quote */
  @Post(':orderId/quote/accept')
  @ApiOperation({ summary: 'Customer: accept vendor\u2019s current quote' })
  acceptQuote(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto?: QuoteNoteDto,
  ) {
    return this.quoteService.acceptQuote(user, orderId, dto);
  }

  /** POST /orders/:orderId/quote/request-reduction — customer asks for lower fee */
  @Post(':orderId/quote/request-reduction')
  @ApiOperation({ summary: 'Customer: request a lower delivery fee' })
  requestReduction(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: RequestReductionDto,
  ) {
    return this.quoteService.requestReduction(user, orderId, dto);
  }

  /** POST /orders/:orderId/quote/reject — customer rejects the quote entirely */
  @Post(':orderId/quote/reject')
  @ApiOperation({ summary: 'Customer: reject vendor\u2019s quote entirely (terminal)' })
  rejectQuote(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto?: QuoteNoteDto,
  ) {
    return this.quoteService.rejectQuote(user, orderId, dto);
  }

  // ─── Shared / gateway ─────────────────────────────────────────────────────

  /** GET /orders/:orderId/quote — returns quote with all revisions (either party) */
  @Get(':orderId/quote')
  @ApiOperation({ summary: 'Get quote with full revision history (vendor or customer)' })
  getQuote(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.quoteService.getQuote(user, orderId);
  }

  /**
   * POST /orders/:orderId/initialize-payment — customer initializes Paystack payment.
   * Only allowed when quote.status === AGREED.
   */
  @Post(':orderId/initialize-payment')
  @ApiOperation({ summary: 'Customer: initialize Paystack payment after quote agreement' })
  initializePayment(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.quoteService.initializePayment(user, orderId);
  }
}
