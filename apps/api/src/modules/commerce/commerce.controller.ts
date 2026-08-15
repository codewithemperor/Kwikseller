import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CommerceService } from './commerce.service';
import {
  AddCartItemDto,
  CheckoutDto,
  CreatePaymentIntentDto,
  CreatePoolCampaignDto,
  CreatePoolOfferDto,
  CreatePoolProductDto,
  CreateVendorProductDto,
  DeliveryRateLookupDto,
  DigitalAssetDto,
  InventoryAdjustmentDto,
  ManualDeliveryDto,
  RefundPaymentDto,
  UpdateCartItemDto,
  UpdateDeliverySettingsDto,
  UpdateOrderStatusDto,
  UpdatePoolOfferDto,
  UpdateStorefrontDesignDto,
  UpdateVendorProductDto,
  UpsertDeliveryRateDto,
  ValidateCartCouponDto,
} from './commerce.dto';

@Controller('vendors')
export class PublicVendorsController {
  constructor(private readonly commerce: CommerceService) {}

  @Public()
  @Get()
  listVendors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.commerce.listPublicVendors({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      category,
    });
  }

  @Public()
  @Get(':slug')
  getVendor(@Param('slug') slug: string) {
    return this.commerce.getPublicStore(slug);
  }

  @Public()
  @Get(':slug/products/:productSlug')
  getStoreProduct(@Param('slug') slug: string, @Param('productSlug') productSlug: string) {
    return this.commerce.getPublicStoreProduct(slug, productSlug);
  }

  @Public()
  @Get(':slug/products')
  getStoreProducts(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('source') source?: string,
  ) {
    return this.commerce.listPublicStoreProducts(slug, {
      limit: limit ? Number(limit) : undefined,
      search,
      category,
      source,
    });
  }
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly commerce: CommerceService) {}

  @Get()
  getCart(@CurrentUser() user: any) {
    return this.commerce.getCart(user);
  }

  @Get('validate')
  validateCart(@CurrentUser() user: any) {
    return this.commerce.validateCart(user);
  }

  @Post('coupon')
  validateCoupon(@CurrentUser() user: any, @Body() dto: ValidateCartCouponDto) {
    return this.commerce.validateCouponForCart(user, dto);
  }

  @Post('items')
  addItem(@CurrentUser() user: any, @Body() dto: AddCartItemDto) {
    return this.commerce.addCartItem(user, dto);
  }

  @Post('pool-offers/:poolOfferId')
  addPoolOffer(
    @CurrentUser() user: any,
    @Param('poolOfferId') poolOfferId: string,
    @Body() dto: Pick<AddCartItemDto, 'quantity'>,
  ) {
    return this.commerce.addPoolOfferToCart(user, poolOfferId, dto.quantity);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.commerce.updateCartItem(user, itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(@CurrentUser() user: any, @Param('itemId') itemId: string) {
    return this.commerce.removeCartItem(user, itemId);
  }

  @Delete('vendors/:vendorSlug')
  clearVendorCart(@CurrentUser() user: any, @Param('vendorSlug') vendorSlug: string) {
    return this.commerce.clearStoreCart(user, vendorSlug);
  }

  @Delete()
  clearCart(@CurrentUser() user: any) {
    return this.commerce.clearCart(user);
  }
}

@Controller('delivery-rates')
export class DeliveryRatesController {
  constructor(private readonly commerce: CommerceService) {}

  @Get()
  lookup(@Query() query: DeliveryRateLookupDto) {
    return this.commerce.lookupDeliveryRate(query.state, query.localGovernment);
  }
}

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly commerce: CommerceService) {}

  @Post()
  async checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    // New quote-gated checkout: when items[] are provided, use the new flow
    // (server-side validation, no immediate Paystack, quote lifecycle).
    if (dto.items?.length) {
      const result = await this.commerce.checkoutWithItems(user, dto);
      // Emit order.created events for each vendor order (for notifications/emails)
      if (result?.orders) {
        for (const order of result.orders) {
          await this.commerce.emitOrderCreated(order, result.parentCheckout?.buyerId ?? user?.id);
        }
      }
      return result;
    }
    // Legacy DB-cart checkout (kept for backward compatibility)
    return this.commerce.checkout(user, dto);
  }

  @Get('payments/:reference')
  verifyPayment(@Param('reference') reference: string) {
    return this.commerce.verifyPayment(reference);
  }
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly commerce: CommerceService) {}

  @Post('intents')
  @UseGuards(JwtAuthGuard)
  createIntent(@CurrentUser() user: any, @Body() dto: CreatePaymentIntentDto) {
    return this.commerce.createPaymentIntent(user, dto);
  }

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  initialize(@CurrentUser() user: any, @Body() dto: CreatePaymentIntentDto) {
    return this.commerce.createPaymentIntent(user, dto);
  }

  @Get('verify/:reference')
  verify(@Param('reference') reference: string) {
    return this.commerce.verifyPayment(reference);
  }

  @Get('paystack/health')
  paystackHealth() {
    return { gateway: 'PAYSTACK', configured: true };
  }

  @Post('webhooks/paystack')
  paystackWebhook(@Headers('x-paystack-signature') signature: string, @Body() body: unknown) {
    return this.commerce.handlePaystackWebhook(signature, body);
  }
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly commerce: CommerceService) {}

  @Get()
  listOrders(@CurrentUser() user: any) {
    return this.commerce.listOrders(user);
  }

  @Get(':orderId')
  getOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.commerce.getOrder(user, orderId);
  }
}

