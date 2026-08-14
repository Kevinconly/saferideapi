import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('PrismaService');

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      this.logger.error(
        'Failed to connect to MongoDB. Verify DATABASE_URL and that the deployment network is allowed in MongoDB Atlas (Network Access).',
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
