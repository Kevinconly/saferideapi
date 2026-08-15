import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { ConfigService } from '../../config/config.service';
import { RedisService } from '../../common/redis.service';
import { EmailService } from '../email/email.service';

interface EmailOtpRecord {
  hash: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger('EmailOtpService');
  private readonly expirySeconds: number;
  private readonly maxPer60s: number;
  private readonly maxPerHour: number;
  private readonly maxFailedAttempts: number;
  private readonly salt: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
    private email: EmailService,
  ) {
    this.expirySeconds = config.getNumber('EMAIL_OTP_EXPIRY_SECONDS');
    this.maxPer60s = config.getNumber('EMAIL_OTP_MAX_PER_60S');
    this.maxPerHour = config.getNumber('EMAIL_OTP_MAX_PER_HOUR');
    this.maxFailedAttempts = config.getNumber('EMAIL_OTP_MAX_FAILED_ATTEMPTS');
    this.salt = config.get('EMAIL_OTP_HASH_SALT');
  }

  private key(email: string): string {
    return `auth:email_otp:${email}`;
  }

  private codeHash(code: string): string {
    return createHash('sha256').update(`${code}:${this.salt}`).digest('hex');
  }

  private async rateLimitCheck(
    email: string,
    ip: string | null,
  ): Promise<void> {
    const client = this.redis.getClient();

    const per60Key = `auth:email_otp:rate:60s:${email}`;
    const per60 = await client.incr(per60Key);
    if (per60 === 1) await client.expire(per60Key, 60);
    if (per60 > this.maxPer60s) {
      throw new HttpException(
        'Too many requests. Please wait before requesting a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const perHourKey = `auth:email_otp:rate:1h:${email}`;
    const perHour = await client.incr(perHourKey);
    if (perHour === 1) await client.expire(perHourKey, 3600);
    if (perHour > this.maxPerHour) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (ip) {
      const ipKey = `auth:email_otp:rate:1h:${email}:${ip}`;
      const perIp = await client.incr(ipKey);
      if (perIp === 1) await client.expire(ipKey, 3600);
      if (perIp > this.maxPerHour) {
        throw new HttpException(
          'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  async request(email: string, ip: string | null): Promise<void> {
    const normalized = normalizeEmail(email);
    await this.rateLimitCheck(normalized, ip);

    const code = String(randomInt(100000, 999999));
    const record: EmailOtpRecord = {
      hash: this.codeHash(code),
      attempts: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.expirySeconds * 1000,
    };
    await this.redis
      .getClient()
      .set(
        this.key(normalized),
        JSON.stringify(record),
        'EX',
        this.expirySeconds,
      );

    await this.email.send({
      to: normalized,
      subject: 'SafeRide verification code',
      text: `Your SafeRide verification code is ${code}. It expires in ${Math.floor(
        this.expirySeconds / 60,
      )} minutes. Do not share this code.`,
    });
  }

  /**
   * Verifies a submitted code. Every failed attempt increments the counter;
   * once the max is reached the record is deleted and further verification is
   * impossible until a new code is requested. Uses timing-safe comparison.
   */
  async verify(email: string, code: string): Promise<boolean> {
    const normalized = normalizeEmail(email);
    const client = this.redis.getClient();
    const raw = await client.get(this.key(normalized));
    if (!raw) return false;

    const record: EmailOtpRecord = JSON.parse(raw);
    if (record.expiresAt < Date.now()) {
      await client.del(this.key(normalized));
      return false;
    }
    if (record.attempts >= this.maxFailedAttempts) {
      await client.del(this.key(normalized));
      return false;
    }

    const candidate = Buffer.from(this.codeHash(code.trim()), 'hex');
    const expected = Buffer.from(record.hash, 'hex');
    const ok =
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected);

    if (!ok) {
      record.attempts += 1;
      if (record.attempts >= this.maxFailedAttempts) {
        await client.del(this.key(normalized));
      } else {
        await client.set(
          this.key(normalized),
          JSON.stringify(record),
          'EX',
          this.expirySeconds,
        );
      }
      return false;
    }

    await client.del(this.key(normalized));
    return true;
  }
}