@Controller('pool')
export class PoolController {
  constructor(private readonly commerce: CommerceService) {}

  @Get('offers')
  listOffers() {
    return this.commerce.listPublicPoolOffers();
  }

  @Get('campaigns')
  listCampaigns() {
    return this.commerce.listPoolCampaigns();
  }
}

@Controller('vendor')
@UseGuards(JwtAuthGuard)
export class VendorCommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: any, @Query('q') query?: string) {
    return this.commerce.getVendorDashboard(user, { query });
  }

  @Get('products')
  listProducts(@CurrentUser() user: any) {
    return this.commerce.listVendorProducts(user);
  }

  @Post('products')
  createProduct(@CurrentUser() user: any, @Body() dto: CreateVendorProductDto) {
    return this.commerce.createVendorProduct(user, dto);
  }

  @Patch('products/:productId')
  updateProduct(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateVendorProductDto,
  ) {
    return this.commerce.updateVendorProduct(user, productId, dto);
  }

  @Get('delivery-settings')
  getDeliverySettings(@CurrentUser() user: any) {
    return this.commerce.getVendorDeliverySettings(user);
  }

  @Patch('delivery-settings')
  updateDeliverySettings(@CurrentUser() user: any, @Body() dto: UpdateDeliverySettingsDto) {
    return this.commerce.updateVendorDeliverySettings(user, dto);
  }

  @Post('inventory/adjustments')
  adjustInventory(@CurrentUser() user: any, @Body() dto: InventoryAdjustmentDto) {
    return this.commerce.adjustInventory(user, dto);
  }

  @Post('digital-assets')
  addDigitalAsset(@CurrentUser() user: any, @Body() dto: DigitalAssetDto) {
    return this.commerce.addDigitalAsset(user, dto);
  }

  @Get('orders')
  listOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.commerce.listVendorOrders(user, { page, limit, status, search, dateRange });
  }

  // Must be registered before the parameterized 'orders/:orderId' route so
  // 'attention-counts' is not captured as an orderId.
  @Get('orders/attention-counts')
  getOrderAttentionCounts(@CurrentUser() user: any) {
    return this.commerce.getVendorOrderAttentionCounts(user);
  }

  @Get('orders/:orderId')
  getOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.commerce.getVendorOrder(user, orderId);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.commerce.updateVendorOrderStatus(user, orderId, dto);
  }

  @Get('pool/catalog')
  listPoolCatalog(
    @CurrentUser() user: any,
    @Query('categoryId') categoryId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commerce.listPoolCatalog(user, { categoryId, vendorId, search, page, limit });
  }

  @Post('pool/offers')
  createPoolOffer(@CurrentUser() user: any, @Body() dto: CreatePoolOfferDto) {
    return this.commerce.createPoolOffer(user, dto);
  }

  @Post('pool/selections')
  createPoolSelection(@CurrentUser() user: any, @Body() dto: CreatePoolOfferDto) {
    return this.commerce.createPoolOffer(user, dto);
  }

  @Patch('pool/selections/:offerId')
  updatePoolSelection(
    @CurrentUser() user: any,
    @Param('offerId') offerId: string,
    @Body() dto: UpdatePoolOfferDto,
  ) {
    return this.commerce.updatePoolOffer(user, offerId, dto);
  }

  @Delete('pool/selections/:offerId')
  deletePoolSelection(@CurrentUser() user: any, @Param('offerId') offerId: string) {
    return this.commerce.deletePoolOffer(user, offerId);
  }

  @Patch('pool/offers/:offerId')
  updatePoolOffer(
    @CurrentUser() user: any,
    @Param('offerId') offerId: string,
    @Body() dto: UpdatePoolOfferDto,
  ) {
    return this.commerce.updatePoolOffer(user, offerId, dto);
  }

  @Get('storefront-design')
  getStorefrontDesign(@CurrentUser() user: any) {
    return this.commerce.getVendorStorefrontDesign(user);
  }

  @Patch('storefront-design')
  updateStorefrontDesign(@CurrentUser() user: any, @Body() dto: UpdateStorefrontDesignDto) {
    return this.commerce.updateVendorStorefrontDesign(user, dto);
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminCommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Get('commerce/overview')
  overview(@CurrentUser() user: any) {
    return this.commerce.getAdminCommerceOverview(user);
  }

  @Get('payments')
  payments(@CurrentUser() user: any) {
    return this.commerce.listAdminPayments(user);
  }

  @Post('payments/refunds')
  refund(@CurrentUser() user: any, @Body() dto: RefundPaymentDto) {
    return this.commerce.refundPayment(user, dto);
  }

  @Post('payments/:paymentId/refund')
  refundByParam(
    @CurrentUser() user: any,
    @Param('paymentId') paymentId: string,
    @Body() dto: Omit<RefundPaymentDto, 'paymentId'>,
  ) {
    return this.commerce.refundPayment(user, { ...dto, paymentId });
  }

  @Patch('orders/manual-status')
  manualDelivery(@CurrentUser() user: any, @Body() dto: ManualDeliveryDto) {
    return this.commerce.updateManualDelivery(user, dto);
  }

  @Patch('orders/:orderId/manual-status')
  manualDeliveryByParam(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: Omit<ManualDeliveryDto, 'orderId'>,
  ) {
    return this.commerce.updateManualDelivery(user, { ...dto, orderId });
  }

  @Post('inventory/reservations/release-expired')
  releaseExpiredReservations(@CurrentUser() user: any) {
    return this.commerce.releaseExpiredReservations(user);
  }

  @Get('pool/products')
  poolProducts(@CurrentUser() user: any) {
    return this.commerce.listAdminPoolProducts(user);
  }

  @Post('pool/products')
  createPoolProduct(@CurrentUser() user: any, @Body() dto: CreatePoolProductDto) {
    return this.commerce.createPoolProduct(user, dto);
  }

  @Patch('pool/products/:poolProductId')
  updatePoolProduct(
    @CurrentUser() user: any,
    @Param('poolProductId') poolProductId: string,
    @Body() dto: Partial<CreatePoolProductDto>,
  ) {
    return this.commerce.updatePoolProduct(user, poolProductId, dto);
  }

  @Get('pool/campaigns')
  poolCampaigns(@CurrentUser() user: any) {
    return this.commerce.listAdminPoolCampaigns(user);
  }

  @Post('pool/campaigns')
  createPoolCampaign(@CurrentUser() user: any, @Body() dto: CreatePoolCampaignDto) {
    return this.commerce.createPoolCampaign(user, dto);
  }

  @Get('orders')
  adminOrders(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.commerce.listAdminOrders(user, status);
  }

  @Get('delivery-rates')
  deliveryRates(
    @CurrentUser() user: any,
    @Query('state') state?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.commerce.listAdminDeliveryRates(user, { state, isActive });
  }

  @Post('delivery-rates')
  createDeliveryRate(@CurrentUser() user: any, @Body() dto: UpsertDeliveryRateDto) {
    return this.commerce.createDeliveryRate(user, dto);
  }

  @Patch('delivery-rates/:rateId')
  updateDeliveryRate(
    @CurrentUser() user: any,
    @Param('rateId') rateId: string,
    @Body() dto: Partial<UpsertDeliveryRateDto>,
  ) {
    return this.commerce.updateDeliveryRate(user, rateId, dto);
  }

  @Delete('delivery-rates/:rateId')
  deactivateDeliveryRate(@CurrentUser() user: any, @Param('rateId') rateId: string) {
    return this.commerce.deactivateDeliveryRate(user, rateId);
  }
}
