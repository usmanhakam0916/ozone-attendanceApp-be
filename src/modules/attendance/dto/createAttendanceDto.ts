import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import docs from '../attendance.docs';
import locationDocs from '../../location/location.docs';

export class CreateAttendanceDto {
  @ApiProperty(docs.locationId)
  @IsNotEmpty()
  locationId: number;

  @ApiProperty(docs.employeeId)
  @IsNotEmpty()
  employeeId: number;

  @ApiProperty(locationDocs.currentTime)
  @IsOptional()
  currentTime: string;

  @ApiProperty(docs.deviceId)
  @IsOptional()
  deviceId: string;

  @ApiProperty(docs.checkInType)
  @IsString()
  checkInType: string;
}

export class createAttendanceWithParamsDto {
  @ApiProperty(docs.locationId)
  @IsNumber()
  @IsNotEmpty()
  locationId: number;

  @ApiProperty(docs.employeeId)
  @IsNumber()
  @IsNotEmpty()
  employeeId: number;

  @ApiProperty(docs.checkInTime)
  @IsString()
  @IsNotEmpty()
  checkInTime: string;

  @ApiProperty(docs.checkoutTime)
  @IsString()
  @IsNotEmpty()
  checkoutTime: string;

  @ApiProperty(docs.shift)
  @IsString()
  shift: string;

  @ApiProperty(docs.rowId)
  @IsString()
  @IsOptional()
  checkInId: string;

  @ApiProperty(docs.deviceId)
  @IsOptional()
  deviceId: string;

  @ApiProperty(docs.checkInType)
  @IsOptional()
  checkInType: string;

  @ApiProperty(docs.checkOutType)
  @IsOptional()
  checkOutType: string;

  @ApiProperty(docs.checkInDeviceId)
  @IsOptional()
  checkInDeviceId: string;

  @ApiProperty(docs.checkOutDeviceId)
  @IsOptional()
  checkOutDeviceId: string;
}

export class CheckoutDto {
  @ApiProperty(docs.rowId)
  rowId: number;

  @ApiProperty(locationDocs.qrCode)
  @IsString()
  @IsOptional()
  qrCode: string;

  @ApiProperty(locationDocs.currentTime)
  @IsOptional()
  currentTime: string;

  @ApiProperty(docs.deviceId)
  @IsOptional()
  deviceId: string;

  @ApiProperty(docs.checkOutType)
  @IsString()
  checkOutType: string;
}

export class CreateAttendanceWithQRCodeDto {
  @ApiProperty(docs.locationId)
  @IsNotEmpty()
  locationId: number[] | number;

  @ApiProperty(locationDocs.qrCode)
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty(locationDocs.currentTime)
  @IsOptional()
  currentTime: string;

  @ApiProperty(docs.deviceId)
  @IsOptional()
  deviceId: string;

  @ApiProperty(docs.checkInType)
  @IsString()
  checkInType: string;
}
