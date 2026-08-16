import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { TokenService } from './token.service';
import { hashPassword } from './auth.service';
import { normalizeEmail } from './email-otp.service';

interface PasswordResetRecord {
  email: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Email-based password reset.
 *
 * Security properties:
 *  - Reset tokens are 32 random bytes, stored in Redis as a SHA-256 hash with a
 *    short TTL, so a leaked cache/DB cannot be replayed into a working token.
 *  - Tokens are single-use and consumed before the password is changed.
 *  - Responses are identical for known and unknown emails (no enumeration).
 *  - Per-email and per-IP rate limits are enforced before any work happens.
 *  - On success all of the user's refresh tokens are revoked and tokenVersion is
 *    bumped, which also invalidates every outstanding access token.
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger('PasswordResetService');
  private readonly expirySeconds: number;
  private readonly maxPerHour: number;
  private readonly salt: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
    private email: EmailService,
    private prisma: PrismaService,
    private audit: AuditService,
    private tokens: TokenService,
  ) {
    this.expirySeconds = config.getNumber(
      'PASSWORD_RESET_TOKEN_EXPIRY_SECONDS',
    );
    this.maxPerHour = config.getNumber('PASSWORD_RESET_MAX_PER_HOUR');
    this.salt = config.get('PASSWORD_RESET_HASH_SALT');
  }

  private resetUrl(): string {
    const override = this.config.get('PASSWORD_RESET_URL')?.trim();
    if (override) return override;
    return `${this.config.get('FRONTEND_URL')}/auth/reset-password`;
  }

  private tokenKey(tokenHash: string): string {
    return `auth:pwd_reset:token:${tokenHash}`;
  }

  private tokenHash(token: string): string {
    return createHash('sha256').update(`${token}:${this.salt}`).digest('hex');
  }

  private async rateLimitCheck(
    email: string,
    ip: string | null,
  ): Promise<void> {
    const client = this.redis.getClient();

    const perEmailKey = `auth:pwd_reset:rate:1h:${email}`;
    const perEmail = await client.incr(perEmailKey);
    if (perEmail === 1) await client.expire(perEmailKey, 3600);
    if (perEmail > this.maxPerHour) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (ip) {
      const ipKey = `auth:pwd_reset:rate:1h:${ip}`;
      const perIp = await client.incr(ipKey);
      if (perIp === 1) await client.expire(ipKey, 3600);
      if (perIp > this.maxPerHour * 3) {
        throw new HttpException(
          'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  /**
   * Requests a password reset link. Always responds with the same message
   * whether or not the email belongs to an account (no user enumeration).
   */
  async requestPasswordReset(input: {
    email: string;
    ip?: string | null;
  }): Promise<{ success: true; message: string }> {
    const email = normalizeEmail(input.email);
    await this.rateLimitCheck(email, input.ip ?? null);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });

    if (user && user.status !== 'SUSPENDED') {
      const token = randomBytes(32).toString('base64url');
      const record: PasswordResetRecord = {
        email,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.expirySeconds * 1000,
      };
      await this.redis
        .getClient()
        .set(
          this.tokenKey(this.tokenHash(token)),
          JSON.stringify(record),
          'EX',
          this.expirySeconds,
        );

      const link = `${this.resetUrl()}?token=${encodeURIComponent(token)}`;
      try {
        await this.email.send({
          to: email,
          subject: 'SafeRide password reset',
          text: `You requested to reset your SafeRide password. Open the link below within ${Math.floor(
            this.expirySeconds / 60,
          )} minutes to choose a new password. If you did not request this, you can safely ignore this email.\n\n${link}`,
          html: `<p>You requested to reset your SafeRide password.</p><p>Open the link below within <strong>${Math.floor(
            this.expirySeconds / 60,
          )} minutes</strong> to choose a new password:</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
        });
      } catch (err) {
        await this.redis
          .getClient()
          .del(this.tokenKey(this.tokenHash(token)))
          .catch(() => undefined);
        this.logger.error('Password reset email send failed', err);
        throw new ServiceUnavailableException(
          'Email service is temporarily unavailable. Please try again in a few minutes.',
        );
      }
    }

    return {
      success: true,
      message:
        'If an account exists for this email, a password reset link has been sent.',
    };
  }

  /**
   * Completes a password reset. The token is single-use and is consumed before
   * the password is changed, so it can never be replayed.
   */
  async resetPassword(input: {
    token: string;
    password: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ success: true }> {
    const tokenKey = this.tokenKey(this.tokenHash(input.token.trim()));
    const client = this.redis.getClient();
    const raw = await client.get(tokenKey);
    if (!raw) {
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }

    let record: PasswordResetRecord;
    try {
      record = JSON.parse(raw) as PasswordResetRecord;
    } catch {
      await client.del(tokenKey);
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }

    if (record.expiresAt < Date.now()) {
      await client.del(tokenKey);
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }

    // Single-use: consume before mutating so a replay can never reset twice.
    await client.del(tokenKey);

    const user = await this.prisma.user.findUnique({
      where: { email: record.email },
    });
    if (!user) {
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(input.password),
        tokenVersion: { increment: 1 },
      },
    });

    // Invalidate every active session.
    await this.tokens.revokeUserRefreshTokens(user.id);

    await this.audit.record({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.password_reset',
      entityType: 'User',
      entityId: user.id,
      metadata: { method: 'email' },
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return { success: true };
  }
}
