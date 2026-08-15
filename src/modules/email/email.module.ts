import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ResendEmailProvider } from './providers/resend.provider';
import { SmtpEmailProvider } from './providers/smtp.provider';

@Module({
  providers: [EmailService, ResendEmailProvider, SmtpEmailProvider],
  exports: [EmailService],
})
export class EmailModule {}
