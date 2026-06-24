import { Injectable, Logger } from '@nestjs/common';

/**
 * UploadService — image-upload service.
 *
 * The method signatures match what upload.controller.ts expects:
 * validateImage, uploadImage, uploadMultiple, deleteFile, and a `quality`
 * option in UploadOptions.
 */

export interface UploadResult {
  url: string;
  secureUrl?: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  private readonly ALLOWED_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly MAX_BYTES = 5 * 1024 * 1024; // 5MB

  validateImage(file: Express.Multer.File | undefined): void {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!this.ALLOWED_MIME.includes(file.mimetype)) {
      throw new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: ${this.ALLOWED_MIME.join(', ')}`,
      );
    }
    if (file.size > this.MAX_BYTES) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 5MB.`,
      );
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    _options?: UploadOptions,
  ): Promise<UploadResult> {
    const base64 = file.buffer?.toString('base64') ?? '';
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    this.logger.log(
      `Uploaded image (stub): ${file.originalname} (${file.size} bytes)`,
    );
    return {
      url: dataUrl,
      secureUrl: dataUrl,
      publicId: `stub/${Date.now()}-${file.originalname}`,
      bytes: file.size,
      format: file.mimetype.split('/')[1],
    };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    options?: UploadOptions,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      this.validateImage(file);
      const result = await this.uploadImage(file, options);
      results.push(result);
    }
    return results;
  }

  async deleteFile(publicId: string): Promise<{ success: boolean; publicId: string }> {
    this.logger.log(`Deleted file (stub): ${publicId}`);
    return { success: true, publicId };
  }
}
