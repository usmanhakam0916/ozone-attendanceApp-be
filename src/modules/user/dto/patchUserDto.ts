import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import docs from '../user.docs';

import { UserType } from '../user.entity';

export class PatchUserDto {
  @ApiProperty(docs.UserType)
  @IsString()
  @IsOptional()
  type?: UserType;

  @ApiProperty(docs.username)
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty(docs.password)
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty(docs.qrCodeCheckInAllowed)
  @IsBoolean()
  @IsOptional()
  qrCodeCheckInAllowed?: boolean;

  @ApiProperty(docs.faceCheckInAllowed)
  @IsBoolean()
  @IsOptional()
  faceCheckInAllowed?: boolean;

  @IsOptional()
  profileId?: number;
}
