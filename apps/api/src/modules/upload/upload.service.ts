import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

export interface UploadedFileResult {
  url: string;
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  folder: string;
  publicId?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
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
      this.logger.warn(
        'Cloudinary not configured - uploads will return placeholder URLs',
      );
    }
  }

  /**
   * Process and upload an image with compression
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageProcessOptions,
  ): Promise<UploadedFileResult> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 80,
      format = 'webp',
      folder,
      publicId,
    } = options;

    // Process image with sharp
    const pipeline = sharp(file.buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    let processedBuffer: Buffer;
    let outputFormat = format;

    switch (format) {
      case 'jpeg':
        processedBuffer = await pipeline.jpeg({ quality }).toBuffer();
        break;
      case 'png':
        processedBuffer = await pipeline.png({ quality }).toBuffer();
        break;
      case 'webp':
      default:
        processedBuffer = await pipeline.webp({ quality }).toBuffer();
        outputFormat = 'webp';
        break;
    }

    // Get image metadata
    const metadata = await sharp(processedBuffer).metadata();

    if (!this.isConfigured) {
      const id = publicId || `img-${Date.now()}`;
      const placeholderUrl = `https://placehold.co/${metadata.width || maxWidth}x${metadata.height || maxHeight}/f97316/white?text=${encodeURIComponent(folder)}`;
      return {
        url: placeholderUrl,
        publicId: `${folder}/${id}`,
        secureUrl: placeholderUrl,
        format: outputFormat,
        width: metadata.width || maxWidth,
        height: metadata.height || maxHeight,
        bytes: processedBuffer.length,
      };
    }

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: publicId ? true : false,
          resource_type: 'image',
          transformation: [
            { quality: `auto:${quality}` },
            { fetch_format: outputFormat },
          ],
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed:', error);
            reject(error || new Error('Upload failed'));
            return;
          }

          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format || outputFormat,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(processedBuffer);
    });
  }

  /**
   * Upload multiple images
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    options: ImageProcessOptions,
  ): Promise<UploadedFileResult[]> {
    return Promise.all(files.map((file) => this.uploadImage(file, options)));
  }

  /**
   * Upload a generic file (non-image)
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    publicId?: string,
  ): Promise<UploadedFileResult> {
    const id = publicId || `file-${Date.now()}-${file.originalname.split('.')[0]}`;

    if (!this.isConfigured) {
      const placeholderUrl = `https://placehold.co/400x400/f97316/white?text=${encodeURIComponent(folder)}`;
      return {
        url: placeholderUrl,
        publicId: `${folder}/${id}`,
        secureUrl: placeholderUrl,
        format: file.mimetype.split('/')[1] || 'unknown',
        width: 400,
        height: 400,
        bytes: file.size,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: id,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('File upload failed:', error);
            reject(error || new Error('Upload failed'));
            return;
          }

          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format || 'unknown',
            width: result.width || 0,
            height: result.height || 0,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('Cloudinary not configured, skipping delete');
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted file: ${publicId}`);
    } catch (error) {
      this.logger.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  validateImage(file: Express.Multer.File): void {
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }
  }
}
