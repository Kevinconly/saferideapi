import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OtpService } from './otp.service';
import { EmailOtpService, normalizeEmail } from './email-otp.service';
import { TokenService, TokenPair } from './token.service';

export function normalizePhone(input: string): string {
  const phone = input.replace(/[\s-]/g, '');
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('00')) return `+${phone.slice(2)}`;
  if (phone.startsWith('0')) return `+250${phone.slice(1)}`;
  if (phone.startsWith('7')) return `+250${phone}`;
  return `+${phone}`;
}

function isPhoneIdentifier(input: string): boolean {
  return /^\s*(?:\+|00)?[0-9][0-9\s-]{5,18}\s*$/.test(input);
}

function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private otp: OtpService,
    private tokens: TokenService,
    private audit: AuditService,
    private config: ConfigService,
    private emailOtp: EmailOtpService,
  ) {}

  async requestOtp(input: {
    phone: string;
  }): Promise<{ sent: boolean; mode: 'code' | 'auto'; devCode?: string }> {
    const phone = normalizePhone(input.phone);
    const { code, devCode } = await this.otp.generate(phone);

    // TODO: integrate real SMS provider. devCode is returned only when SMS_MOCK=true.
    if (this.config.get('SMS_MOCK') !== 'true') {
      console.log(`[SMS][mock off] OTP for ${phone}: ${code}`);
    }

    const mode = this.otp.isAutoVerify() ? 'auto' : 'code';
    return { sent: true, mode, devCode: devCode ? code : undefined };
  }

  async signup(input: {
    email: string;
    password: string;
    phone?: string;
    username?: string;
    name?: string;
    role?: 'PASSENGER' | 'DRIVER';
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ user: unknown; tokens: TokenPair }> {
    const email = normalizeEmail(input.email);
    const searchFilters = [{ email }] as Array<{
      phone?: string;
      email?: string;
      username?: string;
    }>;
    if (input.phone) {
      searchFilters.push({ phone: normalizePhone(input.phone) });
    }
    if (input.username) {
      searchFilters.push({ username: normalizeUsername(input.username) });
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: searchFilters },
    });
    if (existing) {
      throw new ConflictException(
        'An account with this email, phone, or username already exists',
      );
    }

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          phone: input.phone ? normalizePhone(input.phone) : null,
          username: input.username ? normalizeUsername(input.username) : null,
          name: input.name ?? null,
          role: input.role ?? 'PASSENGER',
          passwordHash: hashPassword(input.password),
          status: 'ACTIVE',
          // Keep signup non-blocking (passengers can book immediately, same as
          // the deployed flow). Email confirmation is tracked via isEmailVerified.
          isVerified: true,
          isPhoneVerified: false,
          isEmailVerified: false,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email, phone, or username already exists',
        );
      }
      throw err;
    }

    try {
      await this.ensureDriverProfile(user.id, user.role);
      const tokens = await this.createSession(user);
      await this.audit.record({
        actorId: user.id,
        actorRole: user.role,
        action: 'auth.signup',
        entityType: 'User',
        entityId: user.id,
        ip: input.ip,
        userAgent: input.userAgent,
      });

      return {
        user: this.sanitize(user),
        tokens,
      };
    } catch (err) {
      await this.prisma.driver
        .deleteMany({ where: { userId: user.id } })
        .catch(() => undefined);
      await this.prisma.user
        .delete({ where: { id: user.id } })
        .catch(() => undefined);
      throw err;
    }
  }

  async verifyOtp(input: {
    phone: string;
    code?: string;
    role?: 'PASSENGER' | 'DRIVER';
    name?: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ user: unknown; tokens: TokenPair }> {
    const phone = normalizePhone(input.phone);
    const valid = await this.otp.verify(phone, input.code ?? '');
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');

    let user = await this.prisma.user.findFirst({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: input.name ?? null,
          role: input.role ?? 'PASSENGER',
          isVerified: true,
          isPhoneVerified: true,
        },
      });
      await this.ensureDriverProfile(user.id, user.role);
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          isPhoneVerified: true,
          deletedAt: null,
        },
      });
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    const tokens = await this.createSession(user);

    await this.audit.record({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.verify_otp',
      entityType: 'User',
      entityId: user.id,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return {
      user: this.sanitize(user),
      tokens,
    };
  }

  /**
   * Requests an email verification code. Responds identically whether the
   * email is known or not (no user enumeration).
   */
  async requestEmailOtp(input: {
    email: string;
    ip?: string | null;
  }): Promise<{ success: true; message: string }> {
    const email = normalizeEmail(input.email);
    await this.emailOtp.request(email, input.ip ?? null);
    return {
      success: true,
      message: 'If this email is eligible, a verification code has been sent.',
    };
  }

  /**
   * Verifies an email OTP. On success marks the user's email as verified and
   * issues a fresh token pair.
   */
  async verifyEmailOtp(input: {
    email: string;
    otp: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{
    success: true;
    user: { id: string; email: string; isEmailVerified: boolean };
    accessToken: string;
    refreshToken: string;
  }> {
    const email = normalizeEmail(input.email);
    const valid = await this.emailOtp.verify(email, input.otp);
    if (!valid) {
      throw new BadRequestException(
        'Invalid or expired code. Please request a new code.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException(
        'Invalid or expired code. Please request a new code.',
      );
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifiedAt: new Date() },
    });

    const tokens = await this.createSession(updated);

    await this.audit.record({
      actorId: updated.id,
      actorRole: updated.role,
      action: 'auth.verify_email_otp',
      entityType: 'User',
      entityId: updated.id,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return {
      success: true,
      user: {
        id: updated.id,
        email: updated.email ?? email,
        isEmailVerified: true,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(input: {
    identifier: string;
    password?: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ user: unknown; tokens: TokenPair }> {
    const identifier = input.identifier.trim();
    const searchFilters = [] as Array<{
      phone?: string;
      email?: string;
      username?: string;
    }>;
    if (isPhoneIdentifier(identifier)) {
      searchFilters.push({ phone: normalizePhone(identifier) });
    }
    if (identifier.includes('@')) {
      searchFilters.push({ email: identifier.toLowerCase() });
    }
    searchFilters.push({ username: normalizeUsername(identifier) });

    const user = await this.prisma.user.findFirst({
      where: { OR: searchFilters },
    });
    if (!user) throw new UnauthorizedException('Account not found');

    if (!user.passwordHash || !input.password) {
      throw new UnauthorizedException('Password is required to login');
    }

    const ok = verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    const tokens = await this.createSession(user);

    await this.audit.record({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return {
      user: this.sanitize(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    return this.tokens.rotateRefreshToken(refreshToken);
  }

  async checkUsernameAvailable(username: string): Promise<{
    available: boolean;
    normalized?: string;
    suggestions?: string[];
  }> {
    const normalized = normalizeUsername(username);
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      return { available: false, suggestions: [] };
    }

    const taken = await this.prisma.user.findFirst({
      where: { username: normalized },
      select: { id: true },
    });
    if (!taken) {
      return { available: true, normalized };
    }

    const suggestions: string[] = [];
    const base = normalized.length <= 16 ? normalized : normalized.slice(0, 16);
    for (let i = 1; suggestions.length < 3 && i <= 5; i += 1) {
      const candidate = `${base}_${i}`;
      const conflict = await this.prisma.user.findFirst({
        where: { username: candidate },
        select: { id: true },
      });
      if (!conflict) suggestions.push(candidate);
    }

    return { available: false, normalized, suggestions };
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });
    if (!existing) return;

    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revoked: false },
        data: { revoked: true },
      }),
      this.prisma.user.update({
        where: { id: existing.userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);

    await this.audit.record({
      actorId: existing.userId,
      action: 'auth.logout',
      entityType: 'User',
      entityId: existing.userId,
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driver: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitize(user);
  }

  private async ensureDriverProfile(userId: string, role?: string | null) {
    if (role !== 'DRIVER') return;
    const existing = await this.prisma.driver.findUnique({ where: { userId } });
    if (existing) return;
    await this.prisma.driver.create({
      data: {
        userId,
        status: 'PENDING',
        isVerified: false,
      },
    });
  }

  private async createSession(user: {
    id: string;
    role: string;
    phone?: string | null;
    email?: string | null;
  }): Promise<TokenPair> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    await this.tokens.revokeUserRefreshTokens(user.id);
    const refreshToken = await this.tokens.createRefreshToken(user.id);
    const accessToken = await this.tokens.issueAccessToken({
      id: updatedUser.id,
      role: updatedUser.role,
      phone: updatedUser.phone ?? undefined,
      email: updatedUser.email ?? undefined,
      tokenVersion: updatedUser.tokenVersion,
    });

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: refreshToken.expiresInMs,
    };
  }

  private sanitize(user: {
    id: string;
    phone?: string | null;
    username?: string | null;
    email?: string | null;
    name?: string | null;
    role: string;
    isVerified: boolean;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
    status: string;
    driver?: unknown;
  }) {
    return {
      id: user.id,
      phone: user.phone ?? null,
      username: user.username ?? null,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role,
      isVerified: user.isVerified,
      isPhoneVerified: user.isPhoneVerified ?? false,
      isEmailVerified: user.isEmailVerified ?? false,
      status: user.status,
      driver: user.driver ?? null,
    };
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}
