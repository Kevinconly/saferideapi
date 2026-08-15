import { ApiProperty } from '@nestjs/swagger';
import { RideStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRideDto {
  @ApiProperty({ example: -1.9501 })
  @IsNumber()
  pickupLat: number;

  @ApiProperty({ example: 30.0619 })
  @IsNumber()
  pickupLng: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pickupLabel?: string;

  @ApiProperty({ example: -1.9441 })
  @IsNumber()
  dropoffLat: number;

  @ApiProperty({ example: 30.0922 })
  @IsNumber()
  dropoffLng: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dropoffLabel?: string;
}

export class CancelRideDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class AcceptRideDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerId: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class UpdateRideStatusDto {
  @ApiProperty({ example: 'PICKED_UP', enum: RideStatus })
  @IsEnum(RideStatus)
  @IsNotEmpty()
  newState: RideStatus;
}

export class RejectRideDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerId: string;
}

export class FareEstimateQueryDto {
  @ApiProperty({ example: -1.9501 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat: number;

  @ApiProperty({ example: 30.0619 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng: number;

  @ApiProperty({ example: -1.9441 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLat: number;

  @ApiProperty({ example: 30.0922 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLng: number;
}
