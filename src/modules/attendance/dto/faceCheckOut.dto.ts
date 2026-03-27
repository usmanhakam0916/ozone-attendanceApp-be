import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import docs from '../attendance.docs';
import locationDocs from '../../location/location.docs';

export class faceCheckOutDto {
  @ApiProperty(docs.rowId)
  @IsString()
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
