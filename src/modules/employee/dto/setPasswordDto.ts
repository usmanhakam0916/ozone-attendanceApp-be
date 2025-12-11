import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import docs from '../employee.docs';

export class SetPasswordDto {
  @ApiProperty(docs.otp)
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty(docs.employeeId)
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  @ApiProperty(docs.password)
  @IsNotEmpty()
  @IsString()
  password: string;
}
