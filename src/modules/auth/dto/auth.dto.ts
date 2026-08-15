import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+2507XXXXXXXX' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+2507XXXXXXXX' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;

  @IsOptional()
  @IsIn(['PASSENGER', 'DRIVER'])
  role?: 'PASSENGER' | 'DRIVER';

  @IsOptional()
  @IsString()
  name?: string;
}

export class RequestEmailOtpDto {
  @ApiProperty({ example: 'customer@saferide.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;
}

export class VerifyEmailOtpDto {
  @ApiProperty({ example: 'customer@saferide.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'customer@saferide.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ required: false, example: '+2507XXXXXXXX' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password!: string;

  @ApiProperty({ required: false, example: 'admin' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  username?: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    required: false,
    example: 'PASSENGER',
    enum: ['PASSENGER', 'DRIVER'],
  })
  @IsOptional()
  @IsIn(['PASSENGER', 'DRIVER'])
  role?: 'PASSENGER' | 'DRIVER';
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  refreshToken!: string;
}
