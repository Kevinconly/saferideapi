"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../../src/app.module");
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
const prisma_service_1 = require("../../src/prisma/prisma.service");
const redis_service_1 = require("../../src/common/redis.service");
const realtime_service_1 = require("../../src/modules/websocket/realtime.service");
const rides_service_1 = require("../../src/modules/rides/rides.service");
const dispatch_service_1 = require("../../src/modules/rides/dispatch.service");
const outbox_service_1 = require("../../src/modules/outbox/outbox.service");
const notification_service_1 = require("../../src/modules/notifications/notification.service");
const socket_gateway_1 = require("../../src/modules/websocket/socket.gateway");
describe('AppModule DI graph', () => {
    it('resolves every provider without a database', async () => {
        const prismaMock = {
            $connect: jest.fn(),
            $disconnect: jest.fn(),
            user: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
            driver: { findFirst: jest.fn(), findUnique: jest.fn() },
            ride: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                count: jest.fn(),
            },
            rideEvent: { create: jest.fn() },
            payment: { create: jest.fn() },
            outbox: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
            notification: {
                create: jest.fn(),
                findMany: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
                count: jest.fn(),
            },
            notificationSubscription: {
                upsert: jest.fn(),
                findMany: jest.fn(),
                updateMany: jest.fn(),
            },
            refreshToken: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
            },
            auditLog: { create: jest.fn() },
            $transaction: jest.fn((fn) => fn({})),
        };
        const redisMock = {
            getClient: jest.fn().mockReturnValue({
                incr: jest.fn().mockResolvedValue(1),
                expire: jest.fn().mockResolvedValue(1),
                set: jest.fn().mockResolvedValue('OK'),
                get: jest.fn().mockResolvedValue(null),
                del: jest.fn().mockResolvedValue(1),
                ping: jest.fn().mockResolvedValue('PONG'),
            }),
        };
        const moduleRef = await testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(prismaMock)
            .overrideProvider(redis_service_1.RedisService)
            .useValue(redisMock)
            .compile();
        const app = moduleRef.createNestApplication();
        await app.init();
        expect(moduleRef.get(rides_service_1.RidesService)).toBeDefined();
        expect(moduleRef.get(dispatch_service_1.DispatchService)).toBeDefined();
        expect(moduleRef.get(outbox_service_1.OutboxService)).toBeDefined();
        expect(moduleRef.get(notification_service_1.NotificationService)).toBeDefined();
        expect(moduleRef.get(realtime_service_1.RealtimeService)).toBeDefined();
        expect(moduleRef.get(socket_gateway_1.SocketGateway)).toBeDefined();
        await app.close();
    });
});
//# sourceMappingURL=app-di.spec.js.map