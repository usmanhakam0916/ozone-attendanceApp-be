import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import docs from '../employee.docs';

export class approveDto {
  @ApiProperty(docs.password)
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty(docs.employeeId)
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;
}
