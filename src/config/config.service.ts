import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional().default(''),
  FRONTEND_ORIGIN: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),

  JWT_ACCESS_TOKEN_SECRET: z.string().min(1),
  JWT_REFRESH_TOKEN_SECRET: z.string().min(1),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  OTP_MAX_PER_HOUR: z.coerce.number().default(5),
  OTP_MAX_PER_DAY_PER_IP: z.coerce.number().default(20),
  OTP_MAX_FAILED_ATTEMPTS: z.coerce.number().default(5),

  // Email OTP (Resend) delivery
  EMAIL_PROVIDER: z.enum(['resend', 'smtp', 'brevo', 'mock']).default('mock'),
  RESEND_API_KEY: z.string().optional().default(''),
  // Brevo REST API delivery (EMAIL_PROVIDER=brevo): uses the v3 API key
  // (Settings -> API Keys), NOT the SMTP key. HTTPS so it works from clouds
  // that block outbound SMTP.
  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_NAME: z.string().default('SafeRide Kigali'),
  BREVO_SENDER_EMAIL: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('SafeRide Kigali <no-reply@saferide.rw>'),
  // When true, the code is logged to the console instead of sent (local dev).
  EMAIL_MOCK: z.enum(['true', 'false']).default('true'),
  // SMTP delivery (EMAIL_PROVIDER=smtp): Gmail app password, Brevo, SendGrid...
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  EMAIL_OTP_MAX_PER_60S: z.coerce.number().default(1),
  EMAIL_OTP_MAX_PER_HOUR: z.coerce.number().default(5),
  EMAIL_OTP_MAX_FAILED_ATTEMPTS: z.coerce.number().default(5),
  // App-level salt mixed into the OTP hash before it is stored.
  EMAIL_OTP_HASH_SALT: z.string().default('saferide-email-otp'),

  // Password reset (email magic-link token)
  PASSWORD_RESET_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(900),
  PASSWORD_RESET_MAX_PER_HOUR: z.coerce.number().default(5),
  PASSWORD_RESET_HASH_SALT: z.string().default('saferide-password-reset'),
  // Full reset URL template override (e.g. https://saferide.rw/auth/reset-password).
  // Falls back to FRONTEND_URL + '/auth/reset-password' when empty.
  PASSWORD_RESET_URL: z.string().optional().default(''),

  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:ops@saferide.rw'),

  SWAGGER_ENABLED: z.string().default('true'),
  LOG_LEVEL: z.string().default('info'),

  FRONTEND_URL: z.string().default('http://localhost:3001'),
  ADMIN_URL: z.string().default('http://localhost:3001/admin'),

  SMS_MOCK: z.string().default('true'),
  // When true and no real SMS provider is wired up (SMS_MOCK != 'true'),
  // OTP verification auto-succeeds so signup never blocks users.
  OTP_AUTO_VERIFY: z.enum(['true', 'false']).default('true'),

  SANDBOX_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_POLL_INTERVAL_MS: z.coerce.number().default(3000),
  PAYMENT_AUTO_CONFIRM_MS: z.coerce.number().default(5000),
});

export type AppConfig = z.infer<typeof envSchema>;

@Injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error('Invalid environment variables', parsed.error.format());
      throw new Error('Invalid environment variables');
    }
    this.config = parsed.data;
  }

  get<T extends keyof AppConfig>(key: T): AppConfig[T] {
    return this.config[key];
  }

  getNumber(key: keyof AppConfig): number {
    const val = this.get(key);
    return Number(val);
  }

  getCorsOrigins(): string[] {
    const fromOrigin = this.config.FRONTEND_ORIGIN;
    const fromList = this.config.CORS_ORIGINS;
    if (fromList) {
      return fromList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (fromOrigin) return [fromOrigin];
    return ['http://localhost:3001'];
  }

  isOriginAllowed(origin: string): boolean {
    const allowed = this.getCorsOrigins();
    if (allowed.includes(origin)) return true;
    // Allow any Vercel deployment/preview subdomain. Vercel preview URLs are
    // ephemeral (e.g. <project>-<hash>-<uid>.vercel.app) and change on every
    // deploy, so they cannot be enumerated in CORS_ORIGINS.
    return origin.endsWith('.vercel.app');
  }
}
