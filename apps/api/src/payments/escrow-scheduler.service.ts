import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EscrowService } from "./escrow.service";

/**
 * EscrowSchedulerService — drives the automatic release of escrow funds.
 * Runs hourly via @nestjs/schedule cron.
 */
@Injectable()
export class EscrowSchedulerService {
  private readonly logger = new Logger(EscrowSchedulerService.name);

  constructor(private readonly escrowService: EscrowService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processAutoRelease() {
    try {
      const result = await this.escrowService.processEscrowAutoRelease();
      if (result.processed > 0) {
        this.logger.log(
          `Escrow auto-release: ${result.processed} released, ${result.failed} failed`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Escrow auto-release cron failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
