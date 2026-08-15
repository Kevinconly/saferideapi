import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { MockEmailProvider } from './providers/mock.provider';
import { ResendEmailProvider } from './providers/resend.provider';
import { SmtpEmailProvider } from './providers/smtp.provider';
import type { EmailMessage, EmailProvider } from './email.types';

/**
 * Pluggable email delivery. Picks the provider from config:
 *  - EMAIL_MOCK=true (or EMAIL_PROVIDER=mock) -> logs to console (local dev)
 *  - EMAIL_PROVIDER=resend -> Resend REST API
 *  - EMAIL_PROVIDER=smtp -> Gmail/app-specific SMTP credentials
 */
@Injectable()
export class EmailService {
  private readonly provider: EmailProvider;

  constructor(private config: ConfigService) {
    const mock = config.get('EMAIL_MOCK') === 'true';
    const provider = config.get('EMAIL_PROVIDER');
    this.provider = mock
      ? new MockEmailProvider()
      : provider === 'resend'
        ? new ResendEmailProvider(config)
        : provider === 'smtp'
          ? new SmtpEmailProvider(config)
          : new MockEmailProvider();
  }

  async send(message: EmailMessage): Promise<void> {
    await this.provider.send(message);
  }
}
