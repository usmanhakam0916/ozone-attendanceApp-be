import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PatchUserDto } from 'src/modules/user/dto/patchUserDto';
import docs from '../employee.docs';

export enum Language {
  EN = 'en',
  AR = 'ar',
}

export class PatchEmployeeDto {
  // @ApiProperty(docs.checkInRowId)
  // @IsString()
  // @IsOptional()
  // checkInRowId: string;

  @ApiProperty(docs.attendanceType)
  @IsOptional()
  @IsString()
  attendanceType?: string;

  @ApiProperty(docs.firstName)
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty(docs.lastName)
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  departmentId?: number;

  @ApiProperty(docs.isMac)
  @IsOptional()
  @IsBoolean()
  isMac?: boolean;

  @ApiProperty(docs.macAddress)
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiProperty(docs.attendanceRadius)
  @IsNumber()
  @IsOptional()
  attendanceRadius?: number;

  @ApiProperty(docs.groupId)
  @IsNumber()
  @IsOptional()
  groupId?: number;

  @ApiProperty(docs.multiDevice)
  multiDevice?: boolean;

  @ApiProperty(docs.locations)
  locations?: number[];
  // @ApiProperty(docs.faceId)
  // @IsOptional()
  // faceId?: number;

  @ApiProperty({ type: () => PatchUserDto })
  @ValidateNested()
  @Type(() => PatchUserDto)
  authUser: PatchUserDto;

  @ApiProperty()
  @IsEnum(Language)
  @IsOptional()
  language?: Language;
}
