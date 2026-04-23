import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/auth.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpeg, png, webp, gif)',
        },
        folder: {
          type: 'string',
          description: 'Upload folder (products, brands, banners, etc.)',
          default: 'products',
        },
        maxWidth: { type: 'number', default: 1200 },
        maxHeight: { type: 'number', default: 1200 },
        quality: { type: 'number', default: 80 },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload and compress a single image' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.uploadService.validateImage(file);

    const result = await this.uploadService.uploadImage(file, {
      folder: 'general',
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 80,
      format: 'webp',
    });

    this.logger.log(`Image uploaded: ${result.publicId} (${result.bytes} bytes)`);

    return {
      success: true,
      data: result,
    };
  }

  @Post('images')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple image files (max 5)',
        },
      },
      required: ['files'],
    },
  })
  @ApiOperation({ summary: 'Upload and compress multiple images (max 5)' })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    for (const file of files) {
      this.uploadService.validateImage(file);
    }

    const results = await this.uploadService.uploadMultiple(files, {
      folder: 'general',
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 80,
      format: 'webp',
    });

    this.logger.log(`Uploaded ${results.length} images`);

    return {
      success: true,
      data: results,
    };
  }

  @Post('product')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Product image (800x800 max, WebP)',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a product image (optimized for product display)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.uploadService.validateImage(file);

    const result = await this.uploadService.uploadImage(file, {
      folder: 'products',
      maxWidth: 800,
      maxHeight: 800,
      quality: 85,
      format: 'webp',
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('banner')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Banner image (1920x600 max, WebP)',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a banner image (optimized for hero banners)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBannerImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.uploadService.validateImage(file);

    const result = await this.uploadService.uploadImage(file, {
      folder: 'banners',
      maxWidth: 1920,
      maxHeight: 600,
      quality: 85,
      format: 'webp',
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('avatar')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.BUYER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image (256x256 square, WebP)',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a profile avatar (256x256, WebP)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.uploadService.validateImage(file);

    const result = await this.uploadService.uploadImage(file, {
      folder: 'avatars',
      maxWidth: 256,
      maxHeight: 256,
      quality: 85,
      format: 'webp',
    });

    return {
      success: true,
      data: result,
    };
  }
}
