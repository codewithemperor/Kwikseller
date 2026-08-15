import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Platform-wide configuration service.
 * Single source of truth for configurable values like the processing fee.
 * Admin can update these via the PlatformSetting table.
 */
@Injectable()
export class PlatformSettingService {
  private readonly logger = new Logger(PlatformSettingService.name);
  private readonly cache = new Map<string, string>();
  private cacheLoadedAt = 0;
  private readonly CACHE_TTL_MS = 60_000; // 1 minute

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a setting value as string (raw).
   */
  async get(key: string, fallback = ''): Promise<string> {
    await this.ensureCache();
    const val = this.cache.get(key);
    if (val === undefined || val === null) {
      return fallback;
    }
    return val;
  }

  /**
   * Get a setting value as float.
   */
  async getFloat(key: string, fallback = 0): Promise<number> {
    const raw = await this.get(key, String(fallback));
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Get a setting value as int.
   */
  async getInt(key: string, fallback = 0): Promise<number> {
    const raw = await this.get(key, String(fallback));
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * The platform processing fee as a percentage (e.g. 1 = 1%).
   * Configurable by Admin via the PROCESSING_FEE_PERCENT key.
   */
  async getProcessingFeePercent(): Promise<number> {
    const envDefault = Number(process.env.DEFAULT_PROCESSING_FEE_PERCENT || '1');
    return this.getFloat('PROCESSING_FEE_PERCENT', envDefault || 1);
  }

  /**
   * Compute the processing fee amount for a given base.
   * fee = base * (percent / 100)
   */
  async computeProcessingFee(baseAmount: number): Promise<{
    percent: number;
    feeAmount: number;
  }> {
    const percent = await this.getProcessingFeePercent();
    const feeAmount = Math.round(baseAmount * (percent / 100) * 100) / 100;
    return { percent, feeAmount };
  }

  /**
   * Set a setting value (admin use).
   */
  async set(key: string, value: string, updatedBy?: string): Promise<void> {
    await this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value, updatedBy },
      update: { value, updatedBy },
    });
    this.cache.set(key, value);
    this.logger.log(`Platform setting updated: ${key} = ${value}`);
  }

  /**
   * List all settings (admin use).
   */
  async listAll() {
    return this.prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  private async ensureCache(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheLoadedAt < this.CACHE_TTL_MS && this.cache.size > 0) {
      return;
    }
    try {
      const settings = await this.prisma.platformSetting.findMany();
      this.cache.clear();
      for (const s of settings) {
        this.cache.set(s.key, s.value);
      }
      this.cacheLoadedAt = now;
    } catch (err) {
      this.logger.warn(`Failed to load platform settings cache: ${err}`);
    }
  }
}
