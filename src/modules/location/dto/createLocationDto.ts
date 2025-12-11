import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import docs from '../location.docs';

export class CreateLocationDto {
  @ApiProperty(docs.name)
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty(docs.qrCode)
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @ApiProperty(docs.lat)
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty(docs.long)
  @IsNotEmpty()
  @IsNumber()
  long: number;
}
