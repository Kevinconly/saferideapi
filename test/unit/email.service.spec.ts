import { ConfigService } from '../../src/config/config.service';
import { EmailService } from '../../src/modules/email/email.service';
import { BrevoEmailProvider } from '../../src/modules/email/providers/brevo.provider';
import { MockEmailProvider } from '../../src/modules/email/providers/mock.provider';
import { ResendEmailProvider } from '../../src/modules/email/providers/resend.provider';
import { SmtpEmailProvider } from '../../src/modules/email/providers/smtp.provider';

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const env: Record<string, string> = {
    DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/test',
    JWT_ACCESS_TOKEN_SECRET: 'access-secret',
    JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
    FRONTEND_URL: 'http://localhost:3001',
    PASSWORD_RESET_HASH_SALT: 'test-password-reset-salt',
    EMAIL_OTP_HASH_SALT: 'test-email-otp-salt',
    ...overrides,
  };
  const previous = { ...process.env };
  Object.assign(process.env, env);
  try {
    return new ConfigService();
  } finally {
    process.env = previous;
  }
}

describe('EmailService provider selection', () => {
  it('picks BrevoEmailProvider when EMAIL_PROVIDER=brevo and not mock', () => {
    const config = makeConfig({ EMAIL_PROVIDER: 'brevo', EMAIL_MOCK: 'false' });
    const service = new EmailService(config);
    expect((service as any).provider).toBeInstanceOf(BrevoEmailProvider);
  });

  it('picks SmtpEmailProvider when EMAIL_PROVIDER=smtp', () => {
    const config = makeConfig({ EMAIL_PROVIDER: 'smtp', EMAIL_MOCK: 'false' });
    const service = new EmailService(config);
    expect((service as any).provider).toBeInstanceOf(SmtpEmailProvider);
  });

  it('picks ResendEmailProvider when EMAIL_PROVIDER=resend', () => {
    const config = makeConfig({
      EMAIL_PROVIDER: 'resend',
      EMAIL_MOCK: 'false',
    });
    const service = new EmailService(config);
    expect((service as any).provider).toBeInstanceOf(ResendEmailProvider);
  });

  it('uses mock provider when EMAIL_MOCK=true even if another provider is set', () => {
    const config = makeConfig({ EMAIL_PROVIDER: 'brevo', EMAIL_MOCK: 'true' });
    const service = new EmailService(config);
    expect((service as any).provider).toBeInstanceOf(MockEmailProvider);
  });

  it('uses mock provider by default', () => {
    const config = makeConfig({});
    const service = new EmailService(config);
    expect((service as any).provider).toBeInstanceOf(MockEmailProvider);
  });
});
