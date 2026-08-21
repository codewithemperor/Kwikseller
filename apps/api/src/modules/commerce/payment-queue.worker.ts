import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QueuePayloadMap, RetryableJobError } from '../../common/services';
import { RedisService } from '../../common/services/redis.service';
import { CommerceService } from './commerce.service';

@Injectable()
export class PaymentQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentQueueWorker.name);
  private worker?: Worker<QueuePayloadMap['payments']>;

  constructor(
    private readonly redisService: RedisService,
    private readonly commerceService: CommerceService,
  ) {}

  onModuleInit() {
    const concurrency = Math.max(
      1,
      Number(process.env.PAYMENT_QUEUE_CONCURRENCY ?? 10),
    );

    this.worker = new Worker<QueuePayloadMap['payments']>(
      'payments',
      async (job) => {
        const verification = await this.commerceService.verifyPayment(
          job.data.reference,
        );

        const status = String(verification?.status ?? '').toUpperCase();
        if (status === 'PENDING') {
          throw new RetryableJobError(
            `Payment ${job.data.reference} is still pending`,
          );
        }
      },
      {
        prefix: 'kwikseller',
        connection: this.redisService.createClient('worker:payments'),
        concurrency,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Completed payment job ${job.name} (${job.id})`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Payment job ${job?.name ?? 'unknown'} (${job?.id ?? 'n/a'}) failed: ${error.message}`,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
