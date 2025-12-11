import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import docs from '../version_manager.docs';

export class createVersionManagerDto {
  @ApiProperty(docs.iosVersion)
  @IsNotEmpty()
  @IsString()
  iosVersion: string;

  @ApiProperty(docs.androidVersion)
  @IsNotEmpty()
  @IsString()
  androidVersion: string;
}
