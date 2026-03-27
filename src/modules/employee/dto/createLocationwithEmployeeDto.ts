import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import docs from '../employee.docs';

export class LocationWithEmployeeDto {
  @ApiProperty(docs.locationId)
  @IsNotEmpty()
  @IsNumber()
  locationId: number;

  @ApiProperty(docs.employeeId)
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;
}
