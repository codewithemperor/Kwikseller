import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorStoreService } from './vendor-store.service';

/**
 * VendorStoreController
 *
 * HTTP routes for the authenticated vendor's store profile.
 *
 * Route prefix: `/vendor/shop` — per the "use vendor instead of store"
 * naming convention. No route exposes the word "store".
 */
@Controller('vendor/shop')
@UseGuards(JwtAuthGuard)
export class VendorStoreController {
  constructor(private readonly vendorStore: VendorStoreService) {}

  @Get()
  get(@CurrentUser() user: any) {
    return this.vendorStore.getStore(user);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.vendorStore.createStore(user, dto);
  }

  @Patch()
  update(@CurrentUser() user: any, @Body() dto: any) {
    return this.vendorStore.updateStore(user, dto);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(@CurrentUser() user: any, @UploadedFile() file?: Express.Multer.File) {
    return this.vendorStore.uploadLogo(user, file);
  }

  @Post('banner')
  @UseInterceptors(FileInterceptor('banner'))
  uploadBanner(@CurrentUser() user: any, @UploadedFile() file?: Express.Multer.File) {
    return this.vendorStore.uploadBanner(user, file);
  }
}
