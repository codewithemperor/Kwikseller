import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, JobsOptions, Queue } from 'bullmq';
import { RedisService } from './redis.service';

export type QueueName = 'emails' | 'payments';

export type QueuePayloadMap = {
  emails: {
    to: string | string[];
    subject: string;
    template: string;
    variables: Record<string, unknown>;
  };
  payments: {
    reference: string;
  };
};

export interface AddJobOptions {
  delaySeconds?: number;
  attempts?: number;
  backoffSeconds?: number;
}

export class RetryableJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableJobError';
  }
}

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly queues: Record<QueueName, Queue>;

  constructor(private readonly redisService: RedisService) {
    this.queues = {
      emails: new Queue('emails', {
        prefix: 'kwikseller',
        connection: this.redisService.createClient('queue:emails'),
      }),
      payments: new Queue('payments', {
        prefix: 'kwikseller',
        connection: this.redisService.createClient('queue:payments'),
      }),
    };
  }

  private queueOptions(options: AddJobOptions = {}): JobsOptions {
    const delaySeconds = Math.max(0, Math.floor(options.delaySeconds ?? 0));
    const attempts = Math.max(1, Math.floor(options.attempts ?? 5));
    const backoffSeconds = Math.max(1, Math.floor(options.backoffSeconds ?? 30));

    return {
      attempts,
      delay: delaySeconds * 1000,
      backoff: {
        type: 'exponential',
        delay: backoffSeconds * 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: false,
    };
  }

  async add<T extends QueueName>(
    queueName: T,
    name: string,
    payload: QueuePayloadMap[T],
    options: AddJobOptions = {},
  ) {
    const queue = this.queues[queueName];
    const job = await queue.add(name, payload, this.queueOptions(options));
    this.logger.debug(`Queued job ${job.name} (${job.id}) on ${queueName}`);
    return job;
  }

  async enqueueEmail(
    payload: QueuePayloadMap['emails'],
    options: AddJobOptions = {},
  ) {
    return this.add('emails', 'email.send', payload, {
      attempts: 5,
      backoffSeconds: 60,
      ...options,
    });
  }

  async enqueuePaymentVerification(
    payload: QueuePayloadMap['payments'],
    options: AddJobOptions = {},
  ) {
    return this.add('payments', 'payment.verify', payload, {
      attempts: 8,
      backoffSeconds: 120,
      delaySeconds: 180,
      ...options,
    });
  }

  getQueue(queueName: QueueName) {
    return this.queues[queueName];
  }

  async onModuleDestroy() {
    await Promise.all(
      Object.values(this.queues).map((queue) => queue.close()),
    );
  }
}

export type QueueJob<T> = Job<T>;
