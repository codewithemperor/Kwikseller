import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * UploadOptions — options accepted by uploadImage / uploadMultiple.
 */
export interface UploadOptions {
  folder: string;
  publicId?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: string;
}

/**
 * UploadResult — the shape consumers (vendor-store logo/banner, upload
 * controller) expect from a successful upload.
 */
export interface UploadResult {
  secureUrl: string;
  url: string;
  publicId: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
  resourceType?: string;
  createdAt?: string;
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * UploadService — local stub implementation.
 *
 * The full production implementation uses Cloudinary + sharp (see
 * `StorageService` in `src/common/services/storage.service.ts`). In the
 * sandbox we don't have Cloudinary configured, so this service accepts the
 * same call signature and returns placeholder metadata with a stable
 * placeholder image URL so that dependent flows (vendor logo/banner upload,
 * the /upload REST endpoints) keep working end-to-end.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Validate that the uploaded file is an image within the size limit.
   * Throws BadRequestException on invalid input.
   */
  validateImage(file: Express.Multer.File): boolean {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: jpeg, png, webp, gif, avif.`,
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(
        `File too large (${file.size} bytes). Max ${MAX_FILE_BYTES} bytes (10 MB).`,
      );
    }
    return true;
  }

  /**
   * "Upload" a single image. Returns a UploadResult with a placeholder URL.
   * The placeholder encodes the requested dimensions so the returned image
   * visually matches what the caller asked for.
   */
  async uploadImage(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadResult> {
    this.validateImage(file);

    const width = options.maxWidth ?? 800;
    const height = options.maxHeight ?? 800;
    const publicId =
      options.publicId ||
      `${options.folder}/${randomUUID().slice(0, 12)}`;

    const label = `${width}x${height}`;
    const placeholder = `https://placehold.co/${label}/f97316/ffffff?text=Kwikseller`;

    this.logger.log(
      `uploadImage stub: ${file.originalname} → ${placeholder} (publicId=${publicId})`,
    );

    return {
      secureUrl: placeholder,
      url: placeholder,
      publicId,
      bytes: file.size,
      width,
      height,
      format: options.format || 'webp',
      resourceType: 'image',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * "Upload" multiple images. Delegates to uploadImage for each file.
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    options: UploadOptions,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    const results: UploadResult[] = [];
    for (const file of files) {
      // give each file a unique publicId suffix
      const perFileOptions: UploadOptions = {
        ...options,
        publicId: options.publicId
          ? `${options.publicId}-${randomUUID().slice(0, 6)}`
          : undefined,
      };
      results.push(await this.uploadImage(file, perFileOptions));
    }
    return results;
  }

  /**
   * Delete an uploaded asset by its public ID. Stub — always succeeds.
   */
  async deleteFile(publicId: string): Promise<void> {
    if (!publicId) {
      throw new BadRequestException('publicId is required');
    }
    this.logger.log(`deleteFile stub: ${publicId} (no-op)`);
  }

  /**
   * Delete an uploaded asset by its URL. Stub — always succeeds.
   * Kept for backward compatibility with older consumers.
   */
  async deleteImage(_url: string): Promise<boolean> {
    this.logger.log('deleteImage stub (no-op)');
    return true;
  }
}
