import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { Logger } from './logging/logger.service';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
  });
  const logger = new Logger();
  app.useLogger(logger);
  const config = app.get(ConfigService);

  // Trust Railway reverse proxy (fixes express-rate-limit ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error)
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || config.isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });

  // Security middleware
  app.use(helmet());

  // Rate limiting with per-endpoint caps. A single limiter with a path-aware
  // `max` avoids express-rate-limit's ERR_ERL_DOUBLE_COUNT validation that
  // fires when multiple limiter instances match the same request.
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: (request: { path?: string }) => {
        const path = request.path ?? '';
        if (path.startsWith('/api/v1/auth/email/request-otp')) return 5;
        if (path.startsWith('/api/v1/auth/email/verify-otp')) return 10;
        if (path.startsWith('/api/v1/auth/login')) return 10;
        if (path.startsWith('/api/v1/auth/request-otp')) return 5;
        if (path.startsWith('/api/v1/auth/username-available')) return 60;
        if (path.startsWith('/api/v1/auth/verify-otp')) return 10;
        if (path.startsWith('/api/v1/auth/token/refresh')) return 30;
        if (path.startsWith('/api/v1/health')) return 1000;
        return 300;
      },
      standardHeaders: true,
    }),
  );

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API documentation (non-production)
  if (
    config.get('NODE_ENV') !== 'production' &&
    config.get('SWAGGER_ENABLED') === 'true'
  ) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SafeRide Kigali API')
      .setDescription('SafeRide Kigali ride-hailing platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
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
