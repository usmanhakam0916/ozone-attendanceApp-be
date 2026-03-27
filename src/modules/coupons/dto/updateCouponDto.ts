import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import docs from '../coupons.docs';

export class UpdateCouponDto {
  @ApiProperty(docs.employeeNumber)
  @IsNotEmpty()
  @IsNumber()
  employeeNumber: number;
}
