import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import docs from '../employee.docs';

export class OtpVerifyDto {
  @ApiProperty(docs.otp)
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty(docs.employeeId)
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;
}
