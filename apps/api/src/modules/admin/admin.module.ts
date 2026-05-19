import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { CategoriesModule } from '../categories/categories.module';
import { BrandsModule } from '../brands/brands.module';
import { BannersModule } from '../banners/banners.module';
import { DealsModule } from '../deals/deals.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ProductsModule } from '../products/products.module';
import { AdminController } from './admin.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [
    DashboardModule,
    CategoriesModule,
    BrandsModule,
    BannersModule,
    DealsModule,
    CouponsModule,
    ProductsModule,
  ],
  controllers: [AdminController, AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminModule {}
