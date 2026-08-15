import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import type { EmailMessage, EmailProvider } from '../email.types';

/**
 * Production provider backed by Resend's REST API. Uses the global fetch so
 * no extra SDK dependency is required.
 */
@Injectable()
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend' as const;
  private readonly logger = new Logger('ResendEmailProvider');

  constructor(private config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const apiKey = this.config.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not set but EMAIL_PROVIDER=resend. Set the key or use EMAIL_MOCK=true.',
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.get('EMAIL_FROM'),
        to: [message.to],
        subject: message.subject,
        ...(message.html ? { html: message.html } : {}),
        ...(message.text ? { text: message.text } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Resend API error ${res.status}: ${body}`);
      throw new Error(`Failed to send email (Resend status ${res.status})`);
    }
  }
}
