import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  RequestEmailOtpDto,
  RequestOtpDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyEmailOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private passwordReset: PasswordResetService,
  ) {}

  @Public()
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp({ phone: dto.phone });
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const result = await this.auth.verifyOtp({
      phone: dto.phone,
      code: dto.code,
      role: dto.role,
      name: dto.name,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return result;
  }

  @Public()
  @Post('email/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestEmailOtp(@Body() dto: RequestEmailOtpDto, @Req() req: Request) {
    return this.auth.requestEmailOtp({
      email: dto.email,
      ip: req.ip ?? null,
    });
  }

  @Public()
  @Post('email/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto, @Req() req: Request) {
    return this.auth.verifyEmailOtp({
      email: dto.email,
      otp: dto.otp,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Public()
  @Get('username-available')
  async usernameAvailable(@Query('username') username?: string) {
    return this.auth.checkUsernameAvailable(username ?? '');
  }

  @Public()
  @Get('email-available')
  async emailAvailable(@Query('email') email?: string) {
    return this.auth.checkEmailAvailable(email ?? '');
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.signup({
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      username: dto.username,
      name: dto.name,
      role: dto.role,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login({
      identifier: dto.identifier,
      password: dto.password,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Public()
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      return await this.auth.refresh(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
    @Req() req: Request,
  ) {
    return this.passwordReset.requestPasswordReset({
      email: dto.email,
      ip: req.ip ?? null,
    });
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.passwordReset.resetPassword({
      token: dto.token,
      password: dto.password,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }
}
