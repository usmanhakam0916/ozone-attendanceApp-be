import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import docs from '../employee.docs';

export class OtpVerifyDto {
  @ApiProperty(docs.otp)
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty(docs.email)
  @IsNotEmpty()
  @IsString()
  email: string;
}
