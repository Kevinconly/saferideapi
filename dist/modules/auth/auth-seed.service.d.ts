import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
export declare class AuthSeedService implements OnModuleInit {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: ConfigService);
    onModuleInit(): Promise<void>;
    private hasPrismaModels;
    private seedDefaultUser;
}
