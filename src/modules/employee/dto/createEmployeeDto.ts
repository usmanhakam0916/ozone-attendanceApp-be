import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import docs from '../employee.docs';
import { UserStatus, UserType } from 'src/modules/user/user.entity';

export class CreateEmployeeDto {
  @ApiProperty(docs.attendanceType)
  @IsOptional()
  @IsString()
  attendanceType?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  userType?: UserType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  status?: UserStatus;

  @ApiProperty()
  @IsString()
  employeeNumber?: string;

  @ApiProperty(docs.firstName)
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty(docs.lastName)
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty(docs.attendanceType)
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

  @ApiProperty(docs.multiDevice)
  qrCodeCheckInAllowed?: boolean;

  @ApiProperty(docs.multiDevice)
  faceCheckInAllowed?: boolean;

  @ApiProperty(docs.locations)
  locations?: number[];
}
