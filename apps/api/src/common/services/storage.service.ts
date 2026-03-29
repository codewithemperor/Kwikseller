import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import sharp from 'sharp';

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface UploadOptions {
  folder: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: object;
  width?: number;
  height?: number;
  quality?: string | number;
  format?: string;
  publicId?: string;
  overwrite?: boolean;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    this.configureCloudinary();
  }

  private configureCloudinary() {
    const cloudName = this.configService.get('cloudinary.cloudName');
    const apiKey = this.configService.get('cloudinary.apiKey');
    const apiSecret = this.configService.get('cloudinary.apiSecret');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.logger.warn('Cloudinary not configured - uploads will return placeholder URLs');
    }
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const { folder, resourceType = 'auto', transformation, publicId, overwrite = true } = options;

    if (!this.isConfigured) {
      // Return placeholder in development
      const id = publicId || `${Date.now()}-${file.originalname.split('.')[0]}`;
      return {
        url: `https://via.placeholder.com/400x400?text=${encodeURIComponent(folder)}`,
        publicId: `${folder}/${id}`,
        secureUrl: `https://via.placeholder.com/400x400?text=${encodeURIComponent(folder)}`,
        resourceType: 'image',
        format: 'png',
        width: 400,
        height: 400,
        bytes: file.size,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        overwrite,
        transformation,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed:', error);
            reject(new BadRequestException('File upload failed'));
            return;
          }

          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload and resize an image
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpg' | 'png';
    } = {},
  ): Promise<UploadResult> {
    const { width = 800, height, quality = 80, format = 'webp' } = options;

    // Process image with sharp
    let imageProcessor = sharp(file.buffer)
      .resize(width, height)
      .webp({ quality });

    // Convert to specified format
    if (format === 'jpg') {
      imageProcessor = sharp(file.buffer)
        .resize(width, height)
        .jpeg({ quality });
    } else if (format === 'png') {
      imageProcessor = sharp(file.buffer)
        .resize(width, height)
        .png({ quality });
    }

    const processedBuffer = await imageProcessor.toBuffer();

    // Update file with processed image
    const processedFile: Express.Multer.File = {
      ...file,
      buffer: processedBuffer,
      mimetype: `image/${format}`,
      size: processedBuffer.length,
    };

    return this.uploadFile(processedFile, {
      folder,
      resourceType: 'image',
      transformation: [
        { quality: `auto:${quality}` },
        { fetch_format: format },
      ],
    });
  }

  /**
   * Upload profile image - resizes to 256x256 WebP
   */
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Resize to 256x256 WebP
    const resizedBuffer = await sharp(file.buffer)
      .resize(256, 256, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    const processedFile: Express.Multer.File = {
      ...file,
      buffer: resizedBuffer,
      mimetype: 'image/webp',
      size: resizedBuffer.length,
    };

    return this.uploadFile(processedFile, {
      folder: 'profiles',
      publicId: `avatar-${userId}`,
      resourceType: 'image',
      transformation: [
        { width: 256, height: 256, crop: 'fill', gravity: 'face' },
        { quality: 'auto:85' },
        { fetch_format: 'webp' },
      ],
    });
  }

  /**
   * Upload KYC document
   */
  async uploadKycDocument(
    file: Express.Multer.File,
    userId: string,
    documentType: string,
  ): Promise<UploadResult> {
    // Validate file type (image or PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('KYC document must be an image (JPEG, PNG, WebP) or PDF');
    }

    // For images, optimize them
    if (file.mimetype.startsWith('image/')) {
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const processedFile: Express.Multer.File = {
        ...file,
        buffer: optimizedBuffer,
        mimetype: 'image/webp',
        size: optimizedBuffer.length,
      };

      return this.uploadFile(processedFile, {
        folder: 'kyc-documents',
        publicId: `kyc-${userId}-${documentType}-${Date.now()}`,
        resourceType: 'image',
      });
    }

    // For PDFs, upload directly
    return this.uploadFile(file, {
      folder: 'kyc-documents',
      publicId: `kyc-${userId}-${documentType}-${Date.now()}`,
      resourceType: 'raw',
    });
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('Cloudinary not configured, skipping delete');
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      this.logger.log(`Deleted file: ${publicId}`);
    } catch (error) {
      this.logger.error('Failed to delete file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Generate a signed URL for private access (if using authenticated uploads)
   */
  async generateSignedUrl(publicId: string, options: { expiresAt?: number } = {}): Promise<string> {
    if (!this.isConfigured) {
      return `https://via.placeholder.com/400x400?text=${encodeURIComponent(publicId)}`;
    }

    const timestamp = options.expiresAt || Math.round(Date.now() / 1000) + 3600; // 1 hour default

    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      type: 'authenticated',
      expires_at: timestamp,
    });
  }

  /**
   * Get optimized URL with transformations
   */
  getOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    format?: string;
    quality?: string;
  } = {}): string {
    const { width, height, format = 'webp', quality = 'auto' } = options;

    if (!this.isConfigured) {
      return `https://via.placeholder.com/${width || 400}x${height || 400}?text=${encodeURIComponent(publicId)}`;
    }

    return cloudinary.url(publicId, {
      secure: true,
      fetch_format: format,
      quality,
      width,
      height,
      crop: width && height ? 'fill' : undefined,
    });
  }

  /**
   * Upload store assets (logo, banner)
   */
  async uploadStoreAsset(
    file: Express.Multer.File,
    storeId: string,
    type: 'logo' | 'banner',
  ): Promise<UploadResult> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const sizes = {
      logo: { width: 200, height: 200 },
      banner: { width: 1200, height: 400 },
    };

    const { width, height } = sizes[type];

    const resizedBuffer = await sharp(file.buffer)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();

    const processedFile: Express.Multer.File = {
      ...file,
      buffer: resizedBuffer,
      mimetype: 'image/webp',
      size: resizedBuffer.length,
    };

    return this.uploadFile(processedFile, {
      folder: `stores/${storeId}`,
      publicId: type,
      resourceType: 'image',
      overwrite: true,
    });
  }

  /**
   * Upload product image
   */
  async uploadProductImage(
    file: Express.Multer.File,
    storeId: string,
    productId: string,
    position: number,
  ): Promise<UploadResult> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Resize to max 800x800 for product images
    const resizedBuffer = await sharp(file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const processedFile: Express.Multer.File = {
      ...file,
      buffer: resizedBuffer,
      mimetype: 'image/webp',
      size: resizedBuffer.length,
    };

    return this.uploadFile(processedFile, {
      folder: `stores/${storeId}/products/${productId}`,
      publicId: `image-${position}`,
      resourceType: 'image',
    });
  }
}
