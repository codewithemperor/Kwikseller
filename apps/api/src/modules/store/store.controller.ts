import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreService } from './store.service';

@Controller('store')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get()
  get(@CurrentUser() user: any) {
    return this.store.getStore(user);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.store.createStore(user, dto);
  }

  @Patch()
  update(@CurrentUser() user: any, @Body() dto: any) {
    return this.store.updateStore(user, dto);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(@CurrentUser() user: any, @UploadedFile() file?: Express.Multer.File) {
    return this.store.uploadLogo(user, file);
  }

  @Post('banner')
  @UseInterceptors(FileInterceptor('banner'))
  uploadBanner(@CurrentUser() user: any, @UploadedFile() file?: Express.Multer.File) {
    return this.store.uploadBanner(user, file);
  }
}
