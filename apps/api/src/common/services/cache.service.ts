import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

export interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisReady()) {
      try {
        const value = await this.redis.get(this.redisKey(key));
        return value ? (JSON.parse(value) as T) : null;
      } catch (error) {
        this.logger.warn(
          `Redis cache read failed for ${key}: ${this.getErrorMessage(error)}`,
        );
      }
    }

    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    if (this.isRedisReady()) {
      try {
        await this.redis.set(
          this.redisKey(key),
          JSON.stringify(value),
          'EX',
          Math.max(1, Math.floor(ttlSeconds)),
        );
        return;
      } catch (error) {
        this.logger.warn(
          `Redis cache write failed for ${key}: ${this.getErrorMessage(error)}`,
        );
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisReady()) {
      try {
        await this.redis.del(this.redisKey(key));
      } catch (error) {
        this.logger.warn(
          `Redis cache delete failed for ${key}: ${this.getErrorMessage(error)}`,
        );
      }
    }

    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (this.isRedisReady()) {
      try {
        const redisPattern = this.redisKey(pattern.replace(/\*/g, '*'));
        const keys = await this.redis.keys(redisPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        this.logger.warn(
          `Redis cache pattern delete failed for ${pattern}: ${this.getErrorMessage(error)}`,
        );
      }
    }

    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private isRedisReady(): boolean {
    return this.redis.status === 'ready';
  }

  private redisKey(key: string): string {
    return `cache:${key}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
