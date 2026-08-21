import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { EmailService } from './email.service';
import { QueuePayloadMap, RetryableJobError } from './job-queue.service';
import { RedisService } from './redis.service';

@Injectable()
export class EmailQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailQueueWorker.name);
  private worker?: Worker<QueuePayloadMap['emails']>;

  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    const concurrency = Math.max(
      1,
      Number(process.env.EMAIL_QUEUE_CONCURRENCY ?? 10),
    );

    this.worker = new Worker<QueuePayloadMap['emails']>(
      'emails',
      async (job) => {
        const response = await this.emailService.sendEmail(
          job.data.to,
          job.data.subject,
          job.data.template,
          job.data.variables,
        );

        if (!response.success) {
          throw new RetryableJobError(response.error ?? 'Email sending failed');
        }
      },
      {
        prefix: 'kwikseller',
        connection: this.redisService.createClient('worker:emails'),
        concurrency,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Completed email job ${job.name} (${job.id})`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Email job ${job?.name ?? 'unknown'} (${job?.id ?? 'n/a'}) failed: ${error.message}`,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
