import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogInput {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          changes: input.changes ? JSON.stringify(input.changes) : null,
          ipAddress: input.ipAddress,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }

  async getAuditTrail(
    entity: string,
    entityId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entity, entityId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { entity, entityId } }),
    ]);

    return {
      data: logs.map((log) => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
