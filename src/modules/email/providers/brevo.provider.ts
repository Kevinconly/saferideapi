import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import type { EmailMessage, EmailProvider } from '../email.types';

/**
 * Production provider backed by Brevo's transactional email REST API
 * (https://api.brevo.com/v3/smtp/email). Uses the global fetch so no SDK is
 * needed, and it runs over HTTPS (port 443) which cloud egress filters
 * (Railway blocks outbound SMTP/587/465) always allow.
 *
 * Requires the Brevo v3 API key (Settings -> API Keys), NOT the SMTP key.
 * The sender (BREVO_SENDER_EMAIL + name) must be verified in Brevo or the
 * API rejects with 400 ("Sender not allowed").
 */
@Injectable()
export class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo' as const;
  private readonly logger = new Logger('BrevoEmailProvider');

  constructor(private config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const apiKey = this.config.get('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error(
        'BREVO_API_KEY is not set but EMAIL_PROVIDER=brevo. Set the key (v3 API key, not SMTP key) or use EMAIL_MOCK=true.',
      );
    }

    const senderName = this.config.get('BREVO_SENDER_NAME');
    const senderEmail = this.config.get('BREVO_SENDER_EMAIL');
    if (!senderEmail) {
      throw new Error(
        'BREVO_SENDER_EMAIL is not set but EMAIL_PROVIDER=brevo. Set it to a verified Brevo sender.',
      );
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: message.to }],
        subject: message.subject,
        ...(message.html ? { htmlContent: message.html } : {}),
        ...(message.text ? { textContent: message.text } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Brevo API error ${res.status}: ${body}`);
      throw new Error(`Failed to send email (Brevo status ${res.status})`);
    }
  }
}
