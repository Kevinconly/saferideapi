import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BrevoEmailProvider } from './providers/brevo.provider';
import { ResendEmailProvider } from './providers/resend.provider';
import { SmtpEmailProvider } from './providers/smtp.provider';

@Module({
  providers: [
    EmailService,
    BrevoEmailProvider,
    ResendEmailProvider,
    SmtpEmailProvider,
  ],
  exports: [EmailService],
})
export class EmailModule {}
