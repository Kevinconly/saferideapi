import { Injectable } from '@nestjs/common';
import type { EmailMessage, EmailProvider } from '../email.types';

/**
 * Zero-cost local provider. Logs the message payload so OTP codes are
 * visible in the terminal during development/tests.
 */
@Injectable()
export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock' as const;

  async send(message: EmailMessage): Promise<void> {
    console.log(
      `[DEV_EMAIL_MOCK] To: ${message.to} | Subject: ${message.subject}`,
    );
    if (message.text) {
      console.log(`[DEV_EMAIL_MOCK] ${message.text}`);
    }
  }
}
