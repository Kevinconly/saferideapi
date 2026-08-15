"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app_module_1 = require("./app.module");
const logger_service_1 = require("./logging/logger.service");
const config_service_1 = require("./config/config.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: false });
    const logger = new logger_service_1.Logger();
    app.useLogger(logger);
    const config = app.get(config_service_1.ConfigService);
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || config.isOriginAllowed(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
    });
    app.use((0, helmet_1.default)());
    app.use((0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 300,
        standardHeaders: true,
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    if (config.get('NODE_ENV') !== 'production' &&
        config.get('SWAGGER_ENABLED') === 'true') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('SafeRide Kigali API')
            .setDescription('SafeRide Kigali ride-hailing platform API')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('docs', app, document);
    }
    const port = config.getNumber('PORT');
    await app.listen(port);
    logger.log(`SafeRide backend listening on port ${port}`);
    process.on('SIGTERM', () => void app.close());
    process.on('SIGINT', () => void app.close());
}
void bootstrap().catch((err) => {
    console.error('Fatal error during bootstrap', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map