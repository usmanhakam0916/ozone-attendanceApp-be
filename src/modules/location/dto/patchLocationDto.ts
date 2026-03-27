import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import docs from '../location.docs';

export class PatchLocationDto {
  @ApiProperty(docs.name)
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty(docs.qrCode)
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiProperty(docs.lat)
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty(docs.long)
  @IsOptional()
  @IsNumber()
  long?: number;
}
