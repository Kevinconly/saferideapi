import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { EmailOtpService } from './email-otp.service';
import { TokenService } from './token.service';
import { PasswordResetService } from './password-reset.service';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { AuthSeedService } from './auth-seed.service';

@Module({
  imports: [AuditModule, EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    EmailOtpService,
    TokenService,
    PasswordResetService,
    AuthSeedService,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
