import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminPermissionsGuard } from '../auth/guards/admin-permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../auth/dto/auth.dto';
import { UpdateProfileDto, UserWithProfileDto } from './dto/profile.dto';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto } from './dto/address.dto';
import {
  KycDocumentType,
  UploadKycDto,
  KycDocumentResponseDto,
  KycReviewDto,
} from './dto/kyc.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== PROFILE ENDPOINTS ====================

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserWithProfileDto })
  async getCurrentUser(
    @CurrentUser('id') userId: string,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<UserWithProfileDto> {
    return this.usersService.getCurrentUser(userId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser('ip') ipAddress: string,
  ) {
    return this.usersService.updateProfile(userId, dto, ipAddress);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload profile avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('ip') ipAddress: string,
  ) {
    return this.usersService.uploadProfileImage(userId, file, ipAddress);
  }

  @Delete('me/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete profile avatar' })
  @ApiResponse({ status: 204, description: 'Avatar deleted successfully' })
  async deleteAvatar(
    @CurrentUser('id') userId: string,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<void> {
    await this.usersService.deleteProfileImage(userId, ipAddress);
  }

  // ==================== ADDRESS ENDPOINTS ====================

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get all addresses for current user' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved', type: [AddressResponseDto] })
  async getAddresses(@CurrentUser('id') userId: string): Promise<AddressResponseDto[]> {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully', type: AddressResponseDto })
  async createAddress(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<AddressResponseDto> {
    return this.usersService.createAddress(userId, dto, ipAddress);
  }

  @Get('me/addresses/:id')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address retrieved', type: AddressResponseDto })
  async getAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
  ): Promise<AddressResponseDto> {
    return this.usersService.getAddress(userId, addressId);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully', type: AddressResponseDto })
  async updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<AddressResponseDto> {
    return this.usersService.updateAddress(userId, addressId, dto, ipAddress);
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 204, description: 'Address deleted successfully' })
  async deleteAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<void> {
    await this.usersService.deleteAddress(userId, addressId, ipAddress);
  }

  @Patch('me/addresses/:id/default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address set as default', type: AddressResponseDto })
  async setDefaultAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<AddressResponseDto> {
    return this.usersService.setDefaultAddress(userId, addressId, ipAddress);
  }

  // ==================== KYC ENDPOINTS ====================

  @Get('me/kyc')
  @ApiOperation({ summary: 'Get KYC documents for current user' })
  @ApiResponse({ status: 200, description: 'KYC documents retrieved', type: [KycDocumentResponseDto] })
  async getKycDocuments(@CurrentUser('id') userId: string): Promise<KycDocumentResponseDto[]> {
    return this.usersService.getKycDocuments(userId);
  }

  @Get('me/kyc/:id')
  @ApiOperation({ summary: 'Get KYC document by ID' })
  @ApiParam({ name: 'id', description: 'KYC Document ID' })
  @ApiResponse({ status: 200, description: 'KYC document retrieved', type: KycDocumentResponseDto })
  async getKycDocument(
    @CurrentUser('id') userId: string,
    @Param('id') kycId: string,
  ): Promise<KycDocumentResponseDto> {
    return this.usersService.getKycDocument(userId, kycId);
  }

  @Post('me/kyc')
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'KYC document uploaded', type: KycDocumentResponseDto })
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Only JPEG, PNG, WebP, and PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadKycDocument(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: KycDocumentType,
    @Body('documentNumber') documentNumber: string | undefined,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<KycDocumentResponseDto> {
    return this.usersService.uploadKycDocument(
      userId,
      file,
      documentType,
      documentNumber,
      ipAddress,
    );
  }

  // ==================== ADMIN KYC MANAGEMENT ====================

  @Get('admin/kyc/pending')
  @Roles(UserRole.ADMIN)
  @UseGuards(AdminPermissionsGuard)
  @Permissions('vendors:kyc:review')
  @ApiOperation({ summary: 'Get all pending KYC documents (Admin)' })
  @ApiResponse({ status: 200, description: 'Pending KYC documents retrieved', type: [KycDocumentResponseDto] })
  async getPendingKycDocuments(): Promise<KycDocumentResponseDto[]> {
    return this.usersService.getPendingKycDocuments();
  }

  @Patch('admin/kyc/:id/review')
  @Roles(UserRole.ADMIN)
  @UseGuards(AdminPermissionsGuard)
  @Permissions('vendors:kyc:review')
  @ApiOperation({ summary: 'Review KYC document (Admin)' })
  @ApiParam({ name: 'id', description: 'KYC Document ID' })
  @ApiResponse({ status: 200, description: 'KYC document reviewed', type: KycDocumentResponseDto })
  async reviewKycDocument(
    @CurrentUser('id') adminId: string,
    @Param('id') kycId: string,
    @Body() dto: KycReviewDto,
    @CurrentUser('ip') ipAddress: string,
  ): Promise<KycDocumentResponseDto> {
    return this.usersService.reviewKycDocument(adminId, kycId, dto, ipAddress);
  }
}
