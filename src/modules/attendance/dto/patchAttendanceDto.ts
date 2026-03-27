import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import docs from '../attendance.docs';

export class PatchAttendanceDto {
  @ApiProperty(docs.checkoutTime)
  @IsDateString()
  @IsOptional()
  checkoutTime?: string;

  @ApiProperty(docs.locationId)
  @IsNumber()
  @IsOptional()
  locationId?: number;
}

export class UpdateTimeDto {
  @ApiProperty(docs.checkoutTime)
  @IsDateString()
  @IsOptional()
  checkInTime?: string;

  @ApiProperty(docs.checkoutTime)
  @IsDateString()
  @IsOptional()
  checkOutTime?: string;

  @ApiProperty(docs.checkInDeviceId)
  @IsOptional()
  @IsString()
  checkInDeviceId?: string;

  @ApiProperty(docs.checkOutDeviceId)
  @IsOptional()
  checkOutDeviceId?: string;

  @ApiProperty(docs.checkInType)
  @IsOptional()
  @IsString()
  checkInType?: string;

  @ApiProperty(docs.checkOutType)
  @IsString()
  @IsOptional()
  checkOutType?: string;
}
