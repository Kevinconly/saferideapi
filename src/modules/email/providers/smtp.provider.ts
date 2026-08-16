import { Injectable, Logger } from '@nestjs/common';
import { promises as dns } from 'dns';
import { isIP } from 'net';
import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '../../../config/config.service';
import type { EmailMessage, EmailProvider } from '../email.types';

/**
 * SMTP provider (e.g. Gmail app password, Brevo, SendGrid). Uses
 * nodemailer so any SMTP endpoint works without a verified custom domain.
 *
 * nodemailer's built-in hostname resolution always queries both A and AAAA
 * records and silently falls back to IPv6, which is unreachable from some
 * cloud networks (Railway/Fly) and produces "Connection timeout" /
 * "ENETUNREACH". To avoid that we resolve the IPv4 address ourselves and
 * pass a literal IP to nodemailer (it skips its own DNS then), keeping the
 * original hostname as the TLS `servername` so certificate validation works.
 *
 * Explicit timeouts make a dead SMTP host fail fast instead of hanging the
 * request, and transient failures are retried with backoff.
 */
@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp' as const;
  private readonly logger = new Logger('SmtpEmailProvider');
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {}

  private async resolveIpv4(host: string): Promise<string> {
    if (isIP(host)) return host;
    try {
      const addresses = await dns.resolve4(host);
      if (addresses.length > 0) {
        this.logger.log(`Resolved ${host} -> ${addresses[0]}`);
        return addresses[0];
      }
    } catch (err) {
      this.logger.warn(
        `IPv4 resolution failed for ${host}: ${(err as Error).message}`,
      );
    }
    return host;
  }

  private async getTransport(): Promise<Transporter> {
    const hostname = this.config.get('SMTP_HOST');
    if (!hostname) {
      throw new Error(
        'SMTP_HOST is not set but EMAIL_PROVIDER=smtp. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM.',
      );
    }
    if (!this.transporter) {
      const host = await this.resolveIpv4(hostname);
      this.transporter = nodemailer.createTransport({
        host,
        servername: hostname,
        port: this.config.getNumber('SMTP_PORT'),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      } as Parameters<typeof nodemailer.createTransport>[0]);
    }
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const transporter = await this.getTransport();
        const info = await transporter.sendMail({
          from: this.config.get('EMAIL_FROM'),
          to: message.to,
          subject: message.subject,
          ...(message.html ? { html: message.html } : {}),
          ...(message.text ? { text: message.text } : {}),
        });
        this.logger.log(`Email sent (messageId ${info.messageId})`);
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `SMTP send attempt ${attempt}/3 failed: ${(err as Error).message}`,
        );
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        }
      }
    }
    this.logger.error(`SMTP send failed: ${(lastError as Error).message}`);
    throw new Error('Failed to send email via SMTP');
  }
}
