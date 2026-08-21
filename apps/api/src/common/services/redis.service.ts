import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisUrl: string;
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl =
      this.configService.get<string>('redis.url') ??
      process.env.REDIS_URL ??
      'redis://localhost:6379';

    this.client = new Redis(this.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to Redis at ${this.redisUrl}`);
    });

    this.client.on('error', (error) => {
      this.logger.error(
        `Redis error: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }

  getClient() {
    return this.client;
  }

  createClient(connectionName?: string) {
    return new Redis(this.redisUrl, {
      connectionName,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => this.client.disconnect());
  }
}
