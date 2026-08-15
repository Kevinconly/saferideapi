import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '../../../config/config.service';
import type { EmailMessage, EmailProvider } from '../email.types';

/**
 * SMTP provider (e.g. Gmail app password, Brevo, SendGrid). Uses
 * nodemailer so any SMTP endpoint works without a verified custom domain.
 */
@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp' as const;
  private readonly logger = new Logger('SmtpEmailProvider');
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {}

  private getTransport(): Transporter {
    const host = this.config.get('SMTP_HOST');
    if (!host) {
      throw new Error(
        'SMTP_HOST is not set but EMAIL_PROVIDER=smtp. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM.',
      );
    }
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.getNumber('SMTP_PORT'),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      const info = await this.getTransport().sendMail({
        from: this.config.get('EMAIL_FROM'),
        to: message.to,
        subject: message.subject,
        ...(message.html ? { html: message.html } : {}),
        ...(message.text ? { text: message.text } : {}),
      });
      this.logger.log(`Email sent (messageId ${info.messageId})`);
    } catch (err) {
      this.logger.error(`SMTP send failed: ${(err as Error).message}`);
      throw new Error('Failed to send email via SMTP');
    }
  }
}
